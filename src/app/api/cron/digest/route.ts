import { NextResponse } from "next/server";
import { runDigestTick } from "@/lib/jobs/digest";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const r = await runDigestTick();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error("[cron/digest]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
export const GET = POST;
