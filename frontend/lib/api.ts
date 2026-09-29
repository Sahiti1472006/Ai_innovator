// Typed API client — all calls go through Next.js rewrite proxy to backend

import type {
  Customer,
  ChatRequest,
  ChatResponse,
  InsightsRequest,
  InsightsResponse,
  DashboardStats,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

// ── Customer endpoints ────────────────────────────────────────────────────────

export async function fetchCustomers(): Promise<Customer[]> {
  return apiFetch<Customer[]>("/customers");
}

export async function fetchCustomer(id: string): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${id}`);
}

export async function fetchCustomerStats(id: string): Promise<DashboardStats> {
  return apiFetch<DashboardStats>(`/customers/${id}/stats`);
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/dashboard");
}

// ── Chat endpoint ─────────────────────────────────────────────────────────────

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// ── Insights / Reflect endpoint ───────────────────────────────────────────────

export async function fetchInsights(req: InsightsRequest): Promise<InsightsResponse> {
  return apiFetch<InsightsResponse>("/insights/reflect", {
    method: "POST",
    body: JSON.stringify(req),
  });
}
