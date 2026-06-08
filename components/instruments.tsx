"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/motion";

const COL: Record<string, string> = {
  ink: "#17160f",
  good: "#3f6f52",
  warn: "#9a6b1e",
  bad: "#9a3b34",
};

// Medidor circular (deal-score) com arco animado e count-up no centro.
export function Gauge({ value, max = 100, size = 132, label, tone = "ink" }: { value: number; max?: number; size?: number; label?: string; tone?: keyof typeof COL }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e2d9" strokeWidth="6" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COL[tone]} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-semibold tracking-tightest text-ink"><CountUp value={value} /></div>
        {label && <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</div>}
      </div>
    </div>
  );
}

// Medidor linear (confiança / risco).
export function Meter({ value, max = 100, label, tone = "ink" }: { value: number; max?: number; label: string; tone?: keyof typeof COL }) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-ink-faint">{label}</div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full"
          style={{ background: COL[tone] }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// Linha de rota desenhada (origem -> destino), com nós e paradas.
export function RouteLine({ from, to, stops = 0 }: { from: string; to: string; stops?: number | null }) {
  const s = stops || 0;
  const dots = Array.from({ length: s }, (_, i) => 60 + ((280 - 60) * (i + 1)) / (s + 1));
  return (
    <svg viewBox="0 0 340 96" className="w-full">
      <motion.path
        d="M40,68 Q170,2 300,68"
        fill="none"
        stroke="#17160f"
        strokeWidth="1.4"
        initial={{ pathLength: 0, opacity: 0.2 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      {dots.map((x, i) => {
        const t = (i + 1) / (s + 1);
        const y = 68 - 4 * (4 * t * (1 - t)) * 33; // segue a curva aprox.
        return <circle key={i} cx={x} cy={y} r="2.5" fill="#9b988d" />;
      })}
      <circle cx="40" cy="68" r="5" fill="#17160f" />
      <circle cx="300" cy="68" r="5" fill="#17160f" />
      <text x="40" y="90" textAnchor="middle" className="fill-ink text-[13px] font-medium">{from}</text>
      <text x="300" y="90" textAnchor="middle" className="fill-ink text-[13px] font-medium">{to}</text>
      <text x="170" y="20" textAnchor="middle" className="fill-ink-faint text-[10px] uppercase tracking-[0.2em]">
        {s === 0 ? "direto" : `${s} parada${s > 1 ? "s" : ""}`}
      </text>
    </svg>
  );
}
