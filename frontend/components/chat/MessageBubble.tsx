"use client";

import React from "react";
import type { UIMessage } from "@/lib/types";
import { Badge, Spinner } from "@/components/ui/primitives";

interface Props {
  message: UIMessage;
}

// Simple markdown renderer (bold, code, lists — no external dependency)
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // List item
    if (line.match(/^[-*•]\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*•]\s+/)) {
        listItems.push(lines[i].replace(/^[-*•]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-4 my-1 space-y-0.5">
          {listItems.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        listItems.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-4 my-1 space-y-0.5">
          {listItems.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={`code-${i}`} className="bg-slate-800 text-slate-100 rounded-lg p-3 text-xs overflow-x-auto my-2">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Heading
    if (line.startsWith("### ")) {
      elements.push(<h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(3)}</h3>);
      i++;
      continue;
    }

    // Empty line → paragraph break
    if (line.trim() === "") {
      elements.push(<div key={`br-${i}`} className="h-1" />);
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(<p key={i} className="leading-relaxed">{renderInline(line)}</p>);
    i++;
  }

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[0.85em] font-mono">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%]">
          <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
            {message.content}
          </div>
          <div className="text-[10px] text-gray-400 text-right mt-1">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>

      <div className="flex-1 max-w-[85%]">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm shadow-sm">
          {message.content === "…" ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Spinner size="sm" />
              <span className="text-xs">Thinking…</span>
            </div>
          ) : (
            <div className="text-gray-800">{renderMarkdown(message.content)}</div>
          )}
        </div>

        {/* Why this recommendation */}
        {message.why && message.why.snippets.length > 0 && (
          <details className="mt-1.5">
            <summary className="text-[11px] text-indigo-600 cursor-pointer hover:text-indigo-800 flex items-center gap-1 select-none">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Why this recommendation?
            </summary>
            <div className="mt-1 pl-3 border-l-2 border-indigo-100">
              <div className="text-[11px] text-gray-500 font-medium mb-1">Memory sources used:</div>
              {message.why.snippets.map((s, i) => (
                <div key={i} className="text-[11px] text-gray-600 flex gap-1.5 mb-0.5">
                  <span className="text-indigo-400 flex-shrink-0">•</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="text-[10px] text-gray-400 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
