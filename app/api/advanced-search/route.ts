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
    const strategies = [
      { key: "flex-dates", label: "Datas flexíveis", available: (body.flexibilityDays || 0) > 0 },
      { key: "alt-airports", label: "Aeroportos alternativos", available: body.acceptsAlternativeAirports !== false },
      { key: "split-ticket", label: "Split ticket", available: false, note: "roadmap" },
      { key: "hidden-city", label: "Hidden city (apenas alerta)", available: false, note: "roadmap, nunca recomendação automática" },
      { key: "multimodal", label: "Multimodal trem/ônibus", available: false, note: "roadmap (fonte grátis pendente)" },
      { key: "miles", label: "Dinheiro vs milhas", available: false, note: "roadmap, best-effort" },
    ];
    return NextResponse.json({ ...result, searchId, strategies });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "erro interno" }, { status: 500 });
  }
}
