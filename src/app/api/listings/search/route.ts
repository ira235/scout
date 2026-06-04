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
  const q = sb
    .from("listings")
    .select("*")
    .eq("mode", c.mode)
    .eq("status", "ACTIVE")
    .lte("price", Math.round(c.priceMax * 1.05))
    .order("posted_at", { ascending: false })
    .limit(120);
  if (cities.length) q.in("city", cities);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const listings = (data as Listing[]) ?? [];
  const scored = listings
    .map((l) => ({ l, s: scoreListing(l, c).total }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.l);
  return NextResponse.json({ listings: scored });
}
