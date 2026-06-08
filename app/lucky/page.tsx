"use client";

import { useState } from "react";
import AgentProgressLoader from "@/components/AgentProgressLoader";
import DataQualityBadge from "@/components/DataQualityBadge";
import { GoldDepartureCard, LuckyRevealCard, ProofPanel } from "@/components/flight-cards";
import { Eyebrow } from "@/components/ui";
import type { LuckyDeal } from "@/lib/types";

interface LuckyResponse {
  headline: LuckyDeal | null;
  almostDeals: LuckyDeal[];
  honestMessage: string | null;
  dataQuality: LuckyDeal["dataQuality"] | "unavailable";
  sources: string[];
  checkedAt: string;
  error?: string;
}

export default function LuckyPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LuckyResponse | null>(null);

  async function reveal() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/lucky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ window: 60, type: "any", aggressive: true }),
      });
      setResult(await response.json());
    } catch {
      setResult({ headline: null, almostDeals: [], honestMessage: null, dataQuality: "unavailable", sources: [], checkedAt: new Date().toISOString(), error: "Não foi possível consultar as fontes agora." });
    } finally {
      setLoading(false);
    }
  }

  const almostDeals = result?.almostDeals || [];
  return (
    <div className="space-y-12 pt-16">
      <header className="max-w-2xl">
        <Eyebrow>Estou com sorte</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">Procure uma oportunidade sem inventar ouro.</h1>
        <p className="mt-5 leading-relaxed">Uma pérola só aparece quando estiver validada ao vivo. Cache aparece como candidato; ausência de fonte aparece como estado vazio.</p>
        <button className="btn mt-8" onClick={reveal} disabled={loading}>{loading ? "Consultando…" : "Procurar oportunidade"}</button>
      </header>

      {loading && <AgentProgressLoader stages={["Consultando fontes de descoberta", "Organizando candidatos", "Verificando qualidade do dado"]} />}
      {result?.error && <p className="text-signal-bad">{result.error}</p>}

      {result && !loading && (
        <section className="space-y-8">
          {result.honestMessage && <div className="rounded-xl border border-line bg-white/50 p-4 text-sm text-ink-soft">{result.honestMessage}</div>}
          {result.headline?.dataQuality === "live" && <GoldDepartureCard deal={result.headline} />}
          {!result.headline && almostDeals.length > 0 && (
            <div>
              <div className="flex flex-wrap items-center gap-3"><Eyebrow>Candidatos promissores, ainda não validados</Eyebrow><DataQualityBadge quality="cache" /></div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">{almostDeals.map((deal, index) => <LuckyRevealCard key={`${deal.origin}-${deal.destination}-${index}`} deal={deal} />)}</div>
            </div>
          )}
          {!result.headline && almostDeals.length === 0 && (
            <div className="glass p-6">
              <h2 className="text-xl font-medium">Nenhuma oportunidade disponível agora.</h2>
              <p className="mt-3 text-sm text-ink-faint">
                Configure uma fonte de descoberta para gerar candidatos. Nenhum dado de demonstração foi apresentado como resultado.
              </p>
            </div>
          )}
          <ProofPanel sources={result.sources} checkedAt={result.checkedAt} />
        </section>
      )}
    </div>
  );
}
