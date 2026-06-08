import { NextResponse } from "next/server";
import { runLucky, type LuckyRequest } from "@/lib/lucky";
import { saveLuckyDeal } from "@/lib/persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as LuckyRequest;
    const result = await runLucky(body);
    if (result.headline) {
      try {
        await saveLuckyDeal(result.headline);
      } catch {
        /* best-effort */
      }
    }
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "erro interno" }, { status: 500 });
  }
}
