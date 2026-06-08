import DataQualityBadge from "@/components/DataQualityBadge";
import { Gauge } from "@/components/instruments";
import { fmtBrl } from "@/components/ui";
import type { DataQuality, LuckyDeal, Offer } from "@/lib/types";

export interface DepartureRow {
  origin: string;
  destination: string;
  status: string;
  priceBrl?: number | null;
  quality: DataQuality;
  source: string;
}

export function FlightRow({ row }: { row: DepartureRow }) {
  return (
    <div className="grid gap-3 border-t border-line py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <div>
        <div className="font-medium text-ink">{row.origin} → {row.destination}</div>
        <div className="mt-1 text-xs text-ink-faint">{row.source} · {row.status}</div>
      </div>
      <DataQualityBadge quality={row.quality} />
      <div className="font-medium text-ink">{fmtBrl(row.priceBrl)}</div>
    </div>
  );
}

export function DepartureBoard({ rows }: { rows: DepartureRow[] }) {
  if (!rows.length) return <p className="text-sm text-ink-faint">Nenhuma oportunidade recebida das fontes agora.</p>;
  return <div>{rows.map((row, index) => <FlightRow key={`${row.origin}-${row.destination}-${index}`} row={row} />)}</div>;
}

export function CandidateCard({ offer }: { offer: Offer }) {
  return (
    <article className="glass p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-medium text-ink">{offer.departure || "Origem"} → {offer.arrival || "Destino"}</div>
          <p className="mt-1 text-sm text-ink-faint">{offer.airline || offer.source} · {offer.duration || "duração indisponível"}</p>
        </div>
        <DataQualityBadge quality={offer.dataQuality} />
      </div>
      <div className="mt-6 text-2xl font-semibold text-ink">{fmtBrl(offer.priceBrl)}</div>
    </article>
  );
}

export function LuckyRevealCard({ deal }: { deal: LuckyDeal }) {
  const validated = deal.dataQuality === "live";
  return (
    <article className="glass grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <DataQualityBadge quality={deal.dataQuality} />
          <span className="text-xs text-ink-faint">{validated ? "validado ao vivo" : "candidato, ainda não validado"}</span>
        </div>
        <h3 className="mt-4 text-2xl font-semibold">{deal.destinationName}</h3>
        <p className="mt-1 text-sm text-ink-faint">{deal.origin} → {deal.destination} · {deal.startDate || "data indisponível"}</p>
        <div className="mt-5 text-3xl font-semibold text-ink">{fmtBrl(deal.totalPriceBrl)}</div>
        {deal.caveats?.length > 0 && <p className="mt-3 text-sm text-ink-faint">{deal.caveats[0]}</p>}
      </div>
      <Gauge value={deal.dealScore} size={110} label="score" tone={validated ? "good" : "warn"} />
    </article>
  );
}

export function GoldDepartureCard({ deal }: { deal: LuckyDeal }) {
  if (deal.dataQuality !== "live") return null;
  return (
    <section className="rounded-2xl border border-signal-good/30 bg-signal-good/10 p-6">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-signal-good">Oportunidade validada ao vivo</div>
      <div className="mt-4"><LuckyRevealCard deal={deal} /></div>
    </section>
  );
}

export function SourceBadge({ label, state, quality }: { label: string; state: string; quality: DataQuality }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-3 text-sm">
      <span className="text-ink">{label}</span>
      <div className="flex items-center gap-2"><span className="text-xs text-ink-faint">{state}</span><DataQualityBadge quality={quality} /></div>
    </div>
  );
}

export function ProofPanel({ sources, checkedAt }: { sources: string[]; checkedAt?: string }) {
  if (!sources.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white/50 p-4 text-sm">
      <div className="font-medium text-ink">Prova disponível</div>
      <p className="mt-2 text-ink-faint">Fontes: {sources.join(", ")}</p>
      {checkedAt && <p className="mt-1 text-ink-faint">Checado em {new Date(checkedAt).toLocaleString("pt-BR")}</p>}
    </div>
  );
}
