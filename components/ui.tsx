"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export const fmtBrl = (v: number | null | undefined) =>
  v == null
    ? "indisponível"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function Glass({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass p-5 ${className}`}>{children}</div>;
}

const TONE: Record<string, string> = {
  good: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  warn: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  bad: "bg-rose-400/15 text-rose-300 border-rose-400/30",
  info: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  muted: "bg-white/5 text-white/50 border-white/10",
  gold: "bg-amber-300/15 text-amber-200 border-amber-300/40",
};

export function Badge({ tone = "muted", children }: { tone?: keyof typeof TONE; children: ReactNode }) {
  return <span className={`pill border ${TONE[tone]}`}>{children}</span>;
}

// Toggle "cockpit": knob deslizante com brilho, nada de checkbox comum.
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-3 text-left"
      aria-pressed={checked}
    >
      <span
        className={`relative h-7 w-[52px] shrink-0 rounded-full border transition-colors duration-300 ${
          checked ? "border-cockpit-accent/60 bg-cockpit-accent/20" : "border-white/10 bg-white/5"
        }`}
      >
        <span
          className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
            checked ? "opacity-100 glow-accent" : "opacity-0"
          }`}
        />
        <motion.span
          animate={{ x: checked ? 26 : 3 }}
          transition={{ type: "spring", stiffness: 520, damping: 32 }}
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full ${
            checked ? "bg-cockpit-accent shadow-[0_0_14px_2px_rgba(56,189,248,0.75)]" : "bg-white/40"
          }`}
        />
      </span>
      {label && <span className="text-sm text-white/80 group-hover:text-white">{label}</span>}
    </button>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="glass-soft p-4">
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-white/45">{hint}</div>}
    </div>
  );
}

export function SectionTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div className="mb-4">
      {kicker && <div className="text-xs uppercase tracking-[0.2em] text-cockpit-accent/80">{kicker}</div>}
      <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
    </div>
  );
}
