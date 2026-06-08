"use client";

import { motion } from "framer-motion";
import { Badge, Glass, Stat, fmtBrl } from "@/components/ui";

function OfferCard({ title, tone, offer }: { title: string; tone: "good" | "bad"; offer: any }) {
  if (!offer) return null;
  const risk = /combo|interlining/i.test(offer.airline || "") ? "alto" : offer.stops > 1 ? "médio" : "baixo";
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-white/45">{title}</span>
        <Badge tone={tone}>{tone === "good" ? "sem pegadinha" : "agressiva"}</Badge>
      </div>
      <div className="mt-2 text-3xl font-bold text-white">{fmtBrl(offer.priceBrl)}</div>
      <div className="mt-1 text-sm text-white/60">
        {(offer.airline || offer.source) + " · " + (offer.stops === 0 ? "direto" : `${offer.stops ?? "?"} parada(s)`)}
        {offer.duration ? ` · ${offer.duration}` : ""}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="info">fonte: {offer.source}</Badge>
        <Badge tone={risk === "baixo" ? "good" : risk === "médio" ? "warn" : "bad"}>risco {risk}</Badge>
        {offer.price != null && <Badge tone="muted">{offer.currency} {Math.round(offer.price)}</Badge>}
        {offer.demo && <Badge tone="muted">demo</Badge>}
      </div>
    </div>
  );
}

export default function ResultView({ data }: { data: any }) {
  if (!data) return null;
  if (data.error) return <Glass className="border-rose-400/30"><p className="text-rose-300">{data.error}</p></Glass>;
  const c = data.consensus || {};
  const r = data.rate || {};
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {data.demo && (
        <div className="glass-soft border-amber-400/30 p-3 text-sm text-amber-200">
          Modo demonstração: preços de voo vêm de mock/fallback (configure FLIGHT_WORKER_URL para dados reais).
          Câmbio, visto, clima e aeroportos são reais.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <OfferCard title="Melhor opção" tone="good" offer={data.bestClean} />
        <OfferCard title="Mais agressiva" tone="bad" offer={data.bestAggressive} />
      </div>
      {data.savingsPct != null && data.savingsPct > 0.01 && (
        <div className="glass-soft p-3 text-sm text-white/80">
          A opção agressiva economiza <b className="text-emerald-300">{Math.round(data.savingsPct * 100)}%</b> vs a melhor
          sem pegadinha.{" "}
          {c.divergent ? "As fontes divergem bastante; confira as condições (autoconexão/bilhetes separados)." : ""}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Mais barato" value={fmtBrl(c.minBrl)} />
        <Stat label="Mediana" value={fmtBrl(c.medianBrl)} />
        <Stat label="Mais caro" value={fmtBrl(c.maxBrl)} />
        <Stat label="Confiança" value={c.confidence || "-"} hint={c.spreadPct != null ? `dispersão ${Math.round(c.spreadPct * 100)}%` : undefined} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Glass>
          <div className="text-sm font-medium text-white/80">Câmbio</div>
          <div className="mt-1 text-sm text-white/60">
            USD efetivo {fmtBrl(r.usdEffective)} (base {fmtBrl(r.usdBase)}
            {r.ptaxUsd ? `, PTAX ${fmtBrl(r.ptaxUsd)}` : ""}) · +IOF {r.iofPct}%
          </div>
          <div className="mt-1 text-xs text-white/40">
            fonte: {r.source} · checado {r.checkedAt ? new Date(r.checkedAt).toLocaleString("pt-BR") : "-"}
          </div>
        </Glass>
        <Glass>
          <div className="text-sm font-medium text-white/80">Fontes consultadas</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(c.sourcesUsed || []).map((s: string) => (
              <Badge key={s} tone="good">{s}</Badge>
            ))}
            {(c.sourcesFailed || []).map((s: string) => (
              <Badge key={s} tone="muted">{s}</Badge>
            ))}
          </div>
        </Glass>
      </div>
      {(data.visa || data.weather) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.visa && (
            <Glass>
              <div className="text-sm font-medium text-white/80">Visto (passaporte BR)</div>
              <div className="mt-1 text-sm text-white/60">{data.visa.country}: {data.visa.message}</div>
              {data.visa.needsVisa && <div className="mt-2"><Badge tone="warn">atenção: exige visto/eTA</Badge></div>}
            </Glass>
          )}
          {data.weather && (
            <Glass>
              <div className="text-sm font-medium text-white/80">Clima no destino</div>
              <div className="mt-1 text-sm text-white/60">{data.weather}</div>
            </Glass>
          )}
        </div>
      )}
      {(data.alternatives?.origin?.length || data.alternatives?.dest?.length) ? (
        <div className="glass-soft p-3 text-sm text-white/60">
          Aeroportos alternativos: origem ({(data.alternatives.origin || []).join(", ") || "nenhum"}), destino (
          {(data.alternatives.dest || []).join(", ") || "nenhum"})
        </div>
      ) : null}
      {(c.notes || []).length > 0 && (
        <Glass>
          <ul className="space-y-1 text-sm text-white/60">
            {c.notes.map((n: string, i: number) => (
              <li key={i}>• {n}</li>
            ))}
          </ul>
        </Glass>
      )}
    </motion.div>
  );
}
