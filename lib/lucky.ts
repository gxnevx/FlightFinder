// Modo "estou com sorte" HONESTO.
// - Sem fonte de descoberta real: NÃO inventa pérola (antes era PRNG sobre catálogo).
// - Com Travelpayouts (cache): entrega "candidatos promissores", nunca "ouro".
// - "Ouro" exige validação live (worker/Duffel), feita numa fase seguinte.
import { fetchJson } from "@/lib/http";
import { getRate, toBrl } from "@/lib/sources/currency";
import type { DataQuality, LuckyDeal } from "@/lib/types";

export interface LuckyRequest {
  window?: 7 | 30 | 60 | 90;
  type?: string;
  budgetBrl?: number | null;
  aggressive?: boolean;
}

export interface LuckyResult {
  headline: LuckyDeal | null; // só quando for ouro validado live
  runnersUp: LuckyDeal[];
  almostDeals: LuckyDeal[]; // candidatos promissores (cache), não validados
  honestMessage: string | null;
  dataQuality: DataQuality;
  sources: string[];
  checkedAt: string;
}

const ORIGINS = ["GRU", "CGH", "VCP"];

async function tpAnywhere(origin: string): Promise<any[]> {
  const tok = (process.env.TRAVELPAYOUTS_TOKEN || "").trim();
  const url = `https://api.travelpayouts.com/v1/prices/cheap?origin=${origin}&currency=usd`;
  const d = await fetchJson<any>(url, { headers: { "X-Access-Token": tok }, timeout: 9000 });
  const out: any[] = [];
  for (const [dest, opts] of Object.entries<any>(d?.data || {})) {
    const first = Object.values<any>(opts)[0];
    if (first) out.push({ origin, dest, ...first });
  }
  return out;
}

export async function runLucky(req: LuckyRequest): Promise<LuckyResult> {
  const now = new Date().toISOString();
  const hasTP = Boolean((process.env.TRAVELPAYOUTS_TOKEN || "").trim());
  const hasLive = Boolean((process.env.FLIGHT_WORKER_URL || "").trim() || (process.env.DUFFEL_ACCESS_TOKEN || "").trim());

  if (!hasTP) {
    return {
      headline: null, runnersUp: [], almostDeals: [],
      honestMessage:
        "Nenhuma fonte de descoberta configurada (TRAVELPAYOUTS_TOKEN). Não invento pérolas. " +
        "Configure Travelpayouts para candidatos promissores, e FLIGHT_WORKER_URL ou DUFFEL_ACCESS_TOKEN para validar como ouro real.",
      dataQuality: "unavailable", sources: [], checkedAt: now,
    };
  }

  const rate = await getRate(["USD"]);
  let raw: any[] = [];
  try {
    const lists = await Promise.all(ORIGINS.map((o) => tpAnywhere(o).catch(() => [])));
    raw = lists.flat();
  } catch {
    /* segue vazio */
  }
  if (!raw.length) {
    return {
      headline: null, runnersUp: [], almostDeals: [],
      honestMessage: "Travelpayouts não retornou candidatos agora (cache vazio para esses origens).",
      dataQuality: "cache", sources: ["Travelpayouts (cache)"], checkedAt: now,
    };
  }

  const budget = req.budgetBrl ?? Infinity;
  const deals: LuckyDeal[] = raw
    .map((r) => {
      const brl = toBrl(r.price, "USD", rate) ?? r.price * 5.3;
      return {
        headline: `${r.origin} para ${r.dest}`,
        origin: r.origin, destination: r.dest, destinationName: r.dest,
        startDate: String(r.departure_at || "").slice(0, 10),
        endDate: String(r.return_at || "").slice(0, 10),
        totalPriceBrl: Math.round(brl),
        typicalPriceBrl: null, percentBelowTypical: null,
        dealScore: Math.min(50, Math.max(5, Math.round(50 - brl / 400))), // cache sem baseline: score limitado
        urgency: "cache, não validado",
        confidence: "baixa" as const,
        dataQuality: "cache" as const,
        sourcesUsed: ["Travelpayouts (cache)"],
        caveats: ["preço de cache (2-7 dias), não validado live; pode já ter mudado", "sem baseline histórico, o deal score é limitado"],
      };
    })
    .filter((d) => d.totalPriceBrl <= budget)
    .sort((a, b) => b.dealScore - a.dealScore || a.totalPriceBrl - b.totalPriceBrl);

  return {
    headline: null, // NUNCA ouro sem validação live
    runnersUp: [],
    almostDeals: deals.slice(0, 6),
    honestMessage: hasLive
      ? "Candidatos de cache (Travelpayouts). Valide os melhores com a fonte live antes de chamar de ouro."
      : "Candidatos promissores de cache (Travelpayouts), ainda NÃO validados como ouro real. Configure FLIGHT_WORKER_URL ou DUFFEL_ACCESS_TOKEN para validar.",
    dataQuality: "cache", sources: ["Travelpayouts (cache)"], checkedAt: now,
  };
}
