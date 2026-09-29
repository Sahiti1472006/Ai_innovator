"use client";

import React, { useState, useEffect } from "react";
import type { Customer, DashboardStats } from "@/lib/types";
import { fetchCustomers, fetchDashboardStats } from "@/lib/api";
import { Card, Badge, StatusDot, SectionHeading, Spinner, EmptyState } from "@/components/ui/primitives";

// Import ticket data from the public API
async function fetchCustomerTickets(customerId: string) {
  const res = await fetch(`/api/customers/${customerId}/stats`);
  if (!res.ok) return null;
  return res.json();
}

const DEMO_TICKETS: Record<string, any[]> = {
  "acme-corp": [
    { id: "ACME-001", title: "API requests timing out under load", category: "API Timeout", status: "resolved", created_at: "2024-10-15", summary: "Connection pool exhausted. Resolution: increased pool size from 10 to 50.", solution: "Increased connection pool size", failed_attempts: [] },
    { id: "ACME-002", title: "Intermittent 503 errors on /api/data endpoint", category: "API Timeout", status: "resolved", created_at: "2024-11-02", summary: "503 errors during peak hours. Cache clearing did NOT fix it.", solution: "Added exponential backoff retry logic", failed_attempts: ["Cleared application cache — did not resolve"] },
    { id: "ACME-003", title: "API timeouts after PostgreSQL upgrade to v15", category: "Database", status: "investigating", created_at: "2024-12-01", summary: "Upgraded PostgreSQL from 14 to 15. API timeouts re-emerged. Investigating connection pool settings for PG15.", failed_attempts: [] },
  ],
  novatech: [
    { id: "NOVA-001", title: "Webhook events delayed by 10-15 minutes", category: "Webhook", status: "resolved", created_at: "2024-09-20", summary: "Webhook queue backed up on GKE. Scaled worker replicas from 2 to 8.", solution: "Scaled webhook workers" },
    { id: "NOVA-002", title: "Rate limit errors on bulk import endpoint", category: "Rate Limiting", status: "resolved", created_at: "2024-10-10", summary: "Growth plan limits too restrictive. Applied temporary exception.", solution: "Moved to Enterprise batch endpoint" },
    { id: "NOVA-003", title: "Webhook failures after Kubernetes upgrade", category: "Webhook", status: "open", created_at: "2024-12-05", summary: "Webhooks failing after GKE 1.29 upgrade. Investigating network policy changes." },
  ],
  cloudpeak: [
    { id: "CLOUD-001", title: "OAuth tokens not refreshing automatically", category: "Authentication", status: "resolved", created_at: "2024-10-01", summary: "Azure AD OAuth tokens expiring. Set token_refresh_threshold to 300s.", solution: "Updated token refresh configuration" },
    { id: "CLOUD-002", title: "Authentication failures under high concurrency", category: "Authentication", status: "resolved", created_at: "2024-11-15", summary: "JWT validation failing under load. Thread-safety issue.", solution: "Updated to thread-safe JWT library" },
  ],
  datasphere: [
    { id: "DATA-001", title: "Slow analytics queries on large datasets", category: "Performance", status: "resolved", created_at: "2024-09-15", summary: "30+ second queries on 100M rows. Added composite index.", solution: "Added composite index (tenant_id, created_at, status)" },
    { id: "DATA-002", title: "DB connection pool exhaustion during ETL", category: "Database", status: "resolved", created_at: "2024-11-20", summary: "ETL consuming all connections. Partitioned connection pool.", solution: "Dedicated 20-connection pool for ETL" },
    { id: "DATA-003", title: "Intermittent RDS connection timeouts", category: "Database", status: "investigating", created_at: "2024-12-10", summary: "Intermittent RDS timeouts after suspected AWS network ACL change." },
  ],
};

const STATUS_BADGE: Record<string, "success" | "warning" | "info"> = {
  resolved: "success",
  open: "warning",
  investigating: "info",
};

const CATEGORY_COLORS: Record<string, string> = {
  "API Timeout": "bg-red-50 text-red-700 border-red-100",
  Database: "bg-blue-50 text-blue-700 border-blue-100",
  Webhook: "bg-orange-50 text-orange-700 border-orange-100",
  Authentication: "bg-purple-50 text-purple-700 border-purple-100",
  Performance: "bg-amber-50 text-amber-700 border-amber-100",
  "Rate Limiting": "bg-pink-50 text-pink-700 border-pink-100",
};

function TicketCard({ ticket }: { ticket: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${ticket.status === "investigating" ? "border-blue-200" : "border-gray-200"}`}>
      <div
        className="flex items-start gap-3 p-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <StatusDot status={ticket.status as any} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{ticket.title}</span>
            <Badge variant={STATUS_BADGE[ticket.status] ?? "default"}>{ticket.status}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[11px] text-gray-400 font-mono">{ticket.id}</span>
            <span className="text-gray-300">·</span>
            <span className={`text-[11px] px-2 py-0.5 rounded border ${CATEGORY_COLORS[ticket.category] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
              {ticket.category}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-[11px] text-gray-400">{ticket.created_at}</span>
          </div>
        </div>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <div className="px-3.5 pb-3.5 border-t border-gray-100 bg-gray-50 space-y-2">
          <p className="text-xs text-gray-700 mt-2.5 leading-relaxed">{ticket.summary}</p>
          {ticket.solution && (
            <div className="flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-emerald-700 font-medium">Solution: {ticket.solution}</span>
            </div>
          )}
          {ticket.failed_attempts?.length > 0 && (
            <div className="space-y-1">
              {ticket.failed_attempts.map((a: string, i: number) => (
                <div key={i} className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-xs text-red-600">Failed: {a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState("acme-corp");
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchDashboardStats()])
      .then(([c, s]) => {
        setCustomers(c);
        setGlobalStats(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedId);
  const tickets = DEMO_TICKETS[selectedId] ?? [];
  const resolved = tickets.filter((t) => t.status === "resolved").length;
  const open = tickets.filter((t) => t.status !== "resolved").length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-900">Customer History</h1>
        <p className="text-xs text-gray-500">Support ticket history — all learned by Hindsight memory</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Customer sidebar */}
        <div className="w-52 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
          <div className="px-3 py-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Customers</div>
            {loading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : (
              customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-colors ${
                    selectedId === c.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{c.plan}</div>
                </button>
              ))
            )}
          </div>

          {/* Global stats */}
          {globalStats && (
            <div className="mx-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Global Stats</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total tickets</span>
                  <span className="font-semibold text-gray-800">{globalStats.total_tickets}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Resolved</span>
                  <span className="font-semibold text-emerald-600">{globalStats.resolved_tickets}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Open</span>
                  <span className="font-semibold text-amber-600">{globalStats.open_tickets}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {selectedCustomer ? (
            <>
              {/* Customer header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {selectedCustomer.name[0]}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</h2>
                    <Badge variant={selectedCustomer.plan === "Enterprise" ? "purple" : "info"}>
                      {selectedCustomer.plan}
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {[
                      selectedCustomer.environment.nodejs_version && `Node.js ${selectedCustomer.environment.nodejs_version}`,
                      selectedCustomer.environment.postgres_version && `PostgreSQL ${selectedCustomer.environment.postgres_version}`,
                      selectedCustomer.environment.cloud_provider,
                    ].filter(Boolean).map((t) => (
                      <span key={t as string} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-center px-4 py-2 bg-white border border-gray-200 rounded-lg">
                    <div className="text-xl font-bold text-gray-900">{tickets.length}</div>
                    <div className="text-[11px] text-gray-500">Total</div>
                  </div>
                  <div className="text-center px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-xl font-bold text-emerald-600">{resolved}</div>
                    <div className="text-[11px] text-emerald-600">Resolved</div>
                  </div>
                  <div className="text-center px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-xl font-bold text-amber-600">{open}</div>
                    <div className="text-[11px] text-amber-600">Open</div>
                  </div>
                </div>
              </div>

              {/* Environment & preferences */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <Card className="p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Known Issues</div>
                  {selectedCustomer.known_issues.length === 0 ? (
                    <div className="text-xs text-gray-400 italic">None on record</div>
                  ) : (
                    <div className="space-y-1">
                      {selectedCustomer.known_issues.map((issue) => (
                        <div key={issue} className="flex items-center gap-1.5 text-xs text-gray-700">
                          <StatusDot status="open" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                <Card className="p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Remembered Preferences</div>
                  {selectedCustomer.preferences.length === 0 ? (
                    <div className="text-xs text-gray-400 italic">No preferences recorded yet</div>
                  ) : (
                    <div className="space-y-1">
                      {selectedCustomer.preferences.map((p) => (
                        <div key={p} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Tickets */}
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Support Ticket History</div>
                {tickets.length === 0 ? (
                  <EmptyState
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    title="No tickets yet"
                    description="Start a support chat to create a ticket"
                  />
                ) : (
                  <div className="space-y-2">
                    {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex justify-center py-10"><Spinner /></div>
          )}
        </div>
      </div>
    </div>
  );
}
