// Modo consenso HONESTO.
// Regra inviolável: dado fabricado (demo) nunca entra em ranking nem dá confiança.
// Regra de independência: fast-flights e google-flights são o MESMO motor (Google)
// e contam UMA vez. Confiança "alta" exige >=2 motores independentes REAIS (live).
import type { Consensus, DataQuality, Offer } from "@/lib/types";

export interface SourceResult {
  name: string;
  engine: string;
  dataQuality: DataQuality;
  offers: Offer[];
  priceSignal?: "low" | "typical" | "high" | null;
  error?: string | null;
}

const DIVERGENCE_THRESHOLD = 0.15;
const isReal = (q: DataQuality) => q === "live" || q === "cache";

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
    sourcesUsed: [], independentEngines: [], sourcesFailed: [],
    cheapest: null, minBrl: null, medianBrl: null, maxBrl: null, spreadPct: null,
    confidence: "indisponível", priceSignal: null, divergent: false, dataQuality: "unavailable", notes: [],
  };

  for (const r of results) {
    if (r.error || !r.offers.length) {
      if (r.error) c.sourcesFailed.push(`${r.name} (${r.error})`);
      continue;
    }
  }

  // ofertas reais (live ou cache), com preço em BRL. Demo NUNCA entra.
  const real = results.flatMap((r) => r.offers).filter((o) => isReal(o.dataQuality) && o.priceBrl != null);
  const live = real.filter((o) => o.dataQuality === "live");

  // sinal de preço só de fonte real que de fato computou (fast-flights = google).
  const signalSrc = results.find((r) => isReal(r.dataQuality) && r.priceSignal && r.offers.length);
  c.priceSignal = signalSrc?.priceSignal ?? null;

  // dedupe por MOTOR: menor preço por motor (google une fast-flights + google-flights).
  const byEngine = new Map<string, Offer>();
  for (const o of real) {
    const cur = byEngine.get(o.engine);
    if (!cur || (o.priceBrl as number) < (cur.priceBrl as number)) byEngine.set(o.engine, o);
  }
  const perEngine = [...byEngine.values()];
  const liveEngines = [...new Set(live.map((o) => o.engine))];

  c.independentEngines = [...byEngine.keys()];
  c.sourcesUsed = [...new Set(real.map((o) => o.source))];

  if (perEngine.length) {
    const prices = perEngine.map((o) => o.priceBrl as number);
    c.minBrl = Math.min(...prices);
    c.maxBrl = Math.max(...prices);
    c.medianBrl = median(prices);
    if (c.minBrl > 0) c.spreadPct = (c.maxBrl - c.minBrl) / c.minBrl;
    c.cheapest = (live.length ? live : real).reduce((a, b) => ((a.priceBrl as number) <= (b.priceBrl as number) ? a : b));
  }
  c.divergent = c.spreadPct != null && c.spreadPct > threshold;
  const anyDemo = results.some((r) => r.offers.some((o) => o.dataQuality === "demo"));
  c.dataQuality = live.length ? "live" : real.length ? "cache" : anyDemo ? "demo" : "unavailable";

  if (!real.length) {
    c.confidence = "indisponível";
  } else if (liveEngines.length >= 2 && !c.divergent) {
    c.confidence = "alta";
  } else if (liveEngines.length >= 2) {
    c.confidence = "média";
  } else {
    c.confidence = "baixa"; // 1 motor live, ou só cache
  }

  // notas honestas
  const sig = signalPt(c.priceSignal);
  if (sig) c.notes.push(`Para esta rota e data, a tarifa está ${sig} (sinal do motor Google via fast-flights).`);
  const engines = new Set(real.map((o) => o.engine));
  if (engines.has("google")) c.notes.push("fast-flights e google-flights usam o mesmo motor (Google): contam como uma fonte.");
  if (liveEngines.length < 2)
    c.notes.push("Confiança limitada: menos de 2 fontes independentes reais. Configure mais fontes (worker, Duffel, seats.aero) para validar.");
  if (!live.length && real.length) c.notes.push("Preço apenas de cache (Travelpayouts), sem validação live: trate como referência, não como preço final.");
  if (c.divergent && c.spreadPct != null) c.notes.push(`Fontes divergem ${Math.round(c.spreadPct * 100)}%: confira as condições (autoconexão/bilhetes separados).`);
  return c;
}
