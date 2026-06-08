// Resolução de aeroportos e alternativos próximos (dataset OpenFlights, sem chave).
import { parseCsvLine, stripAccents } from "@/lib/csv";
import { fetchText } from "@/lib/http";

const URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number | null;
  lon: number | null;
}

const METRO: Record<string, string[]> = {
  "sao paulo": ["GRU", "CGH", "VCP"],
  "rio de janeiro": ["GIG", "SDU"],
  "belo horizonte": ["CNF", "PLU"],
  london: ["LHR", "LGW", "STN", "LTN", "LCY", "SEN"],
  paris: ["CDG", "ORY", "BVA"],
  "new york": ["JFK", "LGA", "EWR"],
  milan: ["MXP", "LIN", "BGY"],
  tokyo: ["HND", "NRT"],
  "buenos aires": ["EZE", "AEP"],
  rome: ["FCO", "CIA"],
};

let cache: { byIata: Map<string, Airport>; byCity: Map<string, string[]> } | null = null;

async function load() {
  if (cache) return cache;
  const byIata = new Map<string, Airport>();
  const byCity = new Map<string, string[]>();
  try {
    const text = await fetchText(URL, { timeout: 15000 });
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      const f = parseCsvLine(line);
      if (f.length < 8) continue;
      const iata = (f[4] || "").trim().toUpperCase();
      if (iata.length !== 3 || iata === "\\N") continue;
      const ap: Airport = {
        iata,
        name: f[1],
        city: f[2],
        country: f[3],
        lat: Number.isFinite(+f[6]) ? +f[6] : null,
        lon: Number.isFinite(+f[7]) ? +f[7] : null,
      };
      byIata.set(iata, ap);
      const ck = stripAccents(ap.city);
      byCity.set(ck, [...(byCity.get(ck) || []), iata]);
    }
  } catch {
    /* dataset indisponível: resolve() devolve o que der */
  }
  cache = { byIata, byCity };
  return cache;
}

export async function getAirport(iata: string): Promise<Airport | null> {
  const { byIata } = await load();
  return byIata.get((iata || "").toUpperCase()) || null;
}

export async function countryOf(iata: string): Promise<string | null> {
  return (await getAirport(iata))?.country || null;
}

export async function resolve(query: string): Promise<Airport[]> {
  const { byIata, byCity } = await load();
  const q = (query || "").trim();
  if (q.length === 3 && byIata.has(q.toUpperCase())) return [byIata.get(q.toUpperCase())!];
  const qn = stripAccents(q);
  const hits: Airport[] = [];
  for (const code of byCity.get(qn) || []) hits.push(byIata.get(code)!);
  if (!hits.length) {
    for (const ap of byIata.values()) {
      if (qn && (stripAccents(ap.city).includes(qn) || stripAccents(ap.name).includes(qn))) {
        hits.push(ap);
        if (hits.length >= 8) break;
      }
    }
  }
  return hits;
}

export async function alternatives(iata: string): Promise<string[]> {
  const code = (iata || "").toUpperCase();
  const { byIata, byCity } = await load();
  const out: string[] = [];
  for (const codes of Object.values(METRO)) {
    if (codes.includes(code)) {
      out.push(...codes.filter((c) => c !== code && byIata.has(c)));
      break;
    }
  }
  const ap = byIata.get(code);
  if (ap) {
    for (const c of byCity.get(stripAccents(ap.city)) || []) {
      if (c !== code && !out.includes(c)) out.push(c);
    }
  }
  return out;
}
