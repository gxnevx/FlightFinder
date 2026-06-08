import { NextResponse } from "next/server";
import { computeSources } from "@/lib/sources/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ sources: computeSources() });
}
