"use client";

import { Gauge, Meter, RouteLine } from "@/components/instruments";
import { CountUp, Reveal } from "@/components/motion";
import { Dot, Eyebrow, Tag, fmtBrl } from "@/components/ui";

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;
const stopsTxt = (n: number | null) => (n == null ? "" : n === 0 ? "direto" : `${n} parada${n > 1 ? "s" : ""}`);
const confNum = (c: string) => (c === "alta" ? 90 : c === "média" ? 62 : c === "baixa" ? 34 : 0);

function FareCard({ offer, fallbackUrl }: { offer: any; fallbackUrl?: string }) {
  const url = offer.bookingUrl || fallbackUrl;
  return (
    <div className="group hair py-4 transition">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-[15px] text-ink">{offer.airline || offer.source}</div>
          <div className="text-sm text-ink-faint">{[stopsTxt(offer.stops), offer.duration].filter(Boolean).join(" · ")}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-semibold tracking-tightest text-ink">{fmtBrl(offer.priceBrl)}</div>
          <div className="text-xs text-ink-faint">{offer.source}</div>
        </div>
      </div>
      <div className="grid grid-rows-[0fr] overflow-hidden transition-all duration-300 group-hover:grid-rows-[1fr]">
        <div className="min-h-0">
          <div className="flex items-center gap-3 pt-3 text-xs text-ink-faint">
            {offer.price != null && <Tag>{offer.currency} {Math.round(offer.price)}</Tag>}
            {offer.demo && <Tag>demo</Tag>}
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
  const best = data.bestClean || data.bestAggressive;
  const confTone = c.confidence === "alta" ? "good" : c.confidence === "média" ? "warn" : "bad";
  const agg = data.bestAggressive;
  const risk = agg
    ? /combo|interlining/i.test(agg.airline || "")
      ? { v: 82, t: "bad" as const, l: "alto" }
      : (agg.stops || 0) > 1
        ? { v: 55, t: "warn" as const, l: "médio" }
        : { v: 24, t: "good" as const, l: "baixo" }
    : null;

  return (
    <div className="space-y-16">
      {data.demo && (
        <p className="text-sm text-ink-faint">
          Preços em modo demonstração (o Google Flights não respondeu deste ambiente). Câmbio, visto e clima são reais.
        </p>
      )}

      <Reveal className="grid items-center gap-8 sm:grid-cols-[1.1fr_1fr]">
        <div>
          <Eyebrow>Melhor opção · ida e volta</Eyebrow>
          <div className="mt-3 text-6xl font-semibold tracking-tightest text-ink">
            {best ? <CountUp value={best.priceBrl} format={brl} /> : "—"}
          </div>
          <div className="mt-2 text-sm text-ink-soft">
            {best ? [best.airline || best.source, stopsTxt(best.stops), best.duration].filter(Boolean).join(" · ") : ""}
          </div>
          {data.bookingUrl && (
            <a href={data.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn mt-6">
              Reservar no Google Flights →
            </a>
          )}
        </div>
        <RouteLine from={q.resolvedOrigin || q.origin} to={q.resolvedDest || q.destination} stops={best?.stops ?? 0} />
      </Reveal>

      {data.savingsPct > 0.01 && (
        <p className="text-sm text-ink-soft">
          A opção agressiva sai <span className="text-ink">{Math.round(data.savingsPct * 100)}% mais barata</span> que a melhor
          sem pegadinha{c.divergent ? ", mas as fontes divergem (pode ser autoconexão com bilhetes separados)." : "."}
        </p>
      )}

      <Reveal className="hair grid items-center gap-8 pt-12 sm:grid-cols-[auto_1fr]">
        <Gauge value={Math.round(confNum(c.confidence))} label="confiança" tone={confTone as any} />
        <div className="space-y-5">
          <Meter value={(c.spreadPct || 0) * 100} max={60} label={`Dispersão entre fontes${c.spreadPct != null ? ` · ${Math.round(c.spreadPct * 100)}%` : ""}`} tone={c.divergent ? "bad" : "good"} />
          {risk && <Meter value={risk.v} label={`Risco operacional · ${risk.l}`} tone={risk.t} />}
          <div className="flex flex-wrap gap-2 pt-1 text-sm">
            {(c.sourcesUsed || []).map((s: string) => <Tag key={s}>{s}</Tag>)}
          </div>
        </div>
      </Reveal>

      {(data.topOffers || []).length > 0 && (
        <Reveal>
          <Eyebrow>Tarifas encontradas</Eyebrow>
          <div className="mt-2">
            {data.topOffers.map((o: any, i: number) => <FareCard key={i} offer={o} fallbackUrl={data.bookingUrl} />)}
          </div>
        </Reveal>
      )}

      <Reveal className="hair grid gap-x-10 gap-y-6 pt-12 text-sm sm:grid-cols-3">
        <div>
          <Eyebrow>Câmbio</Eyebrow>
          <div className="mt-2 text-ink">USD {fmtBrl(r.usdEffective)} <span className="text-ink-faint">efetivo</span></div>
          <div className="text-ink-faint">base {fmtBrl(r.usdBase)} · +IOF {r.iofPct}% · {r.source}</div>
        </div>
        {data.visa && (
          <div>
            <Eyebrow>Visto · passaporte BR</Eyebrow>
            <div className="mt-2 text-ink">{data.visa.country}</div>
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

      {(data.alternatives?.origin?.length || data.alternatives?.dest?.length) ? (
        <p className="text-sm text-ink-faint">
          Aeroportos alternativos · origem {(data.alternatives.origin || []).join(", ") || "—"} · destino{" "}
          {(data.alternatives.dest || []).join(", ") || "—"}
        </p>
      ) : null}
    </div>
  );
}
