import { NextResponse } from "next/server";
import { runSearch } from "@/lib/engine";
import { saveSearch } from "@/lib/persistence";
import type { SearchRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SearchRequest;
    if (!body?.origin || !body?.destination || !body?.departureDate) {
      return NextResponse.json({ error: "origin, destination e departureDate são obrigatórios" }, { status: 400 });
    }
    const result = await runSearch(body);
    let searchId: string | null = null;
    try {
      searchId = await saveSearch(body, result, "normal");
    } catch {
      /* persistência é best-effort */
    }
    return NextResponse.json({ ...result, searchId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "erro interno" }, { status: 500 });
  }
}
