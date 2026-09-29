"""
Static demo customer data.
These are realistic synthetic B2B SaaS customers — no real company or personal data.
"""

from backend.models.schemas import Customer, CustomerEnvironment

CUSTOMERS: dict[str, Customer] = {
    "acme-corp": Customer(
        id="acme-corp",
        name="Acme Corporation",
        domain="acme.example.com",
        plan="Enterprise",
        environment=CustomerEnvironment(
            nodejs_version="20.x",
            postgres_version="14",
            redis_version="7.0",
            cloud_provider="AWS",
            infrastructure="Docker / ECS",
            plan="Enterprise",
        ),
        known_issues=["API timeout", "Connection pool exhaustion"],
        preferences=["Prefers concise troubleshooting steps", "Technical audience"],
    ),
    "novatech": Customer(
        id="novatech",
        name="NovaTech Solutions",
        domain="novatech.example.com",
        plan="Growth",
        environment=CustomerEnvironment(
            nodejs_version="18.x",
            postgres_version="15",
            redis_version="6.2",
            cloud_provider="GCP",
            infrastructure="Kubernetes / GKE",
            plan="Growth",
        ),
        known_issues=["Webhook delivery delays", "Rate limiting"],
        preferences=["Wants step-by-step guides", "Non-technical primary contact"],
    ),
    "cloudpeak": Customer(
        id="cloudpeak",
        name="CloudPeak Inc.",
        domain="cloudpeak.example.com",
        plan="Enterprise",
        environment=CustomerEnvironment(
            nodejs_version="21.x",
            postgres_version="16",
            cloud_provider="Azure",
            infrastructure="Azure AKS",
            plan="Enterprise",
        ),
        known_issues=["Authentication errors", "OAuth token refresh issues"],
        preferences=["Detailed logs requested", "Prefers async updates"],
    ),
    "datasphere": Customer(
        id="datasphere",
        name="DataSphere Analytics",
        domain="datasphere.example.com",
        plan="Professional",
        environment=CustomerEnvironment(
            nodejs_version="20.x",
            postgres_version="15",
            redis_version="7.2",
            cloud_provider="AWS",
            infrastructure="EC2 + RDS",
            plan="Professional",
        ),
        known_issues=["Slow query performance", "Database connection failures"],
        preferences=["Prefers email updates", "Has DBA on team"],
    ),
}


# ── Demo ticket history (used by dashboard / history page) ──────────────────

DEMO_TICKETS: dict[str, list[dict]] = {
    "acme-corp": [
        {
            "id": "ACME-001",
            "title": "API requests timing out under load",
            "category": "API Timeout",
            "status": "resolved",
            "created_at": "2024-10-15T09:00:00Z",
            "resolved_at": "2024-10-15T14:30:00Z",
            "summary": "Enterprise API endpoints timing out. Root cause: connection pool exhausted. Resolution: increased pool size from 10 to 50.",
            "solution": "Increased database connection pool size",
            "outcome": "resolved",
        },
        {
            "id": "ACME-002",
            "title": "Intermittent 503 errors on /api/data endpoint",
            "category": "API Timeout",
            "status": "resolved",
            "created_at": "2024-11-02T11:00:00Z",
            "resolved_at": "2024-11-02T16:00:00Z",
            "summary": "503 errors during peak hours. Clearing cache did NOT fix the issue. Adding connection retry logic resolved it.",
            "failed_attempts": ["Cleared application cache — did not resolve"],
            "solution": "Added exponential backoff retry logic",
            "outcome": "resolved",
        },
        {
            "id": "ACME-003",
            "title": "API timeouts after PostgreSQL upgrade to v15",
            "category": "Database",
            "status": "investigating",
            "created_at": "2024-12-01T08:00:00Z",
            "summary": "Customer upgraded PostgreSQL from 14 to 15. API timeouts re-emerged. Connection pool settings may need retuning for PG15.",
            "outcome": "open",
        },
    ],
    "novatech": [
        {
            "id": "NOVA-001",
            "title": "Webhook events delayed by 10-15 minutes",
            "category": "Webhook",
            "status": "resolved",
            "created_at": "2024-09-20T10:00:00Z",
            "resolved_at": "2024-09-21T09:00:00Z",
            "summary": "Webhook delivery queue backed up on GKE. Increased worker replicas and queue concurrency.",
            "solution": "Scaled webhook worker replicas from 2 to 8",
            "outcome": "resolved",
        },
        {
            "id": "NOVA-002",
            "title": "Rate limit errors on bulk import endpoint",
            "category": "Rate Limiting",
            "status": "resolved",
            "created_at": "2024-10-10T14:00:00Z",
            "resolved_at": "2024-10-10T17:00:00Z",
            "summary": "Growth plan rate limits too restrictive for batch operations. Temporary limit increase granted.",
            "solution": "Temporary rate limit exception applied; customer moved to Enterprise batch endpoint",
            "outcome": "resolved",
        },
        {
            "id": "NOVA-003",
            "title": "Webhook failures after Kubernetes upgrade",
            "category": "Webhook",
            "status": "open",
            "created_at": "2024-12-05T09:00:00Z",
            "summary": "After GKE 1.29 upgrade, webhook delivery failing intermittently. Investigating network policy changes.",
            "outcome": "open",
        },
    ],
    "cloudpeak": [
        {
            "id": "CLOUD-001",
            "title": "OAuth tokens not refreshing automatically",
            "category": "Authentication",
            "status": "resolved",
            "created_at": "2024-10-01T08:30:00Z",
            "resolved_at": "2024-10-01T12:00:00Z",
            "summary": "Azure AD OAuth tokens expiring without automatic refresh. Updated token refresh interval configuration.",
            "solution": "Set token_refresh_threshold to 300 seconds",
            "outcome": "resolved",
        },
        {
            "id": "CLOUD-002",
            "title": "Authentication failures under high concurrency",
            "category": "Authentication",
            "status": "resolved",
            "created_at": "2024-11-15T10:00:00Z",
            "resolved_at": "2024-11-15T15:00:00Z",
            "summary": "JWT validation failing under load. Thread-safety issue in token validation middleware.",
            "solution": "Updated to thread-safe JWT validation library",
            "outcome": "resolved",
        },
    ],
    "datasphere": [
        {
            "id": "DATA-001",
            "title": "Slow analytics queries on large datasets",
            "category": "Performance",
            "status": "resolved",
            "created_at": "2024-09-15T11:00:00Z",
            "resolved_at": "2024-09-16T10:00:00Z",
            "summary": "Analytical queries taking 30+ seconds on 100M row tables. Added missing composite index.",
            "solution": "Added composite index on (tenant_id, created_at, status)",
            "outcome": "resolved",
        },
        {
            "id": "DATA-002",
            "title": "Database connection pool exhaustion during ETL jobs",
            "category": "Database",
            "status": "resolved",
            "created_at": "2024-11-20T07:00:00Z",
            "resolved_at": "2024-11-20T11:00:00Z",
            "summary": "Nightly ETL jobs consuming all available connections. Implemented connection pool partitioning.",
            "solution": "Partitioned connection pool: ETL gets dedicated 20-connection pool",
            "outcome": "resolved",
        },
        {
            "id": "DATA-003",
            "title": "Intermittent connection timeouts to RDS",
            "category": "Database",
            "status": "investigating",
            "created_at": "2024-12-10T06:00:00Z",
            "summary": "Intermittent RDS connection timeouts. Suspected network ACL change in AWS. Under investigation.",
            "outcome": "open",
        },
    ],
}


def get_customer_tickets(customer_id: str) -> list[dict]:
    return DEMO_TICKETS.get(customer_id, [])
