"""
Demo data seeder — loads historical ticket data into Hindsight memory banks.

Run once before demoing:
    cd Ai_innovator
    python -m backend.data.seed_data

This seeds each customer's bank with their ticket history so that:
  - Ticket 002 immediately benefits from Ticket 001's learnings
  - The Reflect endpoint produces meaningful patterns from day one
"""

import asyncio
import logging
import sys

from backend.services.hindsight_service import HindsightService, HindsightServiceError
from backend.data.customers import CUSTOMERS, DEMO_TICKETS

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

hindsight = HindsightService()


# ── Seed content per customer ─────────────────────────────────────────────────

SEED_MEMORIES: dict[str, list[dict]] = {
    "acme-corp": [
        {
            "content": (
                "Acme Corporation is on the Enterprise plan. "
                "Their tech stack: Node.js 20.x, PostgreSQL 14, Redis 7.0, AWS ECS with Docker. "
                "Primary contact prefers concise, technical troubleshooting steps."
            ),
            "document_id": "acme-environment",
            "context": "Customer environment profile",
        },
        {
            "content": (
                "Ticket ACME-001: API requests timing out under load. "
                "Root cause: database connection pool exhausted (pool size was 10). "
                "Failed attempt: clearing application cache — did NOT resolve the issue. "
                "Successful resolution: increased connection pool size from 10 to 50. "
                "Customer confirmed issue resolved after pool increase."
            ),
            "document_id": "acme-ticket-001",
            "context": "Resolved support ticket",
        },
        {
            "content": (
                "Ticket ACME-002: Intermittent 503 errors on /api/data endpoint during peak hours. "
                "Failed attempt: clearing application cache — did NOT resolve the issue. "
                "Successful resolution: added exponential backoff retry logic with jitter. "
                "Note: cache clearing is unlikely to fix connection-pool-related timeouts for Acme."
            ),
            "document_id": "acme-ticket-002",
            "context": "Resolved support ticket",
        },
        {
            "content": (
                "Acme Corporation upgraded PostgreSQL from version 14 to version 15 on 2024-12-01. "
                "Post-upgrade, API timeouts re-emerged. "
                "Current status: investigating whether connection pool settings need retuning for PostgreSQL 15. "
                "Historical pattern: connection pool size was the root cause of previous API timeout incidents."
            ),
            "document_id": "acme-ticket-003",
            "context": "Open ticket — PostgreSQL upgrade investigation",
        },
    ],
    "novatech": [
        {
            "content": (
                "NovaTech Solutions is on the Growth plan. "
                "Their tech stack: Node.js 18.x, PostgreSQL 15, Redis 6.2, GCP with Kubernetes GKE. "
                "Primary contact is non-technical — prefers step-by-step guides with plain language."
            ),
            "document_id": "novatech-environment",
            "context": "Customer environment profile",
        },
        {
            "content": (
                "Ticket NOVA-001: Webhook events delayed by 10-15 minutes. "
                "Root cause: webhook delivery queue backed up on GKE, insufficient worker replicas. "
                "Successful resolution: scaled webhook worker replicas from 2 to 8. "
                "Customer confirmed webhooks delivering within 30 seconds after scaling."
            ),
            "document_id": "novatech-ticket-001",
            "context": "Resolved support ticket",
        },
        {
            "content": (
                "Ticket NOVA-002: Rate limit errors on bulk import endpoint. "
                "Growth plan rate limits were too restrictive for batch operations. "
                "Resolution: temporary rate limit exception granted; customer migrated to Enterprise batch endpoint. "
                "Customer is a candidate for Enterprise plan upgrade."
            ),
            "document_id": "novatech-ticket-002",
            "context": "Resolved support ticket",
        },
        {
            "content": (
                "Ticket NOVA-003 (open): Webhook failures after Kubernetes GKE 1.29 upgrade. "
                "Webhooks delivering intermittently. Suspected network policy changes in GKE 1.29. "
                "Status: actively investigating. NovaTech has had webhook issues before (NOVA-001)."
            ),
            "document_id": "novatech-ticket-003",
            "context": "Open ticket — webhook delivery failure",
        },
    ],
    "cloudpeak": [
        {
            "content": (
                "CloudPeak Inc. is on the Enterprise plan. "
                "Their tech stack: Node.js 21.x, PostgreSQL 16, Azure AKS. "
                "They use Azure Active Directory for OAuth. "
                "Primary contact prefers detailed logs and async email updates."
            ),
            "document_id": "cloudpeak-environment",
            "context": "Customer environment profile",
        },
        {
            "content": (
                "Ticket CLOUD-001: OAuth tokens not refreshing automatically. "
                "Azure AD OAuth tokens expiring without automatic refresh. "
                "Resolution: set token_refresh_threshold to 300 seconds in application config. "
                "Customer confirmed tokens now refresh automatically."
            ),
            "document_id": "cloudpeak-ticket-001",
            "context": "Resolved support ticket",
        },
        {
            "content": (
                "Ticket CLOUD-002: Authentication failures under high concurrency. "
                "JWT validation failing under load. "
                "Root cause: thread-safety issue in token validation middleware. "
                "Resolution: updated to thread-safe JWT validation library (jsonwebtoken v9). "
                "Note: CloudPeak runs high-concurrency workloads on AKS — thread safety is a recurring concern."
            ),
            "document_id": "cloudpeak-ticket-002",
            "context": "Resolved support ticket",
        },
    ],
    "datasphere": [
        {
            "content": (
                "DataSphere Analytics is on the Professional plan. "
                "Their tech stack: Node.js 20.x, PostgreSQL 15, Redis 7.2, AWS EC2 + RDS. "
                "They have an in-house DBA. Prefer email updates. "
                "Work with large datasets — 100M+ row tables are common."
            ),
            "document_id": "datasphere-environment",
            "context": "Customer environment profile",
        },
        {
            "content": (
                "Ticket DATA-001: Slow analytics queries on large datasets (100M rows). "
                "Queries taking 30+ seconds. "
                "Resolution: added composite index on (tenant_id, created_at, status). "
                "Query time reduced to under 2 seconds after indexing."
            ),
            "document_id": "datasphere-ticket-001",
            "context": "Resolved support ticket",
        },
        {
            "content": (
                "Ticket DATA-002: Database connection pool exhaustion during nightly ETL jobs. "
                "ETL jobs consuming all available connections, blocking application traffic. "
                "Resolution: partitioned connection pool — ETL gets a dedicated 20-connection pool, "
                "application gets 30 connections. Issue resolved."
            ),
            "document_id": "datasphere-ticket-002",
            "context": "Resolved support ticket",
        },
        {
            "content": (
                "Ticket DATA-003 (open): Intermittent connection timeouts to AWS RDS. "
                "Timeouts started after suspected AWS network ACL change. "
                "DBA investigating. Status: open."
            ),
            "document_id": "datasphere-ticket-003",
            "context": "Open ticket — RDS connection timeouts",
        },
    ],
}


async def seed_customer(customer_id: str, memories: list[dict]) -> None:
    logger.info("Seeding customer: %s (%d items)", customer_id, len(memories))
    for item in memories:
        content = item["content"]
        doc_id = item.get("document_id")
        ctx = item.get("context")
        try:
            result = await hindsight.retain(
                bank_id=customer_id,
                content=content,
                document_id=doc_id,
                context=ctx,
                tags=[customer_id],
            )
            logger.info("  ✓ Retained: %s (items_count=%s)", doc_id, result.get("items_count"))
        except HindsightServiceError as e:
            logger.error("  ✗ Failed to retain %s: %s", doc_id, e)


async def seed_all() -> None:
    logger.info("=== SupportMind AI — Demo Data Seeder ===")
    logger.info("Seeding %d customers into Hindsight memory banks...\n", len(SEED_MEMORIES))

    for customer_id, memories in SEED_MEMORIES.items():
        customer_name = CUSTOMERS[customer_id].name
        logger.info("── %s (%s) ──", customer_name, customer_id)
        await seed_customer(customer_id, memories)
        logger.info("")

    logger.info("=== Seeding complete ===")
    logger.info("Memory banks seeded: %s", list(SEED_MEMORIES.keys()))
    logger.info("You can now demo the full Ticket 1 → Ticket 2 → Ticket 3 memory workflow.")


if __name__ == "__main__":
    asyncio.run(seed_all())
