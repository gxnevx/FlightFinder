"use client";

import { Gauge, Meter, RouteLine } from "@/components/instruments";
import { CountUp, Reveal } from "@/components/motion";
import { Eyebrow, Tag, fmtBrl } from "@/components/ui";
import { BoardingPassCard, GateStatusBadge } from "@/components/terminal";

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;
const stopsTxt = (n: number | null) => (n == null ? "" : n === 0 ? "direto" : `${n} parada${n > 1 ? "s" : ""}`);
const confNum = (c: string) => (c === "alta" ? 90 : c === "média" ? 62 : c === "baixa" ? 34 : 0);
const QUALITY: Record<string, string> = { live: "ao vivo", cache: "cache", demo: "demonstração", hypothesis: "hipótese", unavailable: "indisponível", manual_validation_required: "validar manual" };

function FareCard({ offer, fallbackUrl }: { offer: any; fallbackUrl?: string }) {
  const url = offer.bookingUrl || fallbackUrl;
  return (
    <div className="group hair py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-[15px] text-ink">{offer.airline || offer.source}</div>
          <div className="text-sm text-ink-faint">{[stopsTxt(offer.stops), offer.duration].filter(Boolean).join(" · ")}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-semibold tracking-tightest text-ink">{fmtBrl(offer.priceBrl)}</div>
          <div className="text-xs text-ink-faint">{offer.source} · {QUALITY[offer.dataQuality] || offer.dataQuality}</div>
        </div>
      </div>
      <div className="grid grid-rows-[0fr] overflow-hidden transition-all duration-300 group-hover:grid-rows-[1fr]">
        <div className="min-h-0">
          <div className="flex flex-wrap items-center gap-3 pt-3 text-xs text-ink-faint">
            {offer.price != null && <Tag>{offer.currency} {Math.round(offer.price)}</Tag>}
            {offer.checkedAt && <span>checado {new Date(offer.checkedAt).toLocaleString("pt-BR")}</span>}
            {url && <a href={url} target="_blank" rel="noopener noreferrer" className="btn-line">Reservar →</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultView({ data }: { data: any }) {
  if (!data) return null;
  if (data.error) return <p className="text-signal-bad">{data.error}</p>;
  const c = data.consensus || {};
  const r = data.rate || {};
  const q = data.query || {};
  const best = data.bestNoTrick || data.cheapestRaw;
  const noReal = !best;

  // Estado honesto: sem fonte real, não mostra preço inventado.
  if (noReal) {
    return (
      <div className="rise space-y-6">
        <Eyebrow>Sem dado real</Eyebrow>
        <p className="max-w-2xl text-lg text-ink">{data.honestMessage || "Nenhuma fonte real configurada para esta busca."}</p>
        <div className="hair pt-6 text-sm text-ink-faint">
          <div>Para ter preço real, configure no Vercel: <span className="text-ink">FLIGHT_WORKER_URL</span> (motor Google/LetsFG),
          {" "}<span className="text-ink">DUFFEL_ACCESS_TOKEN</span> (validação bookável) ou <span className="text-ink">TRAVELPAYOUTS_TOKEN</span> (baseline/cache).</div>
          {data.bookingUrl && <a href={data.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-line mt-4">Abrir esta rota no Google Flights →</a>}
        </div>
      </div>
    );
  }

  const confTone = c.confidence === "alta" ? "good" : c.confidence === "média" ? "warn" : "bad";
  const onlyGoogle = (c.independentEngines || []).length <= 1 && (c.independentEngines || [])[0] === "google";

  return (
    <div className="space-y-16"><BoardingPassCard from={q.resolvedOrigin || q.origin} to={q.resolvedDest || q.destination} destination={q.resolvedDest || q.destination} price={best.priceBrl} score={Math.round(confNum(c.confidence))} quality={best.dataQuality} />
      {data.honestMessage && <p className="text-sm text-signal-warn">{data.honestMessage}</p>}

      <Reveal className="terminal-panel grid items-center gap-8 p-5 sm:grid-cols-[1.1fr_1fr] sm:p-8">
        <div>
          <div className="flex items-center gap-2">
            <Eyebrow>{data.bestNoTrick ? "Melhor sem pegadinha" : "Mais barato (bruto)"}</Eyebrow>
            <GateStatusBadge status={best.dataQuality} />
          </div>
          <div className="mt-3 text-6xl font-semibold tracking-tightest text-ink"><CountUp value={best.priceBrl} format={brl} /></div>
          <div className="mt-2 text-sm text-ink-soft">{[best.airline || best.source, stopsTxt(best.stops), best.duration].filter(Boolean).join(" · ")}</div>
          <div className="mt-1 text-xs text-ink-faint">fonte {best.source}{best.checkedAt ? ` · checado ${new Date(best.checkedAt).toLocaleString("pt-BR")}` : ""}</div>
          {data.bookingUrl && <a href={data.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn mt-6">Reservar no Google Flights →</a>}
        </div>
        <RouteLine from={q.resolvedOrigin || q.origin} to={q.resolvedDest || q.destination} stops={best.stops ?? 0} />
      </Reveal>

      {data.bestAggressive && data.savingsPct > 0.01 && (
        <p className="text-sm text-ink-soft">
          Opção mais agressiva ({data.bestAggressive.source}): <span className="text-ink">{fmtBrl(data.bestAggressive.priceBrl)}</span>,
          {" "}{Math.round(data.savingsPct * 100)}% mais barata{c.divergent ? ", mas as fontes divergem (confira autoconexão/bilhetes separados)." : "."}
        </p>
      )}

      <Reveal className="hair grid items-center gap-8 pt-12 sm:grid-cols-[auto_1fr]">
        <Gauge value={Math.round(confNum(c.confidence))} label={`confiança ${c.confidence}`} tone={confTone as any} />
        <div className="space-y-5">
          <Meter value={(c.spreadPct || 0) * 100} max={60} label={`Dispersão entre fontes${c.spreadPct != null ? ` · ${Math.round(c.spreadPct * 100)}%` : ""}`} tone={c.divergent ? "bad" : "good"} />
          <div className="text-sm text-ink-soft">
            Motores independentes: {(c.independentEngines || []).join(", ") || "—"}
            {onlyGoogle && <span className="text-ink-faint"> · nenhum achado além do que o Google já mostra (configure Duffel/seats.aero/Travelpayouts para profundidade)</span>}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">{(c.sourcesUsed || []).map((s: string) => <Tag key={s}>{s}</Tag>)}</div>
        </div>
      </Reveal>

      {(data.topOffers || []).length > 0 && (
        <Reveal>
          <Eyebrow>Tarifas encontradas</Eyebrow>
          <div className="mt-2">{data.topOffers.map((o: any, i: number) => <FareCard key={i} offer={o} fallbackUrl={data.bookingUrl} />)}</div>
        </Reveal>
      )}

      <Reveal className="hair grid gap-x-10 gap-y-6 pt-12 text-sm sm:grid-cols-3">
        <div>
          <Eyebrow>Câmbio</Eyebrow>
          <div className="mt-2 text-ink">USD {fmtBrl(r.usdEffective)} <span className="text-ink-faint">efetivo</span></div>
          <div className="text-ink-faint">base {fmtBrl(r.usdBase)} · {r.source}</div>
          <div className="mt-1 text-xs text-ink-faint">{r.iofLabel}</div>
        </div>
        {data.visa && (
          <div>
            <Eyebrow>Visto · passaporte BR</Eyebrow>
            <div className="mt-2 text-ink">{data.visa.country}{data.visa.iso3 ? ` (${data.visa.iso3})` : ""}</div>
            <div className="text-ink-faint">{data.visa.message}</div>
          </div>
        )}
        {data.weather && (
          <div>
            <Eyebrow>Clima no destino</Eyebrow>
            <div className="mt-2 text-ink-soft">{data.weather}</div>
          </div>
        )}
      </Reveal>

      {(data.warnings || []).length > 0 && (
        <div className="text-sm text-ink-faint">
          {(data.warnings || []).map((w: string, i: number) => <div key={i}>• {w}</div>)}
        </div>
      )}
    </div>
  );
}
