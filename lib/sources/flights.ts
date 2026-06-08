// Fontes de PREÇO de voo. As reais (google-flights, fast-flights, LetsFG) dependem
// de browser/scraper Python e NÃO rodam em serverless do Vercel. Estratégia:
//   - Se FLIGHT_WORKER_URL existir, chama um worker externo (adapter) -> dados reais.
//   - Senão, devolve mock marcado como demo (a UI sinaliza claramente).
//   - Travelpayouts roda em serverless (HTTP puro) e é real quando há token.
import type { SourceResult } from "@/lib/consensus";
import type { Offer, SearchRequest } from "@/lib/types";
import { fetchJson } from "@/lib/http";
import { searchGoogleFlights } from "@/lib/sources/googleflights";

export function workerConfigured(): boolean {
  return Boolean((process.env.FLIGHT_WORKER_URL || "").trim());
}
export function travelpayoutsConfigured(): boolean {
  return Boolean((process.env.TRAVELPAYOUTS_TOKEN || "").trim());
}

async function workerSources(req: SearchRequest): Promise<SourceResult[] | null> {
  const base = (process.env.FLIGHT_WORKER_URL || "").trim();
  if (!base) return null;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const tok = (process.env.FLIGHT_WORKER_TOKEN || "").trim();
    if (tok) headers["Authorization"] = `Bearer ${tok}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const r = await fetch(`${base.replace(/\/$/, "")}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify(req),
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    return (data?.sources || []) as SourceResult[];
  } catch (e: any) {
    return [{ name: "worker", offers: [], error: e?.message || "worker indisponível" }];
  }
}

function mockOffers(req: SearchRequest): SourceResult[] {
  const seed = [...(req.origin + req.destination)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 280 + (seed % 920); // ~280..1200 USD
  const rt = req.returnDate ? 2 : 1;
  const mk = (name: string, mult: number, stops: number): Offer => ({
    source: name,
    airline: name === "google-flights" ? "LATAM" : name === "fast-flights" ? "TAP Air Portugal" : "Vueling",
    price: Math.round(base * mult * rt),
    currency: "USD",
    priceBrl: null,
    stops,
    duration: stops === 0 ? "9h 50min" : "13h",
    demo: true,
    bookingUrl: null,
  });
  return [
    { name: "google-flights", priceSignal: "typical", demo: true, offers: [mk("google-flights", 1.0, 0), mk("google-flights", 1.08, 1)] },
    { name: "fast-flights", priceSignal: "typical", demo: true, offers: [mk("fast-flights", 1.02, 0), mk("fast-flights", 1.15, 1)] },
    { name: "LetsFG", demo: true, offers: [{ ...mk("LetsFG", 0.62, 1), airline: "TAP (combo interlining)" }] },
  ];
}

async function travelpayouts(req: SearchRequest): Promise<SourceResult> {
  const tok = (process.env.TRAVELPAYOUTS_TOKEN || "").trim();
  if (!tok) return { name: "Travelpayouts", offers: [], error: "sem token (opcional)" };
  try {
    const url = `https://api.travelpayouts.com/v1/prices/cheap?origin=${req.origin}&destination=${req.destination}&currency=usd`;
    const d = await fetchJson<any>(url, { headers: { "X-Access-Token": tok }, timeout: 9000 });
    if (d?.success === false) return { name: "Travelpayouts", offers: [], error: "token inválido ou sem dados" };
    const offers: Offer[] = [];
    const data = (d?.data || {})[req.destination] || {};
    for (const v of Object.values<any>(data)) {
      offers.push({
        source: "Travelpayouts (cache)",
        airline: String(v.airline || ""),
        price: typeof v.price === "number" ? v.price : null,
        currency: "USD",
        priceBrl: null,
        stops: null,
        duration: "",
        demo: false,
      });
    }
    return { name: "Travelpayouts (cache)", offers };
  } catch (e: any) {
    return { name: "Travelpayouts", offers: [], error: e?.message || "erro" };
  }
}

export async function getFlightSources(req: SearchRequest): Promise<SourceResult[]> {
  const out: SourceResult[] = [];
  const worker = await workerSources(req);
  if (worker) {
    out.push(...worker);
  } else {
    // Google Flights via HTTP (sem chave, roda no Vercel) é a fonte real primária.
    const gf = await searchGoogleFlights(req);
    out.push(gf);
    if (!gf.offers.length) {
      // bloqueio/consent: mostra mock marcado como demo para a UI não ficar vazia.
      out.push(...mockOffers(req).filter((m) => m.name !== "google-flights"));
    }
  }
  if (travelpayoutsConfigured()) out.push(await travelpayouts(req));
  return out;
}
