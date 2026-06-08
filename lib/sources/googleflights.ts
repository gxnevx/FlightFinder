// Apenas o construtor de URL do Google Flights (link de RESERVA), em BRL/pt-BR.
// O scrape por aria-label foi REMOVIDO do caminho de produção: é frágil em IP de
// datacenter (consent/JS) e seria dado não confiável apresentado como real. A
// busca real do motor Google acontece no worker externo (fast-flights).
import type { SearchRequest } from "@/lib/types";

const SEAT: Record<string, number> = { economy: 1, premium: 2, business: 3, first: 4 };

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
const lenField = (field: number, bytes: number[]) => [...tag(field, 2), ...varint(bytes.length), ...bytes];
const strField = (field: number, s: string) => lenField(field, strBytes(s));
const varField = (field: number, n: number) => [...tag(field, 0), ...varint(n)];
const leg = (date: string, from: string, to: string) => [
  ...strField(2, date), ...lenField(13, strField(2, from)), ...lenField(14, strField(2, to)),
];

function buildTfs(req: SearchRequest): string {
  const legs: number[][] = [leg(req.departureDate, req.origin, req.destination)];
  if (req.returnDate) legs.push(leg(req.returnDate, req.destination, req.origin));
  const passengers: number[] = [];
  for (let i = 0; i < (req.passengers || 1); i++) passengers.push(1);
  const bytes = [
    ...legs.flatMap((l) => lenField(3, l)),
    ...lenField(8, passengers),
    ...varField(9, SEAT[req.cabin || "economy"] || 1),
    ...varField(19, req.returnDate ? 1 : 2),
  ];
  return Buffer.from(Uint8Array.from(bytes)).toString("base64url");
}

export function googleFlightsUrl(req: SearchRequest): string {
  return `https://www.google.com/travel/flights?tfs=${buildTfs(req)}&hl=pt-BR&gl=BR&curr=BRL`;
}
