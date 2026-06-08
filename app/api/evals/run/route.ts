import { NextResponse } from "next/server";
import { runSearch } from "@/lib/engine";
import { saveEvalRun } from "@/lib/persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string };
  const defs: { name: string; req: any }[] = [
    { name: "GRU para LIS (datas flexíveis)", req: { origin: "GRU", destination: "LIS", departureDate: future(90), returnDate: future(97), flexibilityDays: 3 } },
    { name: "GRU para MIA (ida e volta)", req: { origin: "GRU", destination: "MIA", departureDate: future(60), returnDate: future(70) } },
    { name: "GRU para CDG (Europa)", req: { origin: "GRU", destination: "CDG", departureDate: future(120), returnDate: future(130) } },
  ];
  const toRun = body?.name ? defs.filter((d) => d.name === body.name) : defs;

  const results: any[] = [];
  for (const d of toRun) {
    const t0 = Date.now();
    let status = "ok";
    let error: string | null = null;
    let consolidated: any = null;
    let sources: string[] = [];
    try {
      const r = await runSearch(d.req);
      sources = r.consensus.sourcesUsed;
      consolidated = {
        bestNoTrick: r.bestNoTrick?.priceBrl ?? null,
        bestAggressive: r.bestAggressive?.priceBrl ?? null,
        confidence: r.consensus.confidence,
        independentEngines: r.consensus.independentEngines,
        minBrl: r.consensus.minBrl,
        maxBrl: r.consensus.maxBrl,
        divergent: r.consensus.divergent,
        dataQuality: r.dataQuality,
        honestMessage: r.honestMessage ?? null,
      };
    } catch (e: any) {
      status = "erro";
      error = e?.message || "erro";
    }
    const row = {
      eval_name: d.name,
      status,
      duration_ms: Date.now() - t0,
      sources_called: sources,
      errors: error ? [error] : [],
      consolidated_result: consolidated,
      raw_payload: { req: d.req },
    };
    try {
      await saveEvalRun(row);
    } catch {
      /* best-effort */
    }
    results.push(row);
  }
  return NextResponse.json({ results });
}
