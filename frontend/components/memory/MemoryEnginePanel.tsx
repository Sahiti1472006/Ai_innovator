"use client";

import React from "react";
import type { MemoryEvent, WhyRecommendation } from "@/lib/types";
import { Badge, Spinner, EmptyState } from "@/components/ui/primitives";

interface Props {
  memoryEvents: MemoryEvent[];
  activeContext?: string;
  isLoading: boolean;
}

// ── Memory operation icons ────────────────────────────────────────────────────

function RecallIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function RetainIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
function ReflectIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

const OP_CONFIG = {
  recall: {
    label: "RECALL",
    icon: <RecallIcon />,
    color: "bg-blue-50 border-blue-200",
    headerColor: "text-blue-700 bg-blue-100",
    dotColor: "bg-blue-400",
    badge: "info" as const,
  },
  retain: {
    label: "RETAIN",
    icon: <RetainIcon />,
    color: "bg-emerald-50 border-emerald-200",
    headerColor: "text-emerald-700 bg-emerald-100",
    dotColor: "bg-emerald-400",
    badge: "success" as const,
  },
  reflect: {
    label: "REFLECT",
    icon: <ReflectIcon />,
    color: "bg-purple-50 border-purple-200",
    headerColor: "text-purple-700 bg-purple-100",
    dotColor: "bg-purple-400",
    badge: "purple" as const,
  },
};

function MemoryEventCard({ event }: { event: MemoryEvent }) {
  const cfg = OP_CONFIG[event.operation];

  return (
    <div className={`rounded-lg border ${cfg.color} overflow-hidden fade-in-up`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-1.5 ${cfg.headerColor}`}>
        <div className="flex items-center gap-1.5">
          {cfg.icon}
          <span className="text-[11px] font-bold tracking-wider">{cfg.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {event.status === "success" && event.count !== undefined && (
            <span className="text-[11px] font-medium opacity-80">
              {event.count} {event.count === 1 ? "memory" : "memories"}
            </span>
          )}
          {event.status === "error" && (
            <Badge variant="error">Error</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        {event.status === "error" ? (
          <p className="text-xs text-red-600">{event.detail}</p>
        ) : event.items.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No memories retrieved</p>
        ) : (
          event.items.map((item, i) => (
            <div key={i} className="flex gap-1.5 text-xs text-gray-700">
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} mt-1.5 flex-shrink-0`} />
              <span className="leading-relaxed">{item}</span>
            </div>
          ))
        )}
        {event.detail && event.status === "success" && (
          <div className="text-[10px] text-gray-400 mt-1 pt-1 border-t border-gray-100">
            {event.detail}
          </div>
        )}
      </div>
    </div>
  );
}

export function MemoryEnginePanel({ memoryEvents, activeContext, isLoading }: Props) {
  const recallEvents = memoryEvents.filter((e) => e.operation === "recall");
  const retainEvents = memoryEvents.filter((e) => e.operation === "retain");
  const reflectEvents = memoryEvents.filter((e) => e.operation === "reflect");

  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-gray-50 flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Hindsight Memory Engine</div>
            <div className="text-[10px] text-indigo-600 font-medium">Live memory operations</div>
          </div>
          {isLoading && (
            <div className="ml-auto">
              <Spinner size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* Loading placeholder */}
        {isLoading && memoryEvents.length === 0 && (
          <div className="space-y-2">
            {["RECALL", "RETAIN"].map((op) => (
              <div key={op} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 bg-gray-100 rounded animate-pulse" />
                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No activity yet */}
        {!isLoading && memoryEvents.length === 0 && (
          <EmptyState
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            title="Memory engine ready"
            description="Send a message to see RECALL → RETAIN in action"
          />
        )}

        {/* RECALL section */}
        {recallEvents.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">
              Recall
            </div>
            {recallEvents.map((e, i) => (
              <MemoryEventCard key={i} event={e} />
            ))}
          </div>
        )}

        {/* Active context */}
        {activeContext && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 overflow-hidden fade-in-up">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[11px] font-bold tracking-wider">ACTIVE CONTEXT</span>
            </div>
            <div className="px-3 py-2">
              <p className="text-[11px] text-amber-800 leading-relaxed line-clamp-6">
                {activeContext}
              </p>
              <div className="text-[10px] text-amber-600 mt-1">Fed to the LLM as system context</div>
            </div>
          </div>
        )}

        {/* RETAIN section */}
        {retainEvents.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">
              Retain
            </div>
            {retainEvents.map((e, i) => (
              <MemoryEventCard key={i} event={e} />
            ))}
          </div>
        )}

        {/* REFLECT section */}
        {reflectEvents.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">
              Reflect
            </div>
            {reflectEvents.map((e, i) => (
              <MemoryEventCard key={i} event={e} />
            ))}
          </div>
        )}
      </div>

      {/* Legend footer */}
      <div className="px-4 py-2 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-around text-[10px] text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Recall</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Retain</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Reflect</span>
          </div>
        </div>
      </div>
    </div>
  );
}
