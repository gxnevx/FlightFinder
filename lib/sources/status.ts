// Status das fontes para o dashboard: o que está ativo, sem chave ou em fallback.
import type { SourceStatus } from "@/lib/types";
import { supabaseAdminConfigured } from "@/lib/supabase/admin";
import { travelpayoutsConfigured, workerConfigured } from "@/lib/sources/flights";

const has = (k: string) => Boolean((process.env[k] || "").trim());

export function computeSources(): SourceStatus[] {
  const worker = workerConfigured();
  const flightState: SourceStatus["state"] = worker ? "ativa" : "mock";
  const flightNote = worker
    ? "via worker externo (Python/browser)"
    : "mock/demo: configure FLIGHT_WORKER_URL para dados reais";

  return [
    { key: "google-flights", label: "Google Flights", state: flightState, note: flightNote, needsKey: "FLIGHT_WORKER_URL" },
    { key: "fast-flights", label: "fast-flights", state: flightState, note: flightNote, needsKey: "FLIGHT_WORKER_URL" },
    { key: "letsfg", label: "LetsFG (400+ cias)", state: flightState, note: flightNote, needsKey: "FLIGHT_WORKER_URL" },
    {
      key: "travelpayouts",
      label: "Travelpayouts",
      state: travelpayoutsConfigured() ? "ativa" : "sem-chave",
      note: travelpayoutsConfigured() ? "3a fonte + datas baratas (cache)" : "token grátis, sem cartão",
      needsKey: "TRAVELPAYOUTS_TOKEN",
    },
    { key: "awesomeapi", label: "AwesomeAPI (câmbio)", state: "ativa", note: has("AWESOMEAPI_TOKEN") ? "turismo + PTAX" : "sem token (pode cair em fallback)", needsKey: "AWESOMEAPI_TOKEN" },
    { key: "frankfurter", label: "Frankfurter / BCE", state: "ativa", note: "fallback de câmbio multi-moeda" },
    { key: "openflights", label: "OpenFlights", state: "ativa", note: "cidade para IATA, alternativos" },
    { key: "passport-index", label: "Vistos (passaporte BR)", state: "ativa", note: "dataset aberto" },
    { key: "open-meteo", label: "Open-Meteo (clima)", state: "ativa", note: "previsão e histórico" },
    {
      key: "aviationstack",
      label: "AviationStack (status)",
      state: has("AVIATIONSTACK_TOKEN") ? "ativa" : "sem-chave",
      note: has("AVIATIONSTACK_TOKEN") ? "status de voo" : "token grátis, sem cartão",
      needsKey: "AVIATIONSTACK_TOKEN",
    },
    {
      key: "supabase",
      label: "Supabase (histórico)",
      state: supabaseAdminConfigured() ? "ativa" : "fallback",
      note: supabaseAdminConfigured() ? "persistência ativa" : "em memória (configure no Vercel)",
    },
    { key: "duffel", label: "Duffel", state: "indisponível", note: "pago, fora de escopo (grátis-primeiro)" },
    { key: "kiwi", label: "Kiwi / Tequila", state: "indisponível", note: "pago; alternativa grátis: LetsFG" },
    { key: "seats-aero", label: "seats.aero (milhas)", state: "indisponível", note: "gated/pago, fora de escopo" },
    { key: "aerodatabox", label: "AeroDataBox", state: "indisponível", note: "pago; alternativa grátis: AviationStack" },
  ];
}
