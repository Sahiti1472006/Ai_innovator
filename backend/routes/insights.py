"""
Insights route — uses Hindsight REFLECT to synthesize patterns across support memory.
  POST /api/insights/reflect
"""

import logging
from fastapi import APIRouter, HTTPException

from backend.models.schemas import InsightsRequest, InsightsResponse
from backend.services.hindsight_service import HindsightService, HindsightServiceError
from backend.data.customers import CUSTOMERS

logger = logging.getLogger(__name__)
router = APIRouter()
hindsight = HindsightService()

# A single shared bank for global reflect queries
GLOBAL_BANK_ID = "supportmind-global"


@router.post("/insights/reflect", response_model=InsightsResponse)
async def reflect_insights(req: InsightsRequest) -> InsightsResponse:
    """
    Call Hindsight REFLECT to generate synthesized support insights.

    If customer_id is given, reflects only on that customer's bank.
    Otherwise uses the first available customer bank (or the global bank).

    The query drives what pattern/insight Hindsight synthesizes.
    """
    # Choose which bank to reflect on
    if req.customer_id:
        if req.customer_id not in CUSTOMERS:
            raise HTTPException(status_code=404, detail=f"Customer '{req.customer_id}' not found")
        bank_id = req.customer_id
    else:
        # Use the first customer bank as the default for global insights
        bank_id = next(iter(CUSTOMERS.keys()))

    try:
        result = await hindsight.reflect(
            bank_id=bank_id,
            query=req.query,
            budget="low",
            max_tokens=2048,
            include_facts=True,
        )

        based_on_snippets = []
        based_on = result.get("based_on") or {}
        memories = based_on.get("memories") or []
        for m in memories[:6]:
            text = m.get("text", "")
            if text:
                based_on_snippets.append(text[:120] + ("…" if len(text) > 120 else ""))

        return InsightsResponse(
            text=result.get("text", "No insights generated."),
            based_on=based_on_snippets,
            query=req.query,
        )

    except HindsightServiceError as e:
        logger.error("Reflect failed for bank=%s: %s", bank_id, e)
        raise HTTPException(
            status_code=503,
            detail=f"Memory reflection service unavailable: {str(e)[:200]}",
        )
