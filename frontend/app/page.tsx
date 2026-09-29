"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Customer, UIMessage, MemoryEvent } from "@/lib/types";
import { fetchCustomers, sendChatMessage } from "@/lib/api";
import { CustomerSelector } from "@/components/chat/CustomerSelector";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MemoryEnginePanel } from "@/components/memory/MemoryEnginePanel";
import { Spinner } from "@/components/ui/primitives";

const QUICK_PROMPTS: Record<string, string[]> = {
  "acme-corp": [
    "Our API requests are timing out.",
    "We're experiencing API timeouts again.",
    "We upgraded PostgreSQL from 14 to 15 yesterday.",
    "The connection pool issue is back after our PG upgrade.",
  ],
  novatech: [
    "Our webhooks are delayed by 10-15 minutes.",
    "We're hitting rate limits on the import endpoint.",
    "Webhooks are failing after our Kubernetes upgrade.",
  ],
  cloudpeak: [
    "OAuth tokens aren't refreshing automatically.",
    "We're seeing authentication failures under load.",
  ],
  datasphere: [
    "Analytics queries are very slow on large tables.",
    "Our ETL job is exhausting the database connection pool.",
    "We're getting intermittent RDS connection timeouts.",
  ],
};

function generateId() {
  return Math.random().toString(36).slice(2);
}

export default function ChatPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("acme-corp");
  const [sessionId, setSessionId] = useState<string | undefined>();

  // Per-customer conversation histories
  const [histories, setHistories] = useState<Record<string, UIMessage[]>>({});
  const messages = histories[selectedId] ?? [];

  // Memory panel state — shows the LAST turn's events
  const [memoryEvents, setMemoryEvents] = useState<MemoryEvent[]>([]);
  const [activeContext, setActiveContext] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers()
      .then(setCustomers)
      .catch(() => setError("Failed to load customers. Is the backend running?"))
      .finally(() => setCustomersLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset session when customer changes
  const handleSelectCustomer = useCallback((id: string) => {
    setSelectedId(id);
    setSessionId(undefined);
    setMemoryEvents([]);
    setActiveContext(undefined);
    setError(null);
  }, []);

  const handleSend = useCallback(
    async (text?: string) => {
      const userText = (text ?? inputValue).trim();
      if (!userText || isLoading) return;

      setInputValue("");
      setError(null);

      const userMsg: UIMessage = {
        id: generateId(),
        role: "user",
        content: userText,
        timestamp: new Date(),
      };

      // Optimistic: show user message + typing indicator
      const thinkingMsg: UIMessage = {
        id: generateId(),
        role: "assistant",
        content: "…",
        timestamp: new Date(),
      };

      setHistories((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] ?? []), userMsg, thinkingMsg],
      }));
      setIsLoading(true);
      setMemoryEvents([]);
      setActiveContext(undefined);

      try {
        const history = (histories[selectedId] ?? []).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const resp = await sendChatMessage({
          customer_id: selectedId,
          message: userText,
          session_id: sessionId,
          conversation_history: history,
        });

        if (!sessionId) setSessionId(resp.session_id);

        const assistantMsg: UIMessage = {
          id: generateId(),
          role: "assistant",
          content: resp.message,
          timestamp: new Date(),
          memoryEvents: resp.memory_events,
          why: resp.why,
          activeContext: resp.active_context,
        };

        // Replace the typing indicator
        setHistories((prev) => {
          const existing = prev[selectedId] ?? [];
          return {
            ...prev,
            [selectedId]: [...existing.slice(0, -1), assistantMsg],
          };
        });

        setMemoryEvents(resp.memory_events);
        setActiveContext(resp.active_context ?? undefined);
      } catch (err: any) {
        const errorMsg: UIMessage = {
          id: generateId(),
          role: "assistant",
          content: `⚠️ Error: ${err.message ?? "Something went wrong. Please try again."}`,
          timestamp: new Date(),
        };
        setHistories((prev) => ({
          ...prev,
          [selectedId]: [...(prev[selectedId] ?? []).slice(0, -1), errorMsg],
        }));
        setError(err.message ?? "Request failed");
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [inputValue, isLoading, selectedId, sessionId, histories]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearConversation = () => {
    setHistories((prev) => ({ ...prev, [selectedId]: [] }));
    setSessionId(undefined);
    setMemoryEvents([]);
    setActiveContext(undefined);
  };

  const quickPrompts = QUICK_PROMPTS[selectedId] ?? [];

  return (
    <div className="flex flex-col h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Support Chat</h1>
          <p className="text-xs text-gray-500">AI agent with Hindsight persistent memory</p>
        </div>
        <div className="flex items-center gap-2">
          {sessionId && (
            <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-mono">
              Session: {sessionId.slice(0, 8)}…
            </span>
          )}
          <button
            onClick={clearConversation}
            className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            New Conversation
          </button>
        </div>
      </div>

      {/* Customer selector */}
      <CustomerSelector
        customers={customers}
        selectedId={selectedId}
        onSelect={handleSelectCustomer}
        loading={customersLoading}
      />

      {/* Main content: Chat + Memory panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Welcome state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full pb-16">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">SupportMind AI</h2>
                <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                  Ask a technical support question. The agent recalls your history and learns from every interaction.
                </p>

                {/* Quick prompts */}
                {quickPrompts.length > 0 && (
                  <div className="w-full max-w-lg">
                    <div className="text-xs text-gray-400 mb-2 text-center font-medium">Try these demo scenarios:</div>
                    <div className="grid grid-cols-1 gap-2">
                      {quickPrompts.map((p) => (
                        <button
                          key={p}
                          onClick={() => handleSend(p)}
                          className="text-left text-sm px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-gray-700"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-6 mb-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-xs text-red-700">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Input bar */}
          <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex gap-3 items-end">
              <div className="flex-1 border border-gray-300 rounded-xl bg-white focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your technical issue…"
                  disabled={isLoading}
                  className="w-full px-4 py-3 text-sm bg-transparent outline-none placeholder-gray-400 disabled:opacity-60"
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                <span className="text-sm font-medium">Send</span>
              </button>
            </div>
            <div className="mt-1.5 text-[11px] text-gray-400 flex items-center gap-1">
              <span>Hindsight memory:</span>
              <span className="text-blue-500 font-medium">RECALL before reply</span>
              <span>·</span>
              <span className="text-emerald-500 font-medium">RETAIN after reply</span>
            </div>
          </div>
        </div>

        {/* Memory Engine panel */}
        <MemoryEnginePanel
          memoryEvents={memoryEvents}
          activeContext={activeContext}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
