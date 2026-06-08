"use client";

import { Dot, Eyebrow, Tag, fmtBrl } from "@/components/ui";

const stopsTxt = (n: number | null) => (n == null ? "" : n === 0 ? "direto" : `${n} parada${n > 1 ? "s" : ""}`);

function Price({ offer, label, big }: { offer: any; label: string; big?: boolean }) {
  if (!offer) return null;
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div className={`mt-3 font-semibold tracking-tightest text-ink ${big ? "text-5xl" : "text-3xl"}`}>{fmtBrl(offer.priceBrl)}</div>
      <div className="mt-2 text-sm text-ink-soft">
        {[offer.airline || offer.source, stopsTxt(offer.stops), offer.duration].filter(Boolean).join(" · ")}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Tag>fonte {offer.source}</Tag>
        {offer.price != null && <Tag>{offer.currency} {Math.round(offer.price)}</Tag>}
        {offer.demo && <Tag>demo</Tag>}
      </div>
    </div>
  );
}

export default function ResultView({ data }: { data: any }) {
  if (!data) return null;
  if (data.error) return <p className="text-signal-bad">{data.error}</p>;
  const c = data.consensus || {};
  const r = data.rate || {};
  const confTone = c.confidence === "alta" ? "good" : c.confidence === "média" ? "warn" : "bad";
  return (
    <div className="rise space-y-12">
      {data.demo && (
        <p className="text-sm text-ink-faint">
          Preços de voo em modo demonstração (o Google Flights não respondeu deste ambiente). Câmbio, visto e clima são reais.
        </p>
      )}
      <div className="grid gap-10 sm:grid-cols-2">
        <Price offer={data.bestClean} label="Melhor opção" big />
        <Price offer={data.bestAggressive} label="Mais agressiva" />
      </div>
      {data.bookingUrl && (
        <div>
          <a href={data.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn">
            Reservar no Google Flights →
          </a>
          <p className="mt-2.5 text-xs text-ink-faint">
            Abre a rota e as datas exatas no Google Flights para escolher o voo e concluir a compra no provedor.
          </p>
        </div>
      )}
      {data.savingsPct > 0.01 && (
        <p className="text-sm text-ink-soft">
          A opção agressiva sai <span className="text-ink">{Math.round(data.savingsPct * 100)}% mais barata</span> que a melhor
          sem pegadinha{c.divergent ? ", mas as fontes divergem (pode ser autoconexão com bilhetes separados)." : "."}
        </p>
      )}

      <div className="hair grid gap-x-10 gap-y-6 pt-10 text-sm sm:grid-cols-3">
        <div>
          <Eyebrow>Faixa de preço</Eyebrow>
          <div className="mt-2 text-ink">{fmtBrl(c.minBrl)} – {fmtBrl(c.maxBrl)}</div>
          <div className="text-ink-faint">mediana {fmtBrl(c.medianBrl)}</div>
        </div>
        <div>
          <Eyebrow>Confiança</Eyebrow>
          <div className="mt-2"><Dot tone={confTone as any}>{c.confidence}</Dot></div>
          {c.spreadPct != null && <div className="text-ink-faint">dispersão {Math.round(c.spreadPct * 100)}%</div>}
        </div>
        <div>
          <Eyebrow>Fontes</Eyebrow>
          <div className="mt-2 text-ink">{(c.sourcesUsed || []).join(", ") || "—"}</div>
          {(c.sourcesFailed || []).length > 0 && <div className="text-ink-faint">fora: {(c.sourcesFailed || []).join(", ")}</div>}
        </div>
      </div>

      <div className="hair grid gap-x-10 gap-y-6 pt-10 text-sm sm:grid-cols-3">
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
      </div>

      {(data.alternatives?.origin?.length || data.alternatives?.dest?.length) ? (
        <p className="text-sm text-ink-faint">
          Aeroportos alternativos · origem {(data.alternatives.origin || []).join(", ") || "—"} · destino{" "}
          {(data.alternatives.dest || []).join(", ") || "—"}
        </p>
      ) : null}
    </div>
  );
}
