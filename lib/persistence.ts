// Persistência. Usa o admin client do Supabase (server-side) quando configurado;
// senão, degrada para memória (some entre invocações serverless, ok para demo).
// Nunca grava segredos: só dados de busca/resultado.
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LuckyDeal, SearchRequest, SearchResponse } from "@/lib/types";

type Row = Record<string, any>;
const mem = {
  searches: [] as Row[],
  results: [] as Row[],
  lucky: [] as Row[],
  evals: [] as Row[],
  logs: [] as Row[],
  prefs: null as Row | null,
};

function uuid(): string {
  return (globalThis.crypto?.randomUUID?.() as string) || Math.random().toString(36).slice(2);
}

export async function saveSearch(req: SearchRequest, resp: SearchResponse, mode = "normal"): Promise<string> {
  const id = uuid();
  const created_at = new Date().toISOString();
  const search: Row = {
    id,
    created_at,
    mode,
    origin: resp.query.resolvedOrigin,
    destination: resp.query.resolvedDest,
    departure_date: req.departureDate,
    return_date: req.returnDate || null,
    flexibility_days: req.flexibilityDays || 0,
    passengers: req.passengers || 1,
    baggage: req.baggage || "carry_on",
    accepts_alternative_airports: !!req.acceptsAlternativeAirports,
    accepts_split_ticket: !!req.acceptsSplitTicket,
    accepts_multimodal: !!req.acceptsMultimodal,
    accepts_aggressive_routes: !!req.acceptsAggressiveRoutes,
    raw_request: req,
  };
  const picks = [
    { rank: 1, title: "Melhor sem pegadinha", offer: resp.bestClean },
    { rank: 2, title: "Melhor agressiva", offer: resp.bestAggressive },
  ].filter((p) => p.offer);
  const rows: Row[] = picks.map((p) => ({
    id: uuid(),
    search_id: id,
    created_at,
    rank: p.rank,
    title: p.title,
    route_summary: `${resp.query.resolvedOrigin} para ${resp.query.resolvedDest}`,
    total_price_brl: p.offer!.priceBrl,
    original_price: p.offer!.price,
    original_currency: p.offer!.currency,
    deal_score: null,
    confidence_score: resp.consensus.confidence,
    risk_level: /combo|interlining/i.test(p.offer!.airline) ? "alto" : p.offer!.stops && p.offer!.stops > 1 ? "médio" : "baixo",
    sources_used: resp.consensus.sourcesUsed,
    warnings: resp.consensus.notes,
    raw_payload: p.offer,
  }));

  const sb = createAdminClient();
  if (sb) {
    try {
      await sb.from("searches").insert(search);
      if (rows.length) await sb.from("search_results").insert(rows);
      await sb.from("source_logs").insert(
        resp.sources.map((s) => ({ id: uuid(), created_at, source_name: s.key, endpoint_or_adapter: s.label, status: s.state, duration_ms: null, error_message: null, metadata: { note: s.note } }))
      );
    } catch {
      mem.searches.unshift(search);
      mem.results.unshift(...rows);
    }
  } else {
    mem.searches.unshift(search);
    mem.results.unshift(...rows);
  }
  return id;
}

export async function saveLuckyDeal(deal: LuckyDeal): Promise<void> {
  const row: Row = {
    id: uuid(),
    created_at: new Date().toISOString(),
    headline: deal.headline,
    origin: deal.origin,
    destination: deal.destination,
    start_date: deal.startDate,
    end_date: deal.endDate,
    total_price_brl: deal.totalPriceBrl,
    typical_price_brl: deal.typicalPriceBrl,
    percent_below_typical: deal.percentBelowTypical,
    deal_score: deal.dealScore,
    urgency: deal.urgency,
    confidence_score: deal.confidence,
    sources_used: deal.sourcesUsed,
    caveats: deal.caveats,
    raw_payload: deal,
  };
  const sb = createAdminClient();
  if (sb) {
    try {
      await sb.from("lucky_deals").insert(row);
      return;
    } catch {
      /* cai para memória */
    }
  }
  mem.lucky.unshift(row);
}

export async function saveEvalRun(row: Row): Promise<void> {
  const r = { id: uuid(), created_at: new Date().toISOString(), ...row };
  const sb = createAdminClient();
  if (sb) {
    try {
      await sb.from("eval_runs").insert(r);
      return;
    } catch {
      /* memória */
    }
  }
  mem.evals.unshift(r);
}

async function list(table: keyof typeof mem, limit: number): Promise<Row[]> {
  const sb = createAdminClient();
  if (sb) {
    try {
      const { data } = await sb.from(table as string).select("*").order("created_at", { ascending: false }).limit(limit);
      return data || [];
    } catch {
      /* memória */
    }
  }
  return (mem[table] as Row[]).slice(0, limit);
}

export const listSearches = (limit = 20) => list("searches", limit);
export const listLuckyDeals = (limit = 20) => list("lucky", limit);
export const listEvals = (limit = 20) => list("evals", limit);

export async function getPreferences(): Promise<Row | null> {
  const sb = createAdminClient();
  if (sb) {
    try {
      const { data } = await sb.from("user_preferences").select("*").limit(1).maybeSingle();
      return data || null;
    } catch {
      /* memória */
    }
  }
  return mem.prefs;
}

export async function savePreferences(prefs: Row): Promise<Row> {
  const row = { id: prefs.id || "default", updated_at: new Date().toISOString(), ...prefs };
  const sb = createAdminClient();
  if (sb) {
    try {
      await sb.from("user_preferences").upsert(row);
      return row;
    } catch {
      /* memória */
    }
  }
  mem.prefs = row;
  return row;
}
