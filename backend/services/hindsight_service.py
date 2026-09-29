"""
Hindsight Memory Service — direct HTTP client for Hindsight Cloud REST API v0.10.
API base: https://<instance>.hindsight.vectorize.io

Core operations:
  - retain   POST /v1/default/banks/{bank_id}/memories
  - recall   POST /v1/default/banks/{bank_id}/memories/recall
  - reflect  POST /v1/default/banks/{bank_id}/reflect
"""

import logging
from typing import Optional, Any
import httpx

from backend.config import get_settings

logger = logging.getLogger(__name__)


class HindsightServiceError(Exception):
    """Raised when a Hindsight API call fails."""
    pass


class HindsightService:
    def __init__(self):
        settings = get_settings()
        self.base_url = settings.hindsight_base_url.rstrip("/")
        self.api_key = settings.hindsight_api_key
        self._headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}" if self.api_key else "",
        }

    def _bank_url(self, bank_id: str, path: str) -> str:
        return f"{self.base_url}/v1/default/banks/{bank_id}{path}"

    # ── RETAIN ───────────────────────────────────────────────────────────────

    async def retain(
        self,
        bank_id: str,
        content: str,
        document_id: Optional[str] = None,
        context: Optional[str] = None,
        metadata: Optional[dict[str, str]] = None,
        tags: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """
        Retain memory items in the specified bank.
        Uses synchronous processing (async=false) so we know it succeeded.
        """
        item: dict[str, Any] = {"content": content}
        if document_id:
            item["document_id"] = document_id
        if context:
            item["context"] = context
        if metadata:
            item["metadata"] = metadata
        if tags:
            item["tags"] = tags

        payload = {"items": [item], "async": False}

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                resp = await client.post(
                    self._bank_url(bank_id, "/memories"),
                    json=payload,
                    headers=self._headers,
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                logger.error("Hindsight retain error %s: %s", e.response.status_code, e.response.text)
                raise HindsightServiceError(f"Retain failed ({e.response.status_code}): {e.response.text}") from e
            except httpx.RequestError as e:
                logger.error("Hindsight retain connection error: %s", e)
                raise HindsightServiceError(f"Retain connection error: {e}") from e

    async def retain_batch(
        self,
        bank_id: str,
        items: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Retain multiple memory items in a single call."""
        payload = {"items": items, "async": False}
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                resp = await client.post(
                    self._bank_url(bank_id, "/memories"),
                    json=payload,
                    headers=self._headers,
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                logger.error("Hindsight retain_batch error %s: %s", e.response.status_code, e.response.text)
                raise HindsightServiceError(f"Retain batch failed ({e.response.status_code})") from e
            except httpx.RequestError as e:
                raise HindsightServiceError(f"Retain batch connection error: {e}") from e

    # ── RECALL ────────────────────────────────────────────────────────────────

    async def recall(
        self,
        bank_id: str,
        query: str,
        types: Optional[list[str]] = None,
        budget: str = "mid",
        max_tokens: int = 4096,
        tags: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """
        Recall relevant memories using semantic similarity + spreading activation.
        Returns: { "results": [{ "id", "text", "type", "entities", "context" }] }
        """
        payload: dict[str, Any] = {
            "query": query,
            "budget": budget,
            "max_tokens": max_tokens,
        }
        if types:
            payload["types"] = types
        if tags:
            payload["tags"] = tags
            payload["tags_match"] = "any"

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(
                    self._bank_url(bank_id, "/memories/recall"),
                    json=payload,
                    headers=self._headers,
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                logger.error("Hindsight recall error %s: %s", e.response.status_code, e.response.text)
                raise HindsightServiceError(f"Recall failed ({e.response.status_code}): {e.response.text}") from e
            except httpx.RequestError as e:
                logger.error("Hindsight recall connection error: %s", e)
                raise HindsightServiceError(f"Recall connection error: {e}") from e

    # ── REFLECT ───────────────────────────────────────────────────────────────

    async def reflect(
        self,
        bank_id: str,
        query: str,
        budget: str = "low",
        max_tokens: int = 4096,
        tags: Optional[list[str]] = None,
        include_facts: bool = True,
    ) -> dict[str, Any]:
        """
        Reflect and synthesize insights using accumulated memories.
        The LLM reasons over world facts, observations, and mental models.
        Returns: { "text": "markdown answer", "based_on": { "memories": [...] } }
        """
        payload: dict[str, Any] = {
            "query": query,
            "budget": budget,
            "max_tokens": max_tokens,
            "include": {"facts": {} } if include_facts else {},
        }
        if tags:
            payload["tags"] = tags

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                resp = await client.post(
                    self._bank_url(bank_id, "/reflect"),
                    json=payload,
                    headers=self._headers,
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                logger.error("Hindsight reflect error %s: %s", e.response.status_code, e.response.text)
                raise HindsightServiceError(f"Reflect failed ({e.response.status_code}): {e.response.text}") from e
            except httpx.RequestError as e:
                logger.error("Hindsight reflect connection error: %s", e)
                raise HindsightServiceError(f"Reflect connection error: {e}") from e

    # ── HEALTH ────────────────────────────────────────────────────────────────

    async def health(self) -> bool:
        """Check if Hindsight is reachable."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(f"{self.base_url}/health", headers=self._headers)
                return resp.status_code == 200
            except Exception:
                return False
