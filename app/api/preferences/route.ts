import { NextResponse } from "next/server";
import { getPreferences, savePreferences } from "@/lib/persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ preferences: await getPreferences() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const saved = await savePreferences(body);
    return NextResponse.json({ preferences: saved });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "erro" }, { status: 500 });
  }
}
