// Fonte de preço REAL e sem chave, que roda em serverless (Vercel): monta o
// mesmo protobuf `tfs` do Google Flights, busca por HTTP (sem browser) e faz
// parse dos aria-label das ofertas. Preços em USD (o engine converte p/ BRL+IOF).
// Se o Google bloquear o IP (consent/captcha), retorna erro e o caller cai no mock.
import type { SourceResult } from "@/lib/consensus";
import type { Offer, SearchRequest } from "@/lib/types";

const SEAT: Record<string, number> = { economy: 1, premium: 2, business: 3, first: 4 };

// --- mini codificador protobuf ---
function varint(n: number): number[] {
  const out: number[] = [];
  let v = n >>> 0;
  while (v > 0x7f) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
  return out;
}
const tag = (field: number, wire: number) => varint((field << 3) | wire);
const strBytes = (s: string) => Array.from(Buffer.from(s, "utf8"));
function lenField(field: number, bytes: number[]): number[] {
  return [...tag(field, 2), ...varint(bytes.length), ...bytes];
}
const strField = (field: number, s: string) => lenField(field, strBytes(s));
const varField = (field: number, n: number) => [...tag(field, 0), ...varint(n)];

function leg(date: string, from: string, to: string): number[] {
  return [...strField(2, date), ...lenField(13, strField(2, from)), ...lenField(14, strField(2, to))];
}

function buildTfs(req: SearchRequest): string {
  const legs: number[][] = [leg(req.departureDate, req.origin, req.destination)];
  if (req.returnDate) legs.push(leg(req.returnDate, req.destination, req.origin));
  const passengers: number[] = [];
  for (let i = 0; i < (req.passengers || 1); i++) passengers.push(1); // 1 = adulto
  const bytes = [
    ...legs.flatMap((l) => lenField(3, l)),
    ...lenField(8, passengers),
    ...varField(9, SEAT[req.cabin || "economy"] || 1),
    ...varField(19, req.returnDate ? 1 : 2), // 1 round-trip, 2 one-way
  ];
  return Buffer.from(Uint8Array.from(bytes)).toString("base64url");
}

// URL voltada ao usuário (BRL, pt-BR): abre o Google Flights na rota/data exatas
// para selecionar o voo e concluir a reserva no provedor.
export function googleFlightsUrl(req: SearchRequest): string {
  return `https://www.google.com/travel/flights?tfs=${buildTfs(req)}&hl=pt-BR&gl=BR&curr=BRL`;
}

function fmtDuration(s: string): string {
  return s.replace(" hr", "h").replace(" min", "min").replace("hr", "h");
}

function parse(html: string): Offer[] {
  const offers: Offer[] = [];
  const seen = new Set<string>();
  const re = /aria-label="(From [\d,]+ US dollars[^"]*?flight with[^"]*?)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const label = m[1];
    const price = Number((label.match(/From ([\d,]+) US dollars/)?.[1] || "").replace(/,/g, ""));
    if (!price) continue;
    const stopsM = label.match(/(Nonstop|(\d+) stop)/);
    const stops = stopsM ? (stopsM[1] === "Nonstop" ? 0 : Number(stopsM[2])) : null;
    const airline = (label.match(/flight with ([^.]+?)\./)?.[1] || "").trim();
    const duration = fmtDuration((label.match(/Total duration ([\d hrmin]+?)\./)?.[1] || "").trim());
    const key = `${price}|${airline}|${duration}`;
    if (seen.has(key)) continue;
    seen.add(key);
    offers.push({ source: "google-flights", airline, price, currency: "USD", priceBrl: null, stops, duration });
    if (offers.length >= 30) break;
  }
  return offers;
}

export async function searchGoogleFlights(req: SearchRequest): Promise<SourceResult> {
  try {
    const tfs = buildTfs(req);
    const url = `https://www.google.com/travel/flights?tfs=${tfs}&tfu=EgYIABABGAA&hl=en&gl=us&curr=USD`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 18000);
    const r = await fetch(url, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(t);
    if (!r.ok) return { name: "google-flights", offers: [], error: `HTTP ${r.status}` };
    const html = await r.text();
    const offers = parse(html);
    if (!offers.length) return { name: "google-flights", offers: [], error: "sem resultados (bloqueio/consent?)" };
    const book = googleFlightsUrl(req);
    for (const o of offers) o.bookingUrl = book;
    return { name: "google-flights", offers, priceSignal: "typical" };
  } catch (e: any) {
    return { name: "google-flights", offers: [], error: e?.name === "AbortError" ? "timeout" : e?.message || "erro" };
  }
}
