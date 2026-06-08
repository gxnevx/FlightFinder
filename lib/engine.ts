// Orquestrador da busca (modo consenso). Roda 100% server-side.
import { buildConsensus, type SourceResult } from "@/lib/consensus";
import { alternatives, countryOf, getAirport, resolve } from "@/lib/sources/airports";
import { getRate, toBrl } from "@/lib/sources/currency";
import { getFlightSources } from "@/lib/sources/flights";
import { computeSources } from "@/lib/sources/status";
import { checkVisa } from "@/lib/sources/visa";
import { weatherSummary } from "@/lib/sources/weather";
import type { Offer, RateInfo, SearchRequest, SearchResponse } from "@/lib/types";

const cheapest = (xs: Offer[]): Offer | null =>
  xs.length ? xs.reduce((a, b) => ((a.priceBrl as number) <= (b.priceBrl as number) ? a : b)) : null;

export async function runSearch(req: SearchRequest): Promise<SearchResponse> {
  const [oList, dList] = await Promise.all([resolve(req.origin), resolve(req.destination)]);
  const resolvedOrigin = oList[0]?.iata || req.origin.toUpperCase();
  const resolvedDest = dList[0]?.iata || req.destination.toUpperCase();
  const destCountry = await countryOf(resolvedDest);
  const effReq: SearchRequest = { ...req, origin: resolvedOrigin, destination: resolvedDest };

  const results: SourceResult[] = await getFlightSources(effReq);
  if (req.gfUsd != null) {
    results.push({
      name: "google-flights",
      offers: [{ source: "google-flights", airline: "(consolidado google-flights)", price: req.gfUsd, currency: "USD", priceBrl: null, stops: 0, duration: "" }],
    });
  }

  const currencies = Array.from(
    new Set(results.flatMap((r) => r.offers).filter((o) => o.price != null).map((o) => o.currency))
  );
  const rate = await getRate(currencies);
  for (const r of results) for (const o of r.offers) o.priceBrl = toBrl(o.price, o.currency, rate);

  const consensus = buildConsensus(results);

  const priced = results.flatMap((r) => r.offers).filter((o) => o.priceBrl != null);
  const clean = priced.filter((o) => o.stops != null && o.stops <= 1 && !/combo|interlining|autocone/i.test(o.airline));
  const bestClean = cheapest(clean.length ? clean : priced);
  const bestAggressive = cheapest(priced);
  const savingsPct =
    bestClean && bestAggressive && bestClean.priceBrl && bestClean.priceBrl > 0 && bestAggressive !== bestClean
      ? (bestClean.priceBrl - (bestAggressive.priceBrl as number)) / bestClean.priceBrl
      : null;

  const iof = rate.iofPct;
  const rateInfo: RateInfo = {
    source: rate.source,
    iofPct: iof,
    usdBase: rate.base["USD"] ?? null,
    usdEffective: rate.base["USD"] != null ? rate.base["USD"] * (1 + iof / 100) : null,
    ptaxUsd: rate.ptaxUsd,
    currencies: Object.fromEntries(
      Object.entries(rate.base).map(([k, v]) => [k, { base: v, effective: v * (1 + iof / 100) }])
    ),
    trendNote: rate.trendNote,
    warnings: rate.warnings,
    checkedAt: rate.checkedAt,
  };

  const visa = destCountry && destCountry.toLowerCase() !== "brazil" ? await checkVisa(destCountry, req.passport || "Brazil") : null;

  let weather: string | null = null;
  try {
    const ap = await getAirport(resolvedDest);
    weather = await weatherSummary(ap?.city || req.destination, req.departureDate, req.returnDate || undefined);
  } catch {
    /* clima é opcional */
  }

  const wantAlts = req.acceptsAlternativeAirports !== false;
  const [altO, altD] = wantAlts ? await Promise.all([alternatives(resolvedOrigin), alternatives(resolvedDest)]) : [[], []];

  return {
    query: { ...req, resolvedOrigin, resolvedDest, destCountry },
    consensus,
    bestClean,
    bestAggressive,
    savingsPct,
    rate: rateInfo,
    visa,
    weather,
    alternatives: { origin: altO, dest: altD },
    sources: computeSources(),
    warnings: rate.warnings,
    demo: priced.some((o) => o.demo) || results.some((r) => r.demo),
  };
}
