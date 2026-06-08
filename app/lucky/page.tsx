"use client";

import { useState } from "react";
import { Gauge } from "@/components/instruments";
import { CountUp, Reveal } from "@/components/motion";
import { Eyebrow, Toggle, fmtBrl } from "@/components/ui";

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;

function Deal({ d, hero }: { d: any; hero?: boolean }) {
  if (hero) {
    return (
      <Reveal className="grid items-center gap-10 sm:grid-cols-[1fr_auto]">
        <div>
          <Eyebrow>pqp, olha isso</Eyebrow>
          <div className="mt-3 text-5xl font-semibold tracking-tightest text-ink sm:text-6xl">{d.destinationName}</div>
          <div className="mt-2 text-sm text-ink-faint">{d.origin} → {d.destination} · {d.startDate} a {d.endDate}</div>
          <div className="mt-6 text-4xl font-semibold tracking-tightest text-ink"><CountUp value={d.totalPriceBrl} format={brl} /></div>
          {d.percentBelowTypical != null && <div className="mt-1.5 text-sm text-signal-good">{d.percentBelowTypical}% abaixo do típico · {d.urgency}</div>}
          {d.caveats?.length > 0 && (
            <ul className="mt-5 space-y-1 text-sm text-ink-faint">
              {d.caveats.map((c: string, i: number) => <li key={i}>{c}</li>)}
            </ul>
          )}
        </div>
        <Gauge value={d.dealScore} label="deal score" tone={d.dealScore >= 70 ? "good" : d.dealScore >= 45 ? "warn" : "bad"} />
      </Reveal>
    );
  }
  return (
    <div className="hair flex items-center justify-between gap-6 py-5">
      <div>
        <div className="text-lg text-ink">{d.destinationName} <span className="text-ink-faint">({d.destination})</span></div>
        <div className="text-sm text-ink-faint">{d.startDate} a {d.endDate}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-ink">{fmtBrl(d.totalPriceBrl)}</div>
        <div className="text-sm text-ink-faint">score {d.dealScore}{d.percentBelowTypical != null ? ` · ${d.percentBelowTypical}% abaixo` : ""}</div>
      </div>
    </div>
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
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => setF((s: any) => ({ ...s, [key]: o.v }))}
          className={`chip ${f[key] === o.v ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40"}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-12 pt-16">
      <div>
        <Eyebrow>Estou com sorte</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">Me encontre uma viagem imperdível</h1>
      </div>
      <div className="space-y-7">
        <div><span className="label">Janela</span>{seg([{ v: 7, l: "7 dias" }, { v: 30, l: "30" }, { v: 60, l: "60" }, { v: 90, l: "90" }], "window")}</div>
        <div><span className="label">Tipo</span>{seg([{ v: "any", l: "Qualquer" }, { v: "south-america", l: "América do Sul" }, { v: "europe", l: "Europa" }, { v: "asia", l: "Ásia" }, { v: "beach", l: "Praia" }], "type")}</div>
        <div className="grid gap-6 sm:max-w-md sm:grid-cols-2 sm:items-end">
          <label className="block"><span className="label">Orçamento máx (R$)</span><input className="field" value={f.budgetBrl} onChange={(e) => setF((s: any) => ({ ...s, budgetBrl: e.target.value }))} placeholder="opcional" /></label>
          <div className="pb-3"><Toggle checked={f.aggressive} onChange={(v) => setF((s: any) => ({ ...s, aggressive: v }))} label="Viagem agressiva" /></div>
        </div>
        <button onClick={go} disabled={loading} className="btn">{loading ? "Caçando…" : "Me surpreenda"}</button>
      </div>

      {loading && <div className="h-16 w-1/2 animate-pulse rounded bg-line" />}
      {res?.error && <p className="text-signal-bad">{res.error}</p>}
      {res && !loading && (
        <div className="rise space-y-8">
          {res.headline ? <Deal d={res.headline} hero /> : res.honest && <p className="text-ink-soft">{res.honest}</p>}
          {(res.runnersUp || []).length > 0 && <div>{res.runnersUp.map((d: any, i: number) => <Deal key={i} d={d} />)}</div>}
        </div>
      )}
    </div>
  );
}
