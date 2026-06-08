import { NextResponse } from "next/server";
import { computeSources } from "@/lib/sources/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sources = computeSources();
  return NextResponse.json({
    status: "ok",
    service: "flightfinder-web",
    time: new Date().toISOString(),
    sourcesActive: sources.filter((s) => s.state === "ativa").length,
    sourcesTotal: sources.length,
  });
}
