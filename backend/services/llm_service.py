"""
LLM Service — Groq API via OpenAI-compatible endpoint.
Model is configurable via GROQ_MODEL env var (default: openai/gpt-oss-120b).
"""

import logging
from typing import Optional
import httpx

from backend.config import get_settings

logger = logging.getLogger(__name__)


class LLMServiceError(Exception):
    pass


SYSTEM_PROMPT = """You are SupportMind AI, an expert B2B technical support engineer.

Your role:
- Diagnose and resolve technical issues for enterprise customers
- Give clear, actionable troubleshooting steps
- Draw on the customer's history and environment to personalize responses
- Avoid asking for information you already know from memory
- Remember successful and failed solutions from previous tickets

Tone: Professional, technically precise, empathetic. Concise unless detail is needed.

IMPORTANT: When you have memory context about a customer, USE IT. Reference their specific
environment, previous tickets, and known issues. Do not ask generic questions if the answer
is already in your context.
"""


def _build_system_message(recalled_context: Optional[str]) -> str:
    """Merge base system prompt with recalled customer context."""
    if not recalled_context:
        return SYSTEM_PROMPT
    return (
        SYSTEM_PROMPT
        + "\n\n--- CUSTOMER MEMORY CONTEXT ---\n"
        + recalled_context
        + "\n--- END CONTEXT ---\n"
        + "\nUse the above context to personalize your response."
    )


async def chat_completion(
    messages: list[dict],
    recalled_context: Optional[str] = None,
    temperature: float = 0.4,
    max_tokens: int = 1024,
) -> str:
    """
    Call Groq's OpenAI-compatible chat completions endpoint.
    Injects recalled memory context into the system prompt.

    Returns the assistant's reply text.
    """
    settings = get_settings()

    system_message = {"role": "system", "content": _build_system_message(recalled_context)}
    full_messages = [system_message] + messages

    payload = {
        "model": settings.groq_model,
        "messages": full_messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(
                f"{settings.groq_base_url}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            logger.error("Groq API error %s: %s", e.response.status_code, e.response.text)
            raise LLMServiceError(f"LLM call failed ({e.response.status_code}): {e.response.text}") from e
        except httpx.RequestError as e:
            logger.error("Groq connection error: %s", e)
            raise LLMServiceError(f"LLM connection error: {e}") from e
        except (KeyError, IndexError) as e:
            raise LLMServiceError(f"Unexpected LLM response shape: {e}") from e


async def extract_facts_to_retain(conversation_turn: str, ai_response: str) -> str:
    """
    Ask the LLM to extract concise facts worth retaining from a single support exchange.
    Returns a plain-text summary of key facts, env details, solutions tried, outcomes.
    """
    settings = get_settings()

    prompt = f"""Extract key facts from this support exchange that are worth remembering for future tickets.
Focus on: environment details, problem description, solutions tried, outcomes, customer preferences.
Write as concise factual statements. Omit generic information.

Customer message: {conversation_turn}

Support agent response: {ai_response}

Key facts to retain (be specific and concise):"""

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": settings.groq_model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 512,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                f"{settings.groq_base_url}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning("Fact extraction failed, retaining raw turn: %s", e)
            # Fall back to retaining the raw turn
            return f"Customer reported: {conversation_turn[:500]}"
