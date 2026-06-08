// Orquestrador da busca (modo consenso honesto). Roda 100% server-side.
import { buildConsensus, type SourceResult } from "@/lib/consensus";
import { alternatives, countryOf, getAirport, resolve } from "@/lib/sources/airports";
import { getRate, toBrl } from "@/lib/sources/currency";
import { getFlightSources } from "@/lib/sources/flights";
import { googleFlightsUrl } from "@/lib/sources/googleflights";
import { computeSources } from "@/lib/sources/status";
import { checkVisa } from "@/lib/sources/visa";
import { weatherSummary } from "@/lib/sources/weather";
import type { Offer, RateInfo, SearchRequest, SearchResponse } from "@/lib/types";

const cheapest = (xs: Offer[]): Offer | null =>
  xs.length ? xs.reduce((a, b) => ((a.priceBrl as number) <= (b.priceBrl as number) ? a : b)) : null;
const isCombo = (o: Offer) => /combo|interlining|autocone/i.test(o.airline || "");

export async function runSearch(req: SearchRequest): Promise<SearchResponse> {
  const [oList, dList] = await Promise.all([resolve(req.origin), resolve(req.destination)]);
  const resolvedOrigin = oList[0]?.iata || req.origin.toUpperCase();
  const resolvedDest = dList[0]?.iata || req.destination.toUpperCase();
  const destCountry = await countryOf(resolvedDest);
  const effReq: SearchRequest = { ...req, origin: resolvedOrigin, destination: resolvedDest };

  const results: SourceResult[] = await getFlightSources(effReq);

  const currencies = Array.from(new Set(results.flatMap((r) => r.offers).filter((o) => o.price != null).map((o) => o.currency)));
  const rate = await getRate(currencies);
  for (const r of results) for (const o of r.offers) o.priceBrl = toBrl(o.price, o.currency, rate);

  const consensus = buildConsensus(results);

  const real = results.flatMap((r) => r.offers).filter((o) => (o.dataQuality === "live" || o.dataQuality === "cache") && o.priceBrl != null);
  const live = real.filter((o) => o.dataQuality === "live");
  // sem pegadinha: só LIVE, um bilhete (não combo), conexões controladas, não cache.
  const cleanPool = live.filter((o) => !isCombo(o) && (o.stops == null || o.stops <= 1) && o.engine !== "travelpayouts");
  const bestNoTrick = cheapest(cleanPool);
  const cheapestRaw = cheapest(real);
  const bestAggressive = cheapestRaw && bestNoTrick && cheapestRaw !== bestNoTrick ? cheapestRaw : null;
  const savingsPct =
    bestNoTrick && bestAggressive && bestNoTrick.priceBrl && (bestAggressive.priceBrl as number) < bestNoTrick.priceBrl
      ? (bestNoTrick.priceBrl - (bestAggressive.priceBrl as number)) / bestNoTrick.priceBrl
      : null;
  const topOffers = [...real]
    .sort((a, b) => (a.priceBrl as number) - (b.priceBrl as number))
    .filter((o, i, arr) => arr.findIndex((x) => x.priceBrl === o.priceBrl && x.airline === o.airline) === i)
    .slice(0, 6);

  const iof = rate.iofPct;
  const rateInfo: RateInfo = {
    source: rate.source, iofPct: iof, iofApplied: rate.iofApplied, iofLabel: rate.iofLabel,
    usdBase: rate.base["USD"] ?? null,
    usdEffective: rate.base["USD"] != null ? rate.base["USD"] * (rate.iofApplied ? 1 + iof / 100 : 1) : null,
    ptaxUsd: rate.ptaxUsd,
    currencies: Object.fromEntries(Object.entries(rate.base).map(([k, v]) => [k, { base: v, effective: v * (rate.iofApplied ? 1 + iof / 100 : 1) }])),
    trendNote: rate.trendNote, warnings: rate.warnings, checkedAt: rate.checkedAt,
  };

  const visa = destCountry && destCountry.toLowerCase() !== "brazil" ? await checkVisa(destCountry, req.passport || "Brazil") : null;
  let weather: string | null = null;
  try {
    const ap = await getAirport(resolvedDest);
    weather = await weatherSummary(ap?.city || req.destination, req.departureDate, req.returnDate || undefined);
  } catch { /* opcional */ }
  const wantAlts = req.acceptsAlternativeAirports !== false;
  const [altO, altD] = wantAlts ? await Promise.all([alternatives(resolvedOrigin), alternatives(resolvedDest)]) : [[], []];

  const warnings = [...rate.warnings];
  if ((req.flexibilityDays || 0) > 0) warnings.push("Datas flexíveis ainda não varrem a janela sem o worker externo (não ative isso como vantagem).");
  if (wantAlts && (altO.length || altD.length)) warnings.push("Aeroportos alternativos listados são apenas próximos; o preço real neles não foi pesquisado (requer worker).");

  let honestMessage: string | undefined;
  if (!real.length) {
    honestMessage = results.some((r) => r.offers.some((o) => o.dataQuality === "demo"))
      ? "Modo demonstração: valores fictícios para testar o layout. NÃO são ofertas reais."
      : "Nenhuma fonte real configurada. Configure FLIGHT_WORKER_URL (motor Google/LetsFG), TRAVELPAYOUTS_TOKEN (baseline) ou DUFFEL_ACCESS_TOKEN (validação). Sem isso, não há preço real para mostrar.";
  } else if (!live.length) {
    honestMessage = "Apenas dados de cache (Travelpayouts). É referência de tendência, não preço final validado.";
  }

  return {
    query: { ...req, resolvedOrigin, resolvedDest, destCountry },
    consensus,
    bestNoTrick, bestAggressive, cheapestRaw,
    savingsPct,
    rate: rateInfo,
    visa, weather,
    alternatives: { origin: altO, dest: altD },
    sources: computeSources(),
    warnings,
    dataQuality: consensus.dataQuality,
    honestMessage,
    bookingUrl: googleFlightsUrl(effReq),
    topOffers,
  };
}
