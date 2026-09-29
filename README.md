# SupportMind AI

> **B2B Technical Customer Support AI Agent with Hindsight persistent memory**
>
> A hackathon project demonstrating how AI support agents learn from every interaction using [Hindsight by Vectorize](https://hindsight.vectorize.io/).

---

## The Problem

Traditional AI support agents are stateless. Every ticket starts from scratch:

- "What's your tech stack?" — asked every single time
- "Have you tried…?" — suggesting solutions that already failed
- No recognition of recurring patterns across tickets
- No improvement over time

**The result:** customers are frustrated, and support is generic.

---

## The Solution: Memory-Driven Support

SupportMind AI uses **Hindsight** to give the support agent persistent, structured memory:

| Without Memory | With Hindsight Memory |
|---|---|
| "What version of PostgreSQL are you running?" | "I see you're on PostgreSQL 15 since your upgrade last week" |
| Suggests cache clearing (already tried, failed) | Recalls that cache clearing didn't work and skips it |
| Generic troubleshooting | Personalized to this customer's environment |
| Every ticket is fresh | Cross-ticket learning and pattern recognition |

---

## Key Features

- 🧠 Persistent customer memory with Hindsight
- 🔎 Cross-ticket semantic recall
- 💬 Personalized technical support responses
- 📝 Automatic retention of new support facts
- 📊 REFLECT-powered support insights
- 👤 Customer-specific Hindsight memory banks
- ⚡ Real-time Memory Engine showing RECALL and RETAIN activity
- 🧪 Four realistic synthetic B2B customer profiles

---

## Architecture

```mermaid
graph TD
    User["Customer Browser"]
    FE["Next.js Frontend<br/>TypeScript + Tailwind"]
    BE["FastAPI Backend<br/>Python"]
    Groq["Groq LLM<br/>openai/gpt-oss-120b"]
    HS["Hindsight Cloud<br/>Memory Banks"]

    User -->|message| FE
    FE -->|POST /api/chat| BE
    BE -->|"① RECALL — retrieve relevant memories"| HS
    HS -->|"recalled facts + context"| BE
    BE -->|"② LLM — generate response with memory context"| Groq
    Groq -->|"personalized response"| BE
    BE -->|"③ RETAIN — store new facts"| HS
    BE -->|"response + memory events"| FE
    FE -->|"displays Memory Engine panel"| User

Technology Stack
Layer	Technology
Frontend	Next.js 14, React 18, TypeScript, Tailwind CSS
Backend	Python, FastAPI, httpx
LLM	Groq API — openai/gpt-oss-120b (env-configurable)
Memory	Hindsight Cloud REST API v0.10
How Hindsight Is Used

SupportMind AI uses all three core Hindsight operations via its REST API.

Memory Banks

Each customer has their own Hindsight memory bank (bank_id = customer_id, e.g., acme-corp).
This provides clean isolation between customers.

RETAIN — Storing new facts

Called after every support exchange to store extracted facts.

Endpoint: POST /v1/default/banks/{bank_id}/memories

Implementation note: The example below illustrates the RETAIN operation. The actual implementation uses the Hindsight REST API through httpx.

await hindsight.retain(
    bank_id="acme-corp",
    content="Customer upgraded PostgreSQL from v14 to v15. API timeouts re-emerged post-upgrade.",
    document_id="session_abc123",
    context="Support session",
    tags=["acme-corp"],
)

What gets retained:

Customer environment details (Node.js version, PostgreSQL version, infrastructure)
Problem descriptions and symptoms
Solutions attempted (successful and failed)
Outcomes and resolutions
Customer preferences
RECALL — Retrieving relevant memories

Called before generating every response. Uses semantic similarity and spreading activation.

Endpoint: POST /v1/default/banks/{bank_id}/memories/recall

Implementation note: The example below illustrates the RECALL operation. The actual implementation uses the Hindsight REST API through httpx.

result = await hindsight.recall(
    bank_id="acme-corp",
    query="API requests are timing out",
    types=["world", "experience", "observation"],
    budget="mid",
    tags=["acme-corp"],
)
# result["results"] = [{ "text": "...", "type": "experience", "entities": [...] }]

What gets recalled:

Previous tickets with similar issues
Customer's technical environment
Previously tried solutions (including failed ones)
Customer preferences and communication style
REFLECT — Synthesizing insights

Called from the Support Insights page to identify patterns across accumulated memories.

Endpoint: POST /v1/default/banks/{bank_id}/reflect

Implementation note: The example below illustrates the REFLECT operation. The actual implementation uses the Hindsight REST API through httpx.

result = await hindsight.reflect(
    bank_id="acme-corp",
    query="What recurring patterns exist in API timeout issues?",
    budget="low",
    include_facts=True,
)
# result["text"] = synthesized markdown insight
# result["based_on"]["memories"] = evidence list
Demo Scenario

This scenario demonstrates the complete memory loop in about 60–90 seconds.

Step 1 — First ticket (Acme Corporation)

Customer: "Our API requests are timing out."

The agent asks for environment details.
Customer: "We're using Node.js 20, PostgreSQL 14, Enterprise plan."

Agent suggests connection pool investigation.
Customer: "Increasing the connection pool fixed the issue!"

Hindsight RETAIN stores:

Environment: Node.js 20, PostgreSQL 14, Enterprise
Problem: API timeout
Root cause: connection pool exhaustion
Successful fix: increased connection pool size
Step 2 — New ticket (same customer, later)

Click New Conversation.

Customer: "We're experiencing API timeouts again."

Hindsight RECALL fires — retrieves previous ticket facts.

Agent responds: "I recall your previous API timeout — you were on Node.js 20, PostgreSQL 14, and the issue was resolved by increasing the connection pool. Let me check if the same configuration is involved…"

The Memory Engine panel shows:

RECALL
3 relevant memories found
• API timeout resolved by connection pool increase
• Node.js 20, PostgreSQL 14 environment
• Enterprise plan customer
Step 3 — Environment update

Customer: "We upgraded PostgreSQL from 14 to 15 yesterday."

Hindsight RETAIN stores the environment change.

Memory panel shows:

RETAIN
+ New fact retained
PostgreSQL upgraded from v14 to v15
Step 4 — Support Insights (REFLECT)

Navigate to Support Insights page.

Select Acme Corporation and click Run REFLECT.

Hindsight synthesizes from all accumulated memories and may show:

Recurring Pattern:
PostgreSQL upgrade → connection pool configuration change
→ API timeout recurrence

Observed across multiple tickets for this customer.
Project Structure
Ai_innovator/
├── backend/
│   ├── main.py                      # FastAPI app entry point
│   ├── config.py                    # Pydantic settings from env
│   ├── routes/
│   │   ├── chat.py                  # POST /api/chat
│   │   ├── customers.py             # Customer endpoints
│   │   └── insights.py              # POST /api/insights/reflect
│   ├── services/
│   │   ├── hindsight_service.py     # Hindsight retain/recall/reflect client
│   │   ├── llm_service.py           # Groq LLM calls
│   │   └── support_agent.py         # Main orchestrator
│   ├── models/
│   │   └── schemas.py               # Pydantic models
│   ├── data/
│   │   ├── customers.py             # Demo customer data
│   │   └── seed_data.py             # Memory bank seeder
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Support Chat (main)
│   │   ├── history/page.tsx         # Customer History
│   │   └── insights/page.tsx        # Support Insights
│   ├── components/
│   │   ├── chat/                    # Chat UI components
│   │   ├── memory/                  # Memory Engine panel
│   │   └── ui/                      # Shared primitives
│   ├── lib/
│   │   ├── api.ts                   # Typed API client
│   │   └── types.ts                 # Shared TypeScript types
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
Installation
Prerequisites
Python 3.11+
Node.js 18+ and npm
Groq API key (get one)
Hindsight Cloud account (sign up)
1. Clone and set up environment variables
cd Ai_innovator
cp .env.example .env
# Edit .env with your real API keys
2. Install backend dependencies
cd backend
pip install -r requirements.txt
3. Install frontend dependencies
cd ../frontend
npm install
Environment Variables
Variable	Required	Description
GROQ_API_KEY	Yes	Your Groq API key
GROQ_MODEL	No	LLM model (default: openai/gpt-oss-120b)
HINDSIGHT_BASE_URL	Yes	Your Hindsight Cloud instance URL
HINDSIGHT_API_KEY	Yes	Your Hindsight API key
CORS_ORIGINS	No	Frontend origin (default: http://localhost:3000)
Running the Application
Backend
cd Ai_innovator
uvicorn backend.main:app --reload --port 8000

API docs available at: http://localhost:8000/docs

Seed demo data (run once)
cd Ai_innovator
python -m backend.data.seed_data

This loads historical ticket data for all 4 demo customers into their Hindsight memory banks.

Frontend
cd Ai_innovator/frontend
npm run dev

Open: http://localhost:3000

Example Interaction
User:  "Our API requests are timing out."

[RECALL: 3 relevant memories found]
  • API timeout resolved by connection pool increase (experience)
  • Node.js 20, PostgreSQL 14 environment (world)
  • Enterprise plan, prefers concise steps (world)

Agent: "I can see you've had a similar issue before. Based on your Node.js 20 /
        PostgreSQL 14 Enterprise environment, the previous timeout was caused by
        connection pool exhaustion and was resolved by increasing the pool size.
        Let's check if that's the case again..."

[RETAIN: 2 facts stored]
  + Customer reporting API timeout again
  + Current session context stored

Limitations:

Hindsight REFLECT requires an LLM configured on the Hindsight Cloud instance
The openai/gpt-oss-120b model requires Groq API access
Demo data seeder must be run before the cross-ticket memory demo works out-of-the-box
Hindsight processes retain operations synchronously — first response may be slower

Future Improvements:

Real-time streaming responses (SSE)
Multi-tenant isolation (per-user memory banks)
Ticket severity detection from memory patterns
Proactive insight alerts ("3 customers reported this issue this week")
Webhook integration for automatic ticket creation
Memory export / audit log viewer
