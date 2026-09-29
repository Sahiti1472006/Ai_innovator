"""Chat route — POST /api/chat"""

import logging
from fastapi import APIRouter, HTTPException

from backend.models.schemas import ChatRequest, ChatResponse
from backend.services.support_agent import run_support_turn

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    """
    Main support chat endpoint.

    Workflow per turn:
      1. Recall relevant memories from Hindsight
      2. Generate LLM response with memory context
      3. Retain new facts back to Hindsight
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if not req.customer_id.strip():
        raise HTTPException(status_code=400, detail="customer_id is required")

    try:
        response = await run_support_turn(
            customer_id=req.customer_id,
            message=req.message,
            session_id=req.session_id,
            conversation_history=req.conversation_history,
        )
        return response
    except Exception as e:
        logger.error("Unexpected error in chat endpoint: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error. Please try again.")
