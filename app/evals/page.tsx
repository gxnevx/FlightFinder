"use client";

import { useEffect, useState } from "react";
import { Badge, Glass, SectionTitle } from "@/components/ui";

export default function EvalsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () =>
    fetch("/api/history/evals")
      .then((r) => r.json())
      .then((d) => setRows(d.evals || []))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  async function run() {
    setLoading(true);
    try {
      await fetch("/api/evals/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    } catch {
      /* ignore */
    }
    await load();
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <SectionTitle kicker="debug" title="Evals (testes reproduzíveis)" />
      <button onClick={run} disabled={loading} className="rounded-2xl bg-cockpit-accent/90 px-5 py-2.5 font-semibold text-[#04121c] transition hover:bg-cockpit-accent disabled:opacity-50">
        {loading ? "rodando…" : "Rodar evals"}
      </button>
      <div className="space-y-3">
        {rows.map((e, i) => (
          <Glass key={i}>
            <div className="flex items-center justify-between">
              <div className="font-medium text-white">{e.eval_name}</div>
              <div className="flex gap-2">
                <Badge tone={e.status === "ok" ? "good" : "bad"}>{e.status}</Badge>
                <Badge tone="muted">{e.duration_ms} ms</Badge>
              </div>
            </div>
            <div className="mt-2 text-xs text-white/50">
              fontes: {(e.sources_called || []).join(", ") || "-"}
              {e.errors?.length ? ` · erros: ${e.errors.join("; ")}` : ""}
            </div>
            {e.consolidated_result && (
              <div className="mt-1 text-xs text-white/60">
                melhor sem pegadinha: {e.consolidated_result.bestClean != null ? `R$ ${Math.round(e.consolidated_result.bestClean)}` : "-"} ·
                confiança {e.consolidated_result.confidence} · {e.consolidated_result.divergent ? "divergente" : "convergente"}
                {e.consolidated_result.demo ? " · demo" : ""}
              </div>
            )}
          </Glass>
        ))}
        {rows.length === 0 && <p className="text-sm text-white/45">nenhuma execução ainda. Clique em rodar evals.</p>}
      </div>
    </div>
  );
}
