import React from "react";

// ── Badge ─────────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "error" | "warning" | "info" | "purple";

const badgeStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-emerald-50 text-emerald-700",
  error: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// ── StatusDot ─────────────────────────────────────────────────────────────────

const dotColors = {
  resolved: "bg-emerald-400",
  open: "bg-amber-400",
  investigating: "bg-blue-400",
  error: "bg-red-400",
  active: "bg-indigo-400",
};

export function StatusDot({ status }: { status: keyof typeof dotColors }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${dotColors[status] ?? "bg-gray-400"}`} />
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner({ size = "sm" }: { size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <svg
      className={`${sz} animate-spin text-indigo-500`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ── SectionHeading ────────────────────────────────────────────────────────────

export function SectionHeading({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-900">{children}</h2>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
        {icon}
      </div>
      <div className="text-sm font-medium text-gray-700">{title}</div>
      {description && <div className="text-xs text-gray-400 mt-1 max-w-xs">{description}</div>}
    </div>
  );
}
