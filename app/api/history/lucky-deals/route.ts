import { NextResponse } from "next/server";
import { listLuckyDeals } from "@/lib/persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ deals: await listLuckyDeals(25) });
}
