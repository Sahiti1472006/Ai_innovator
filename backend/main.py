"""
SupportMind AI — FastAPI backend entry point
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.routes import chat, customers, insights

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("SupportMind AI starting up")
    logger.info("Groq model: %s", settings.groq_model)
    logger.info("Hindsight base URL: %s", settings.hindsight_base_url)
    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY is not set — LLM calls will fail")
    if not settings.hindsight_api_key:
        logger.warning("HINDSIGHT_API_KEY is not set — memory operations may fail")
    yield
    logger.info("SupportMind AI shutting down")


app = FastAPI(
    title="SupportMind AI",
    description="B2B Technical Support AI Agent with Hindsight persistent memory",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(customers.router, prefix="/api", tags=["Customers"])
app.include_router(insights.router, prefix="/api", tags=["Insights"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "SupportMind AI"}


@app.get("/")
async def root():
    return {
        "service": "SupportMind AI",
        "version": "1.0.0",
        "docs": "/docs",
    }
