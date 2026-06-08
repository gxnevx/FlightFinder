// Status das fontes por PAPEL, refletindo a realidade (sem "mock ativo").
import type { SourceStatus } from "@/lib/types";
import { supabaseAdminConfigured } from "@/lib/supabase/admin";
import { travelpayoutsConfigured, workerConfigured } from "@/lib/sources/flights";

const has = (k: string) => Boolean((process.env[k] || "").trim());

export function computeSources(): SourceStatus[] {
  const worker = workerConfigured();
  const tp = travelpayoutsConfigured();
  const duffel = has("DUFFEL_ACCESS_TOKEN");
  const seats = has("SEATS_AERO_API_KEY");
  return [
    { key: "flight-worker", label: "Worker · Google (fast-flights) + LetsFG", role: "validation", state: worker ? "ativa" : "sem-chave", dataQuality: worker ? "live" : "unavailable", note: worker ? "motor real de preço" : "configure FLIGHT_WORKER_URL (host externo, não Vercel serverless)", needsKey: "FLIGHT_WORKER_URL" },
    { key: "duffel", label: "Duffel · validação bookável (NDC/GDS)", role: "validation", state: duffel ? "ativa" : "sem-chave", dataQuality: duffel ? "live" : "unavailable", note: "preço real independente do Google; valida ou contradiz", needsKey: "DUFFEL_ACCESS_TOKEN" },
    { key: "seats-aero", label: "seats.aero · milhas/award", role: "discovery", state: seats ? "ativa" : "sem-chave", dataQuality: seats ? "live" : "unavailable", note: "resgate em milhas vs dinheiro (o Google não mostra)", needsKey: "SEATS_AERO_API_KEY" },
    { key: "travelpayouts", label: "Travelpayouts · baseline/descoberta", role: "baseline", state: tp ? "ativa" : "sem-chave", dataQuality: tp ? "cache" : "unavailable", note: "cache (2-7 dias): tendência e datas baratas, nunca preço final", needsKey: "TRAVELPAYOUTS_TOKEN" },
    { key: "google-http", label: "Google Flights HTTP (experimental)", role: "discovery", state: "experimental", dataQuality: "hypothesis", note: "scrape por aria-label, frágil em IP de datacenter; não é fonte de produção" },
    { key: "awesomeapi", label: "AwesomeAPI · câmbio", role: "enrichment", state: "ativa", dataQuality: "live", note: has("AWESOMEAPI_TOKEN") ? "turismo + PTAX" : "sem token (cai p/ Frankfurter)", needsKey: "AWESOMEAPI_TOKEN" },
    { key: "frankfurter", label: "Frankfurter/BCE · câmbio", role: "enrichment", state: "ativa", dataQuality: "live", note: "fallback de câmbio multi-moeda" },
    { key: "openflights", label: "OpenFlights · aeroportos", role: "routing", state: "ativa", dataQuality: "live", note: "cidade para IATA, próximos" },
    { key: "passport-index", label: "Vistos · passaporte BR (ISO3)", role: "enrichment", state: "ativa", dataQuality: "live", note: "dataset aberto, normalizado por ISO3" },
    { key: "open-meteo", label: "Open-Meteo · clima", role: "enrichment", state: "ativa", dataQuality: "live", note: "previsão e histórico" },
    { key: "supabase", label: "Supabase · histórico/baseline", role: "baseline", state: supabaseAdminConfigured() ? "ativa" : "fallback", dataQuality: supabaseAdminConfigured() ? "live" : "unavailable", note: supabaseAdminConfigured() ? "persistindo" : "em memória (configure no Vercel)" },
  ];
}
