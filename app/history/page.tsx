"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Badge, Glass, SectionTitle, fmtBrl } from "@/components/ui";

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

  const empty =
    (tab === "searches" && !(data.searches || []).length) ||
    (tab === "lucky" && !(data.deals || []).length) ||
    (tab === "evals" && !(data.evals || []).length);

  return (
    <div className="space-y-6">
      <SectionTitle kicker="persistência" title="Histórico" />
      <div className="glass inline-flex gap-1 rounded-full p-1">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className="relative rounded-full px-4 py-1.5 text-sm">
            {tab === t.k && <motion.span layoutId="histpill" className="absolute inset-0 rounded-full bg-white/10 glow-accent" />}
            <span className={`relative ${tab === t.k ? "text-white" : "text-white/55"}`}>{t.l}</span>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {tab === "searches" &&
          (data.searches || []).map((s: any) => (
            <Glass key={s.id}>
              <div className="flex justify-between">
                <div className="text-white">{s.origin} → {s.destination}</div>
                <Badge tone="muted">{s.mode}</Badge>
              </div>
              <div className="text-xs text-white/45">
                {s.departure_date}{s.return_date ? ` · volta ${s.return_date}` : ""} · {new Date(s.created_at).toLocaleString("pt-BR")}
              </div>
            </Glass>
          ))}
        {tab === "lucky" &&
          (data.deals || []).map((d: any) => (
            <Glass key={d.id}>
              <div className="flex justify-between gap-3">
                <div className="text-white">{d.headline}</div>
                <Badge tone="gold">score {d.deal_score}</Badge>
              </div>
              <div className="text-xs text-white/45">{d.start_date} a {d.end_date} · {fmtBrl(d.total_price_brl)}</div>
            </Glass>
          ))}
        {tab === "evals" &&
          (data.evals || []).map((e: any, i: number) => (
            <Glass key={i}>
              <div className="flex justify-between">
                <div className="text-white">{e.eval_name}</div>
                <Badge tone={e.status === "ok" ? "good" : "bad"}>{e.status}</Badge>
              </div>
              <div className="text-xs text-white/45">{e.duration_ms} ms · {new Date(e.created_at).toLocaleString("pt-BR")}</div>
            </Glass>
          ))}
        {empty && (
          <p className="text-sm text-white/45">
            nada ainda (ou Supabase não configurado: o histórico em memória zera entre deploys).
          </p>
        )}
      </div>
    </div>
  );
}
