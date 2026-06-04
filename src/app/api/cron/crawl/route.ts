import { NextResponse } from "next/server";
import { runCrawl } from "@/lib/jobs/crawl";

export const runtime = "nodejs";
export const maxDuration = 60;

// Auth is enforced by middleware (x-cron-secret header).
export async function POST() {
  try {
    const result = await runCrawl();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/crawl]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// Vercel Cron uses GET by default
export const GET = POST;
