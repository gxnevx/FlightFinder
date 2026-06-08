"use client";

import { useState } from "react";
import { Eyebrow, Tag, Toggle, fmtBrl } from "@/components/ui";

function Deal({ d, hero }: { d: any; hero?: boolean }) {
  return (
    <div className={hero ? "" : "hair pt-8"}>
      <div className="flex items-baseline justify-between gap-6">
        <div>
          <div className={`font-semibold tracking-tightest text-ink ${hero ? "text-4xl sm:text-5xl" : "text-2xl"}`}>{d.destinationName}</div>
          <div className="mt-1.5 text-sm text-ink-faint">{d.origin} → {d.destination} · {d.startDate} a {d.endDate}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className={`font-semibold text-ink ${hero ? "text-3xl" : "text-xl"}`}>{fmtBrl(d.totalPriceBrl)}</div>
          {d.percentBelowTypical != null && <div className="text-sm text-signal-good">{d.percentBelowTypical}% abaixo do típico</div>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Tag>deal score {d.dealScore}</Tag>
        <Tag>{d.urgency}</Tag>
        {d.demo && <Tag>demo</Tag>}
      </div>
      {hero && d.caveats?.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-ink-faint">
          {d.caveats.map((c: string, i: number) => <li key={i}>{c}</li>)}
        </ul>
      )}
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
