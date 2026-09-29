from pydantic import BaseModel, Field
from typing import Optional, Any
from enum import Enum


# ── Customer / company ──────────────────────────────────────────────────────

class CustomerEnvironment(BaseModel):
    nodejs_version: Optional[str] = None
    postgres_version: Optional[str] = None
    redis_version: Optional[str] = None
    cloud_provider: Optional[str] = None
    infrastructure: Optional[str] = None
    plan: Optional[str] = None
    extra: dict[str, str] = {}


class Customer(BaseModel):
    id: str
    name: str
    domain: str
    plan: str
    environment: CustomerEnvironment
    known_issues: list[str] = []
    preferences: list[str] = []


# ── Chat request / response ──────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    customer_id: str
    message: str
    session_id: Optional[str] = None
    conversation_history: list[ChatMessage] = []


class MemoryEvent(BaseModel):
    """A single memory operation that occurred during a chat turn."""
    operation: str          # "recall" | "retain" | "reflect"
    status: str             # "success" | "error" | "skipped"
    count: Optional[int] = None
    items: list[str] = []   # human-readable memory snippets
    detail: Optional[str] = None


class WhyRecommendation(BaseModel):
    """Explanation of which memories influenced the AI response."""
    memory_ids: list[str] = []
    snippets: list[str] = []


class ChatResponse(BaseModel):
    message: str
    session_id: str
    memory_events: list[MemoryEvent] = []
    why: Optional[WhyRecommendation] = None
    active_context: Optional[str] = None  # the context string fed to the LLM


# ── Hindsight service models ─────────────────────────────────────────────────

class RetainItem(BaseModel):
    content: str
    document_id: Optional[str] = None
    context: Optional[str] = None
    metadata: dict[str, str] = {}
    timestamp: Optional[str] = None


class RetainRequest(BaseModel):
    items: list[RetainItem]
    async_: bool = Field(False, alias="async")

    class Config:
        populate_by_name = True


class RecallRequest(BaseModel):
    query: str
    types: Optional[list[str]] = None  # ["world", "experience", "observation"]
    budget: str = "mid"
    max_tokens: int = 4096
    tags: Optional[list[str]] = None
    tags_match: str = "any"


class RecallResult(BaseModel):
    id: str
    text: str
    type: Optional[str] = None
    entities: Optional[list[str]] = None
    context: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class RecallResponse(BaseModel):
    results: list[RecallResult] = []


class ReflectRequest(BaseModel):
    query: str
    budget: str = "low"
    max_tokens: int = 4096
    tags: Optional[list[str]] = None


class ReflectFact(BaseModel):
    id: str
    text: str
    type: Optional[str] = None


class ReflectBasedOn(BaseModel):
    memories: list[ReflectFact] = []


class ReflectResponse(BaseModel):
    text: str
    based_on: Optional[ReflectBasedOn] = None


# ── Insights page ────────────────────────────────────────────────────────────

class InsightsRequest(BaseModel):
    query: str = "What recurring patterns and insights exist in the support cases?"
    customer_id: Optional[str] = None  # None = global across all customers


class InsightsResponse(BaseModel):
    text: str
    based_on: list[str] = []
    query: str


# ── Dashboard ────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_tickets: int
    resolved_tickets: int
    open_tickets: int
    customers_count: int
    recurring_issues: list[str] = []
