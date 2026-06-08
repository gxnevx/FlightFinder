// Fontes de PREÇO de voo, com papel e qualidade de dado explícitos.
//
// Princípio: só conta no consenso fonte INDEPENDENTE e REAL. fast-flights e
// google-flights usam o MESMO motor (Google), então recebem engine "google" e
// contam uma vez. Nada de mock apresentado como real: o motor de verdade roda
// num worker externo (FLIGHT_WORKER_URL). Sem worker, não há preço Google real.
import type { SourceResult } from "@/lib/consensus";
import type { Offer, SearchRequest } from "@/lib/types";
import { fetchJson } from "@/lib/http";

export function workerConfigured(): boolean {
  return Boolean((process.env.FLIGHT_WORKER_URL || "").trim());
}
export function travelpayoutsConfigured(): boolean {
  return Boolean((process.env.TRAVELPAYOUTS_TOKEN || "").trim());
}

function engineOf(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("google") || n.includes("fast-flights")) return "google";
  if (n.includes("letsfg")) return "letsfg";
  if (n.includes("travelpayouts")) return "travelpayouts";
  if (n.includes("duffel")) return "duffel";
  if (n.includes("mock")) return "mock";
  return n;
}

// Worker externo (Python: fast-flights + LetsFG). Única fonte de preço Google REAL.
async function workerSources(req: SearchRequest): Promise<SourceResult[] | null> {
  const base = (process.env.FLIGHT_WORKER_URL || "").trim();
  if (!base) return null;
  const now = new Date().toISOString();
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const tok = (process.env.FLIGHT_WORKER_TOKEN || "").trim();
    if (tok) headers["Authorization"] = `Bearer ${tok}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const r = await fetch(`${base.replace(/\/$/, "")}/search`, {
      method: "POST", headers, body: JSON.stringify(req), signal: ctrl.signal, cache: "no-store",
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    return ((data?.sources || []) as any[]).map((s) => ({
      name: s.name,
      engine: engineOf(s.name),
      dataQuality: "live" as const,
      priceSignal: s.priceSignal ?? null,
      error: s.error ?? null,
      offers: ((s.offers || []) as any[]).map((o) => ({
        source: s.name, engine: engineOf(s.name), dataQuality: "live" as const,
        airline: o.airline || "", price: o.price ?? null, currency: o.currency || "USD",
        priceBrl: null, stops: o.stops ?? null, duration: o.duration || "",
        bookingUrl: o.bookingUrl ?? null, checkedAt: now,
      })) as Offer[],
    }));
  } catch (e: any) {
    return [{ name: "worker", engine: "worker", dataQuality: "unavailable", offers: [], error: e?.name === "AbortError" ? "timeout" : e?.message || "worker indisponível" }];
  }
}

// Travelpayouts: BASELINE/descoberta. Dado de CACHE (2-7 dias), nunca preço final.
async function travelpayouts(req: SearchRequest): Promise<SourceResult> {
  const tok = (process.env.TRAVELPAYOUTS_TOKEN || "").trim();
  if (!tok) return { name: "Travelpayouts", engine: "travelpayouts", dataQuality: "unavailable", offers: [], error: "sem token" };
  const now = new Date().toISOString();
  try {
    const url = `https://api.travelpayouts.com/v1/prices/cheap?origin=${req.origin}&destination=${req.destination}&currency=usd`;
    const d = await fetchJson<any>(url, { headers: { "X-Access-Token": tok }, timeout: 9000 });
    if (d?.success === false) return { name: "Travelpayouts", engine: "travelpayouts", dataQuality: "unavailable", offers: [], error: "token inválido ou sem dados" };
    const offers: Offer[] = [];
    const data = (d?.data || {})[req.destination] || {};
    for (const v of Object.values<any>(data)) {
      offers.push({
        source: "Travelpayouts (cache)", engine: "travelpayouts", dataQuality: "cache",
        airline: String(v.airline || ""), price: typeof v.price === "number" ? v.price : null,
        currency: "USD", priceBrl: null, stops: null, duration: "",
        checkedAt: v.found_at || now,
      });
    }
    return { name: "Travelpayouts (cache)", engine: "travelpayouts", dataQuality: "cache", offers };
  } catch (e: any) {
    return { name: "Travelpayouts", engine: "travelpayouts", dataQuality: "unavailable", offers: [], error: e?.message || "erro" };
  }
}

// Mock: SOMENTE para testar layout (req.demo). Nunca entra em ranking/consenso real.
function mockOffers(req: SearchRequest): SourceResult[] {
  const seed = [...(req.origin + req.destination)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 280 + (seed % 920);
  const rt = req.returnDate ? 2 : 1;
  const mk = (airline: string, mult: number, stops: number): Offer => ({
    source: "demo", engine: "mock", dataQuality: "demo", airline,
    price: Math.round(base * mult * rt), currency: "USD", priceBrl: null, stops,
    duration: stops === 0 ? "9h 50min" : "13h",
  });
  return [{ name: "demo", engine: "mock", dataQuality: "demo", offers: [mk("LATAM", 1, 0), mk("TAP", 1.1, 1)] }];
}

export async function getFlightSources(req: SearchRequest): Promise<SourceResult[]> {
  const out: SourceResult[] = [];
  const worker = await workerSources(req);
  if (worker) out.push(...worker);
  if (travelpayoutsConfigured()) out.push(await travelpayouts(req));
  // Nenhuma fonte real/cache: NÃO inventa. Só usa mock se o cliente pedir layout demo.
  if (!out.some((s) => s.offers.length) && req.demo) out.push(...mockOffers(req));
  return out;
}
