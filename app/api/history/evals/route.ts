import { NextResponse } from "next/server";
import { listEvals } from "@/lib/persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ evals: await listEvals(25) });
}
