"""
Customers route
  GET  /api/customers             — list all demo customers
  GET  /api/customers/{id}        — get a single customer profile
  GET  /api/customers/{id}/stats  — ticket stats for a customer
"""

import logging
from fastapi import APIRouter, HTTPException

from backend.data.customers import CUSTOMERS, get_customer_tickets
from backend.models.schemas import Customer, DashboardStats

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/customers")
async def list_customers() -> list[Customer]:
    return list(CUSTOMERS.values())


@router.get("/customers/{customer_id}")
async def get_customer(customer_id: str) -> Customer:
    customer = CUSTOMERS.get(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found")
    return customer


@router.get("/customers/{customer_id}/stats")
async def customer_stats(customer_id: str) -> DashboardStats:
    if customer_id not in CUSTOMERS:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found")
    tickets = get_customer_tickets(customer_id)
    resolved = [t for t in tickets if t.get("status") == "resolved"]
    open_ = [t for t in tickets if t.get("status") in ("open", "investigating")]
    recurring = list({t.get("category", "") for t in tickets if t.get("category")})[:5]
    return DashboardStats(
        total_tickets=len(tickets),
        resolved_tickets=len(resolved),
        open_tickets=len(open_),
        customers_count=1,
        recurring_issues=recurring,
    )


@router.get("/dashboard")
async def dashboard_stats() -> DashboardStats:
    """Global dashboard stats across all customers."""
    all_tickets = []
    for cid in CUSTOMERS:
        all_tickets.extend(get_customer_tickets(cid))
    resolved = [t for t in all_tickets if t.get("status") == "resolved"]
    open_ = [t for t in all_tickets if t.get("status") in ("open", "investigating")]
    recurring_counter: dict[str, int] = {}
    for t in all_tickets:
        cat = t.get("category", "")
        if cat:
            recurring_counter[cat] = recurring_counter.get(cat, 0) + 1
    top_recurring = sorted(recurring_counter, key=recurring_counter.get, reverse=True)[:5]  # type: ignore
    return DashboardStats(
        total_tickets=len(all_tickets),
        resolved_tickets=len(resolved),
        open_tickets=len(open_),
        customers_count=len(CUSTOMERS),
        recurring_issues=top_recurring,
    )
