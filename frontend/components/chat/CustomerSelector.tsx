"use client";

import React from "react";
import type { Customer } from "@/lib/types";

interface Props {
  customers: Customer[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
}

const PLAN_COLORS: Record<string, string> = {
  Enterprise: "bg-indigo-100 text-indigo-700",
  Growth: "bg-emerald-100 text-emerald-700",
  Professional: "bg-amber-100 text-amber-700",
};

export function CustomerSelector({ customers, selectedId, onSelect, loading }: Props) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Customer:</span>
        {loading ? (
          <div className="text-xs text-gray-400">Loading customers…</div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  selectedId === c.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {c.name[0]}
                </span>
                <span>{c.name}</span>
                {selectedId !== c.id && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PLAN_COLORS[c.plan] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {c.plan}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected customer env strip */}
      {customers.find((c) => c.id === selectedId) && (
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          {(() => {
            const c = customers.find((x) => x.id === selectedId)!;
            const tags = [
              c.environment.nodejs_version && `Node ${c.environment.nodejs_version}`,
              c.environment.postgres_version && `PG ${c.environment.postgres_version}`,
              c.environment.cloud_provider,
              c.environment.infrastructure,
            ].filter(Boolean) as string[];
            return tags.map((t) => (
              <span key={t} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {t}
              </span>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
