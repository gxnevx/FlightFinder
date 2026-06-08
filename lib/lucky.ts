// Modo "estou com sorte": destino aberto a partir de São Paulo + deal score.
// Sem worker/Travelpayouts, usa um catálogo com preços típicos e gera achados
// pseudo-aleatórios estáveis por dia, SEMPRE marcados como demo (não inventa
// promoção real). Com token/worker, a camada pode ser trocada por dados reais.
import { getRate, toBrl } from "@/lib/sources/currency";
import type { Confidence, LuckyDeal } from "@/lib/types";

interface Dest {
  iata: string;
  name: string;
  country: string;
  typicalUsd: number;
  intercont: boolean;
}

const CATALOG: Dest[] = [
  { iata: "EZE", name: "Buenos Aires", country: "Argentina", typicalUsd: 360, intercont: false },
  { iata: "SCL", name: "Santiago", country: "Chile", typicalUsd: 420, intercont: false },
  { iata: "MVD", name: "Montevidéu", country: "Uruguay", typicalUsd: 400, intercont: false },
  { iata: "LIM", name: "Lima", country: "Peru", typicalUsd: 520, intercont: false },
  { iata: "BOG", name: "Bogotá", country: "Colombia", typicalUsd: 560, intercont: false },
  { iata: "MIA", name: "Miami", country: "United States", typicalUsd: 720, intercont: true },
  { iata: "JFK", name: "Nova York", country: "United States", typicalUsd: 780, intercont: true },
  { iata: "CUN", name: "Cancún", country: "Mexico", typicalUsd: 760, intercont: true },
  { iata: "LIS", name: "Lisboa", country: "Portugal", typicalUsd: 1080, intercont: true },
  { iata: "MAD", name: "Madri", country: "Spain", typicalUsd: 1120, intercont: true },
  { iata: "CDG", name: "Paris", country: "France", typicalUsd: 1180, intercont: true },
  { iata: "FCO", name: "Roma", country: "Italy", typicalUsd: 1220, intercont: true },
  { iata: "NRT", name: "Tóquio", country: "Japan", typicalUsd: 1650, intercont: true },
  { iata: "DXB", name: "Dubai", country: "United Arab Emirates", typicalUsd: 1480, intercont: true },
];

export interface LuckyRequest {
  window?: 7 | 30 | 60 | 90;
  type?: "any" | "beach" | "europe" | "asia" | "south-america" | "weekend" | "last-minute";
  budgetBrl?: number | null;
  aggressive?: boolean;
}

export interface LuckyResult {
  headline: LuckyDeal | null;
  runnersUp: LuckyDeal[];
  honest: string | null; // mensagem quando não há pérola real
  demo: boolean;
}

// hash estável por dia (mesmo achado durante o dia)
function seeded(s: string): number {
  let h = 2166136261;
  for (const c of s) h = (h ^ c.charCodeAt(0)) * 16777619;
  return Math.abs(h % 1000) / 1000;
}

function dealScore(percentBelow: number, totalBrl: number, d: Dest): number {
  let s = percentBelow * 1.05;
  if (d.intercont && totalBrl < 2500) s += 25;
  if (!d.intercont && totalBrl < 900) s += 15;
  return Math.max(0, Math.min(100, Math.round(s)));
}

function filterByType(type: LuckyRequest["type"]): Dest[] {
  switch (type) {
    case "europe":
      return CATALOG.filter((d) => ["Portugal", "Spain", "France", "Italy"].includes(d.country));
    case "asia":
      return CATALOG.filter((d) => ["Japan", "United Arab Emirates"].includes(d.country));
    case "south-america":
      return CATALOG.filter((d) => !d.intercont);
    case "beach":
      return CATALOG.filter((d) => ["CUN", "MIA", "LIS"].includes(d.iata));
    default:
      return CATALOG;
  }
}

export async function runLucky(req: LuckyRequest): Promise<LuckyResult> {
  const rate = await getRate(["USD"]);
  const today = new Date().toISOString().slice(0, 10);
  const win = req.window || 60;

  const deals: LuckyDeal[] = filterByType(req.type).map((d) => {
    const frac = 0.45 + seeded(d.iata + today) * 0.7; // 0.45..1.15 do típico
    const foundUsd = Math.round(d.typicalUsd * frac);
    const totalBrl = toBrl(foundUsd, "USD", rate) ?? foundUsd * 5.3;
    const typicalBrl = toBrl(d.typicalUsd, "USD", rate) ?? d.typicalUsd * 5.3;
    const percentBelow = Math.round((1 - foundUsd / d.typicalUsd) * 100);
    const score = dealScore(percentBelow, totalBrl, d);
    const startOffset = 10 + Math.floor(seeded(d.iata + "s") * (win - 12));
    const start = new Date(Date.now() + startOffset * 86400000).toISOString().slice(0, 10);
    const end = new Date(Date.now() + (startOffset + 6) * 86400000).toISOString().slice(0, 10);
    return {
      headline: `${d.name} por R$ ${Math.round(totalBrl).toLocaleString("pt-BR")} ida e volta`,
      origin: "GRU",
      destination: d.iata,
      destinationName: d.name,
      startDate: start,
      endDate: end,
      totalPriceBrl: Math.round(totalBrl),
      typicalPriceBrl: Math.round(typicalBrl),
      percentBelowTypical: percentBelow,
      dealScore: score,
      urgency: percentBelow >= 40 ? "alta: tarifas assim costumam durar 1 a 3 dias" : "moderada",
      confidence: "baixa" as Confidence,
      sourcesUsed: ["catálogo demo"],
      caveats: [
        "valores de demonstração (configure FLIGHT_WORKER_URL ou TRAVELPAYOUTS_TOKEN para dados reais)",
        ...(d.intercont ? ["destino internacional: confira visto para passaporte BR"] : []),
      ],
      demo: true,
    };
  });

  const budget = req.budgetBrl ?? Infinity;
  const eligible = deals.filter((d) => d.totalPriceBrl <= budget).sort((a, b) => b.dealScore - a.dealScore);
  const isPerola = (d: LuckyDeal) => (d.percentBelowTypical ?? 0) >= 40 || (d.totalPriceBrl < 1500);

  const top = eligible[0] || null;
  if (top && isPerola(top)) {
    return { headline: top, runnersUp: eligible.slice(1, 4), honest: null, demo: true };
  }
  return {
    headline: null,
    runnersUp: eligible.slice(0, 3),
    honest: "Hoje não achei nada absurdo. Estes são os melhores quase achados (sem inflar nada).",
    demo: true,
  };
}
