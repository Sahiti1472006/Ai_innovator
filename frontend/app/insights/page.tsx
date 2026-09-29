"use client";

import React, { useState, useEffect } from "react";
import type { Customer, InsightsResponse } from "@/lib/types";
import { fetchCustomers, fetchInsights } from "@/lib/api";
import { Card, Badge, Spinner, EmptyState, SectionHeading } from "@/components/ui/primitives";

const PRESET_QUERIES = [
  "What recurring patterns exist in API timeout support cases?",
  "What are the most common database-related issues across customers?",
  "What troubleshooting steps have been tried but failed to work?",
  "What is the most successful resolution pattern for API timeouts?",
  "Are there any common issues after infrastructure upgrades?",
];

function renderMarkdownText(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => {
        if (para.startsWith("## ")) {
          return <h3 key={i} className="text-sm font-bold text-gray-900 mt-2">{para.slice(3)}</h3>;
        }
        if (para.startsWith("### ")) {
          return <h4 key={i} className="text-sm font-semibold text-gray-800">{para.slice(4)}</h4>;
        }
        const lines = para.split("\n");
        if (lines.every((l) => l.match(/^[-*•]\s/))) {
          return (
            <ul key={i} className="list-disc pl-4 space-y-1">
              {lines.map((l, j) => (
                <li key={j} className="text-sm text-gray-700">{l.replace(/^[-*•]\s/, "")}</li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="text-sm text-gray-700 leading-relaxed">{para}</p>;
      })}
    </div>
  );
}

export default function InsightsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");  // empty = global
  const [query, setQuery] = useState(PRESET_QUERIES[0]);
  const [customQuery, setCustomQuery] = useState("");
  const [result, setResult] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    fetchCustomers().then((c) => {
      setCustomers(c);
      if (c.length > 0) setSelectedId(c[0].id);
    });
  }, []);

  const runReflect = async () => {
    const finalQuery = customQuery.trim() || query;
    if (!finalQuery) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setHasRun(true);

    try {
      const resp = await fetchInsights({
        query: finalQuery,
        customer_id: selectedId || undefined,
      });
      setResult(resp);
    } catch (err: any) {
      setError(err.message ?? "Reflection failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Support Insights</h1>
            <p className="text-xs text-gray-500">Hindsight REFLECT — synthesize patterns from accumulated memory</p>
          </div>
          <Badge variant="purple" className="ml-2">AI-Generated</Badge>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: controls */}
        <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto p-4 space-y-4">
          {/* Memory bank selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Memory Bank
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Reflect queries this customer&apos;s memory bank</p>
          </div>

          {/* Preset queries */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Preset Queries
            </label>
            <div className="space-y-1.5">
              {PRESET_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); setCustomQuery(""); }}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                    query === q && !customQuery
                      ? "bg-purple-50 border-purple-200 text-purple-700"
                      : "border-gray-200 text-gray-600 hover:border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Custom query */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Custom Query
            </label>
            <textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Ask anything about the customer's support history…"
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-200 outline-none resize-none"
            />
          </div>

          <button
            onClick={runReflect}
            disabled={loading || (!selectedId && !customQuery.trim())}
            className="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                <span>Reflecting…</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Run REFLECT</span>
              </>
            )}
          </button>

          {/* Explanation */}
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-[11px] text-purple-700 leading-relaxed">
            <strong>How Hindsight REFLECT works:</strong>
            <br />
            Retrieves experience, world facts, and observations from the memory bank, then uses an LLM to synthesize patterns and insights. Results are grounded in actual retained memories.
          </div>
        </div>

        {/* Right: results */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!hasRun && (
            <div className="flex flex-col items-center justify-center h-full pb-16">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-800 mb-1">Support Insights</h2>
              <p className="text-sm text-gray-500 text-center max-w-sm">
                Select a customer and query, then click <strong>Run REFLECT</strong> to synthesize patterns from accumulated support memory.
              </p>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 mt-4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium text-red-700">Reflection failed</span>
              </div>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-5">
              {/* Query badge */}
              <div className="flex items-center gap-2">
                <Badge variant="purple">REFLECT</Badge>
                <span className="text-xs text-gray-500 italic">&ldquo;{result.query}&rdquo;</span>
              </div>

              {/* Main insight */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">AI-Generated Insight</span>
                  <span className="text-[10px] text-gray-400 ml-auto">via Hindsight REFLECT</span>
                </div>
                <div className="text-sm text-gray-800 leading-relaxed">
                  {renderMarkdownText(result.text)}
                </div>
              </Card>

              {/* Based on */}
              {result.based_on.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Memory evidence used ({result.based_on.length} memories)
                  </div>
                  <div className="space-y-1.5">
                    {result.based_on.map((mem, i) => (
                      <div key={i} className="flex gap-2 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <span className="text-purple-400 flex-shrink-0">•</span>
                        <span className="text-gray-600 leading-relaxed">{mem}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">
                This insight was synthesized by Hindsight using real memories from the support memory bank.
                It is grounded in actual retained interactions, not hallucinated.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
