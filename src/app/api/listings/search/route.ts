import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";
import { CriteriaSchema } from "@/lib/criteria";
import { scoreListing } from "@/lib/match";
import type { Listing } from "@/lib/db.types";

export const runtime = "nodejs";

const Body = z.object({ criteria: CriteriaSchema });

// Returns listings filtered by hard constraints (mode, city, status). Scoring
// is computed client-side too; we sort by best match here so empty-state pages
// still show a sensible order.
export async function POST(req: Request) {
  const sb = await supabaseServer();
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const c = parsed.data.criteria;
  const cities = c.location.cities;
  console.log(
    `[search] mode=${c.mode} cities=${cities.join("|")} priceMax=$${(c.priceMax / 100).toFixed(0)} bedsMin=${c.bedsMin}`,
  );

  async function query() {
    const q = sb
      .from("listings")
      .select("*")
      .eq("mode", c.mode)
      .eq("status", "ACTIVE")
      .lte("price", Math.round(c.priceMax * 1.05))
      .order("posted_at", { ascending: false })
      .limit(120);
    if (cities.length) q.in("city", cities);
    return q;
  }

  let { data, error } = await query();
  if (error) {
    console.error("[search] db error", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // If no rows for these cities AND a live provider is configured, kick off a
  // synchronous crawl for just these cities so the user sees results without
  // waiting for the next cron tick.
  const provider = (process.env.LISTING_PROVIDER || "mock").toLowerCase();
  if ((data?.length ?? 0) === 0 && provider !== "mock" && cities.length) {
    console.log(`[search] no rows for cities, triggering on-demand crawl via provider=${provider}`);
    try {
      const { runCrawl } = await import("@/lib/jobs/crawl");
      const r = await runCrawl({ cities });
      console.log(`[search] on-demand crawl: ${JSON.stringify(r)}`);
      ({ data, error } = await query());
      if (error) {
        console.error("[search] db re-query error", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } catch (e) {
      console.error("[search] on-demand crawl failed", e);
    }
  }

  const listings = (data as Listing[]) ?? [];
  const scored = listings
    .map((l) => ({ l, s: scoreListing(l, c).total }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.l);
  console.log(`[search] db rows=${listings.length} scored>0=${scored.length}`);
  return NextResponse.json({ listings: scored });
}
