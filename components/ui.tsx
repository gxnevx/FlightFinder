"use client";

import type { ReactNode } from "react";

export const fmtBrl = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const DOT: Record<string, string> = {
  good: "bg-signal-good",
  warn: "bg-signal-warn",
  bad: "bg-signal-bad",
  mute: "bg-ink-faint",
};

// Status como ponto + texto (sem caixas).
export function Dot({ tone = "mute", children }: { tone?: keyof typeof DOT; children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} />
      {children}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-soft">{children}</span>;
}

// Switch minimalista, monocromático.
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-3 text-left">
      <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-ink" : "bg-line"}`}>
        <span className={`absolute h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
      </span>
      {label && <span className="text-sm text-ink-soft">{label}</span>}
    </button>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-faint">{children}</div>;
}
