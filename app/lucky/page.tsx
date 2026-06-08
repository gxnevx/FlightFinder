"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Badge, Glass, SectionTitle, Toggle, fmtBrl } from "@/components/ui";

function Ring({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  const col = score >= 70 ? "#34d399" : score >= 45 ? "#fbbf24" : "#f87171";
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
      <circle cx="42" cy="42" r={r} stroke="rgba(255,255,255,0.1)" strokeWidth="7" fill="none" />
      <motion.circle
        cx="42" cy="42" r={r} stroke={col} strokeWidth="7" fill="none" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: off }}
        transition={{ duration: 1, ease: "easeOut" }} transform="rotate(-90 42 42)"
      />
      <text x="42" y="40" textAnchor="middle" className="fill-white text-lg font-bold">{score}</text>
      <text x="42" y="54" textAnchor="middle" className="fill-white/40 text-[9px]">deal score</text>
    </svg>
  );
}

function DealCard({ d, hero }: { d: any; hero?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`glass p-6 ${hero ? "glow-accent" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-cockpit-gold">{hero ? "pqp, olha isso" : "vice-campeã"}</div>
          <div className="mt-1 text-2xl font-bold text-white">{d.destinationName} ({d.destination})</div>
          <div className="text-sm text-white/55">{d.startDate} a {d.endDate} · saindo de {d.origin}</div>
        </div>
        <Ring score={d.dealScore} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-3xl font-bold text-white">{fmtBrl(d.totalPriceBrl)}</span>
        {d.percentBelowTypical != null && <Badge tone="good">{d.percentBelowTypical}% abaixo do típico</Badge>}
        <Badge tone="warn">{d.urgency}</Badge>
        {d.demo && <Badge tone="muted">demo</Badge>}
      </div>
      {d.caveats?.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-white/50">
          {d.caveats.map((c: string, i: number) => <li key={i}>• {c}</li>)}
        </ul>
      )}
    </motion.div>
  );
}

export default function LuckyPage() {
  const [f, setF] = useState<any>({ window: 60, type: "any", budgetBrl: "", aggressive: true });
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);

  async function go() {
    setLoading(true);
    setRes(null);
    try {
      const body = { ...f, budgetBrl: f.budgetBrl ? +f.budgetBrl : null };
      const r = await fetch("/api/lucky", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setRes(await r.json());
    } catch {
      setRes({ error: "falhou" });
    }
    setLoading(false);
  }

  const seg = (opts: { v: any; l: string }[], key: string) => (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => setF((s: any) => ({ ...s, [key]: o.v }))}
          className={`rounded-xl px-3 py-2 text-sm transition ${f[key] === o.v ? "bg-cockpit-accent/20 text-white glow-accent" : "bg-white/5 text-white/55 hover:text-white"}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionTitle kicker="estou com sorte" title="Me encontre uma viagem imperdível" />
      <Glass className="space-y-4">
        <div><div className="mb-1 text-xs uppercase tracking-wider text-white/40">Janela</div>{seg([{ v: 7, l: "7 dias" }, { v: 30, l: "30" }, { v: 60, l: "60" }, { v: 90, l: "90" }], "window")}</div>
        <div><div className="mb-1 text-xs uppercase tracking-wider text-white/40">Tipo</div>{seg([{ v: "any", l: "qualquer" }, { v: "south-america", l: "América do Sul" }, { v: "europe", l: "Europa" }, { v: "asia", l: "Ásia" }, { v: "beach", l: "praia" }], "type")}</div>
        <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-white/40">Orçamento máx (BRL, opcional)</span>
            <input className="input-field" value={f.budgetBrl} onChange={(e) => setF((s: any) => ({ ...s, budgetBrl: e.target.value }))} placeholder="ex.: 3000" />
          </label>
          <Toggle checked={f.aggressive} onChange={(v) => setF((s: any) => ({ ...s, aggressive: v }))} label="Aceitar viagem maluca/agressiva" />
        </div>
        <button onClick={go} disabled={loading} className="w-full rounded-2xl bg-cockpit-gold/90 py-3 font-semibold text-[#1a1404] transition hover:bg-cockpit-gold disabled:opacity-50">
          {loading ? "caçando pérolas…" : "Me surpreenda"}
        </button>
      </Glass>

      {loading && <div className="glass h-44 shimmer" />}
      {res?.error && <Glass className="border-rose-400/30"><p className="text-rose-300">{res.error}</p></Glass>}
      {res && !loading && (
        <div className="space-y-4">
          {res.headline ? (
            <DealCard d={res.headline} hero />
          ) : (
            res.honest && <Glass className="border-amber-400/30"><p className="text-amber-200">{res.honest}</p></Glass>
          )}
          {(res.runnersUp || []).length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {res.runnersUp.map((d: any, i: number) => <DealCard key={i} d={d} />)}
            </div>
          )}
          {res.demo && <p className="text-xs text-white/40">Achados de demonstração (catálogo). Configure FLIGHT_WORKER_URL ou TRAVELPAYOUTS_TOKEN para varredura real.</p>}
        </div>
      )}
    </div>
  );
}
