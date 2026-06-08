// Modo consenso: cruza as fontes, reconcilia preços (BRL) e atribui confiança.
import type { Consensus, Offer } from "@/lib/types";

export interface SourceResult {
  name: string;
  offers: Offer[];
  priceSignal?: "low" | "typical" | "high" | null;
  error?: string | null;
  demo?: boolean;
}

const DIVERGENCE_THRESHOLD = 0.15;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function signalPt(sig?: string | null): string | null {
  return sig === "low" ? "barata" : sig === "typical" ? "típica" : sig === "high" ? "cara" : null;
}

export function buildConsensus(results: SourceResult[], threshold = DIVERGENCE_THRESHOLD): Consensus {
  const c: Consensus = {
    sourcesUsed: [],
    sourcesFailed: [],
    cheapest: null,
    minBrl: null,
    medianBrl: null,
    maxBrl: null,
    spreadPct: null,
    confidence: "indisponível",
    priceSignal: null,
    divergent: false,
    notes: [],
  };

  const perSource: number[] = [];
  const allPriced: Offer[] = [];

  for (const r of results) {
    if (r.error) {
      c.sourcesFailed.push(`${r.name} (${r.error})`);
      continue;
    }
    if (r.priceSignal && !c.priceSignal) c.priceSignal = r.priceSignal;
    const priced = r.offers.filter((o) => o.priceBrl != null);
    if (!priced.length) {
      c.sourcesFailed.push(`${r.name} (sem preço convertível)`);
      continue;
    }
    c.sourcesUsed.push(r.name);
    perSource.push(Math.min(...priced.map((o) => o.priceBrl as number)));
    allPriced.push(...priced);
  }

  const named = allPriced.filter((o) => (o.airline || "").trim());
  const pool = named.length ? named : allPriced;
  if (pool.length) c.cheapest = pool.reduce((a, b) => ((a.priceBrl as number) <= (b.priceBrl as number) ? a : b));

  const n = perSource.length;
  if (n) {
    c.minBrl = Math.min(...perSource);
    c.maxBrl = Math.max(...perSource);
    c.medianBrl = median(perSource);
    if (c.minBrl > 0) c.spreadPct = (c.maxBrl - c.minBrl) / c.minBrl;
  }
  c.divergent = c.spreadPct != null && c.spreadPct > threshold;

  if (n >= 2 && !c.divergent) c.confidence = "alta";
  else if (n >= 2 && c.spreadPct != null && c.spreadPct <= 0.3) c.confidence = "média";
  else if (n >= 1) c.confidence = "baixa";
  else c.confidence = "indisponível";

  const sig = signalPt(c.priceSignal);
  if (sig) c.notes.push(`Para esta rota e data, a tarifa está ${sig} (sinal fast-flights).`);
  if (c.divergent && c.spreadPct != null)
    c.notes.push(
      `Fontes divergem ${Math.round(c.spreadPct * 100)}% (acima de ${Math.round(threshold * 100)}%): ` +
        "pode haver combos de autoconexão (bilhetes separados); confira as condições."
    );
  return c;
}
