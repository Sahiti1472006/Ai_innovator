"""
Support Agent Orchestrator
Implements the core memory workflow per chat turn:

  1. RECALL   — retrieve relevant memories from Hindsight before answering
  2. LLM      — generate personalized response using recalled context
  3. RETAIN   — store new facts learned from this exchange back into Hindsight

This is the main differentiator: every response is informed by memory,
and every exchange enriches the memory for future tickets.
"""

import logging
import uuid
from typing import Optional

from backend.services.hindsight_service import HindsightService, HindsightServiceError
from backend.services.llm_service import chat_completion, extract_facts_to_retain, LLMServiceError
from backend.models.schemas import (
    ChatMessage,
    MemoryEvent,
    WhyRecommendation,
    ChatResponse,
    RecallResult,
)

logger = logging.getLogger(__name__)

hindsight = HindsightService()


def _format_recalled_context(results: list[dict]) -> tuple[str, list[str]]:
    """
    Convert raw Hindsight recall results into a readable context string
    and a list of human-readable snippets for the UI.
    """
    if not results:
        return "", []

    lines = []
    snippets = []

    for r in results:
        text = r.get("text", "").strip()
        mem_type = r.get("type", "")
        context = r.get("context", "")
        entities = r.get("entities") or []

        if not text:
            continue

        line = f"[{mem_type}] {text}"
        if context:
            line += f" (context: {context})"
        if entities:
            line += f" — entities: {', '.join(entities)}"

        lines.append(line)
        # Short snippet for the UI panel (first 120 chars)
        snippets.append(text[:120] + ("…" if len(text) > 120 else ""))

    return "\n".join(lines), snippets


async def run_support_turn(
    customer_id: str,
    message: str,
    session_id: Optional[str],
    conversation_history: list[ChatMessage],
) -> ChatResponse:
    """
    Execute a single support conversation turn with full memory integration.

    Returns ChatResponse containing:
      - AI message
      - memory_events (RECALL results, RETAIN confirmation, any REFLECT)
      - why (which memories influenced the response)
      - active_context (what the LLM actually saw)
    """
    if not session_id:
        session_id = str(uuid.uuid4())

    memory_events: list[MemoryEvent] = []
    recall_snippets: list[str] = []
    recall_ids: list[str] = []
    recalled_context = ""

    # ── 1. RECALL ─────────────────────────────────────────────────────────────
    try:
        recall_data = await hindsight.recall(
            bank_id=customer_id,
            query=message,
            types=["world", "experience", "observation"],
            budget="mid",
            tags=[customer_id],
        )
        results = recall_data.get("results", [])
        recalled_context, recall_snippets = _format_recalled_context(results)
        recall_ids = [r.get("id", "") for r in results if r.get("id")]

        memory_events.append(MemoryEvent(
            operation="recall",
            status="success",
            count=len(results),
            items=recall_snippets[:6],  # show up to 6 snippets in UI
            detail=f"{len(results)} relevant memories retrieved",
        ))
        logger.info("Recall: %d results for customer=%s", len(results), customer_id)

    except HindsightServiceError as e:
        logger.warning("Recall failed for customer=%s: %s", customer_id, e)
        memory_events.append(MemoryEvent(
            operation="recall",
            status="error",
            count=0,
            items=[],
            detail=f"Memory recall unavailable: {str(e)[:100]}",
        ))

    # ── 2. LLM — generate response using recalled context ────────────────────
    messages = [
        {"role": m.role, "content": m.content}
        for m in conversation_history
    ]
    messages.append({"role": "user", "content": message})

    try:
        ai_reply = await chat_completion(
            messages=messages,
            recalled_context=recalled_context if recalled_context else None,
        )
    except LLMServiceError as e:
        logger.error("LLM failed: %s", e)
        ai_reply = (
            "I'm sorry, I'm having trouble connecting to the AI service right now. "
            "Please try again in a moment."
        )

    # ── 3. RETAIN — extract and store facts from this exchange ───────────────
    try:
        # Extract concise facts from the exchange
        facts_text = await extract_facts_to_retain(message, ai_reply)

        # Retain with ticket/session scoping
        retain_result = await hindsight.retain(
            bank_id=customer_id,
            content=facts_text,
            document_id=f"session_{session_id}",
            context=f"Support session {session_id}",
            metadata={"session_id": session_id, "customer_id": customer_id},
            tags=[customer_id],
        )

        retained_count = retain_result.get("items_count", 1)
        retain_preview = facts_text[:200].split("\n")
        retain_snippets = [s.strip() for s in retain_preview if s.strip()][:4]

        memory_events.append(MemoryEvent(
            operation="retain",
            status="success",
            count=retained_count,
            items=retain_snippets,
            detail=f"New facts stored to memory bank '{customer_id}'",
        ))
        logger.info("Retain: stored facts for customer=%s session=%s", customer_id, session_id)

    except HindsightServiceError as e:
        logger.warning("Retain failed for customer=%s: %s", customer_id, e)
        memory_events.append(MemoryEvent(
            operation="retain",
            status="error",
            count=0,
            items=[],
            detail=f"Memory retain unavailable: {str(e)[:100]}",
        ))

    # ── Build response ────────────────────────────────────────────────────────
    why = WhyRecommendation(
        memory_ids=recall_ids[:4],
        snippets=recall_snippets[:4],
    ) if recall_snippets else None

    active_context = recalled_context[:600] + "…" if len(recalled_context) > 600 else recalled_context

    return ChatResponse(
        message=ai_reply,
        session_id=session_id,
        memory_events=memory_events,
        why=why,
        active_context=active_context or None,
    )
