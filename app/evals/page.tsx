"use client";

import { useEffect, useState } from "react";
import { Dot, Eyebrow } from "@/components/ui";

export default function EvalsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const load = () => fetch("/api/history/evals").then((r) => r.json()).then((d) => setRows(d.evals || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  async function run() {
    setLoading(true);
    try { await fetch("/api/evals/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); } catch {}
    await load();
    setLoading(false);
  }

  return (
    <div className="space-y-12 pt-16">
      <div className="flex items-end justify-between gap-6">
        <div>
          <Eyebrow>Debug</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">Evals</h1>
        </div>
        <button onClick={run} disabled={loading} className="btn">{loading ? "Rodando…" : "Rodar evals"}</button>
      </div>
      <div className="divide-y divide-line">
        {rows.map((e, i) => (
          <div key={i} className="py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="text-ink">{e.eval_name}</div>
              <div className="flex items-center gap-5">
                <span className="text-xs text-ink-faint">{e.duration_ms} ms</span>
                <Dot tone={e.status === "ok" ? "good" : "bad"}>{e.status}</Dot>
              </div>
            </div>
            <div className="mt-1.5 text-sm text-ink-faint">
              fontes {(e.sources_called || []).join(", ") || "—"}
              {e.consolidated_result ? ` · sem pegadinha ${e.consolidated_result.bestClean != null ? "R$ " + Math.round(e.consolidated_result.bestClean) : "—"} · confiança ${e.consolidated_result.confidence}` : ""}
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="py-5 text-sm text-ink-faint">nenhuma execução ainda.</div>}
      </div>
    </div>
  );
}
