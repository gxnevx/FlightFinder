"use client";

import { useEffect, useState } from "react";
import { Eyebrow, fmtBrl } from "@/components/ui";

const TABS = [
  { k: "searches", l: "Buscas" },
  { k: "lucky", l: "Pérolas" },
  { k: "evals", l: "Evals" },
];

export default function HistoryPage() {
  const [tab, setTab] = useState("searches");
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const url = tab === "searches" ? "/api/history/searches" : tab === "lucky" ? "/api/history/lucky-deals" : "/api/history/evals";
    fetch(url).then((r) => r.json()).then(setData).catch(() => setData({}));
  }, [tab]);

  const rows = tab === "searches" ? data.searches || [] : tab === "lucky" ? data.deals || [] : data.evals || [];

  return (
    <div className="space-y-10 pt-16">
      <div>
        <Eyebrow>Persistência</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">Histórico</h1>
      </div>
      <div className="flex gap-6 text-sm">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={tab === t.k ? "text-ink underline decoration-ink/30 underline-offset-4" : "text-ink-faint hover:text-ink"}
          >
            {t.l}
          </button>
        ))}
      </div>
      <div className="divide-y divide-line">
        {tab === "searches" && rows.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between gap-4 py-4">
            <div className="text-ink">{s.origin} → {s.destination}</div>
            <div className="text-sm text-ink-faint">{s.departure_date}{s.return_date ? ` · ${s.return_date}` : ""}</div>
          </div>
        ))}
        {tab === "lucky" && rows.map((d: any) => (
          <div key={d.id} className="flex items-center justify-between gap-4 py-4">
            <div className="text-ink">{d.headline}</div>
            <div className="text-sm text-ink-faint">{fmtBrl(d.total_price_brl)} · score {d.deal_score}</div>
          </div>
        ))}
        {tab === "evals" && rows.map((e: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4 py-4">
            <div className="text-ink">{e.eval_name}</div>
            <div className="text-sm text-ink-faint">{e.status} · {e.duration_ms} ms</div>
          </div>
        ))}
        {rows.length === 0 && <div className="py-4 text-sm text-ink-faint">nada ainda (sem Supabase, o histórico em memória zera entre deploys).</div>}
      </div>
    </div>
  );
}
