import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const alertId = url.searchParams.get("alertId");
  if (!alertId) return NextResponse.json({ error: "alertId required" }, { status: 400 });
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("alert_matches")
    .select("id, match_score, notified_at, created_at, listings:listing_id(*)")
    .eq("alert_id", alertId)
    .order("match_score", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ matches: data });
}
