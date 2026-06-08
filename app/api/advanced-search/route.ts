import { NextResponse } from "next/server";
import { runSearch } from "@/lib/engine";
import { saveSearch } from "@/lib/persistence";
import type { SearchRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Busca avançada: por ora reusa o engine de consenso honrando flags (datas
// flexíveis, aeroportos alternativos). Estratégias split/hidden/positioning/
// multimodal entram aqui conforme forem implementadas (roadmap).
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SearchRequest;
    if (!body?.origin || !body?.destination || !body?.departureDate) {
      return NextResponse.json({ error: "origin, destination e departureDate são obrigatórios" }, { status: 400 });
    }
    const result = await runSearch(body);
    let searchId: string | null = null;
    try {
      searchId = await saveSearch(body, result, "advanced");
    } catch {
      /* best-effort */
    }
    const hasWorker = Boolean((process.env.FLIGHT_WORKER_URL || "").trim());
    const strategies = [
      { key: "flex-dates", label: "Datas flexíveis (matriz +/- dias)", available: hasWorker, note: hasWorker ? "via worker" : "requer FLIGHT_WORKER_URL" },
      { key: "alt-airports", label: "Aeroportos alternativos (preço real)", available: hasWorker, note: hasWorker ? "via worker" : "requer FLIGHT_WORKER_URL" },
      { key: "split-ticket", label: "Split ticket", available: false, note: "roadmap (worker)" },
      { key: "positioning", label: "Voo de posicionamento", available: false, note: "roadmap (worker)" },
      { key: "hidden-city", label: "Hidden city (só alerta, nunca top)", available: false, note: "roadmap" },
      { key: "miles", label: "Dinheiro vs milhas (seats.aero)", available: false, note: "requer SEATS_AERO_API_KEY" },
    ];
    return NextResponse.json({ ...result, searchId, strategies });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "erro interno" }, { status: 500 });
  }
}
