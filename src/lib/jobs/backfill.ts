// Backfill: when a user saves a new alert, score it against existing listings
// in matching cities and insert pending alert_matches so it has data right away.
import { supabaseService } from "../supabase";
import { CriteriaSchema } from "../criteria";
import { scoreListing, isMatch } from "../match";
import type { Listing } from "../db.types";

export async function backfillAlertMatches(alertId: string) {
  const sb = supabaseService();
  const { data: alert } = await sb.from("alerts").select("*").eq("id", alertId).single();
  if (!alert) return;
  const parsed = CriteriaSchema.safeParse(alert.criteria);
  if (!parsed.success) return;
  const c = parsed.data;
  const { data: settings } = await sb
    .from("user_settings")
    .select("high_match_only")
    .eq("user_id", alert.user_id)
    .maybeSingle();
  const high = settings?.high_match_only ?? false;
  const cityKeys = c.location.cities.map((cc) => cc.split(",")[0].trim());

  const { data: listings } = await sb
    .from("listings")
    .select("*")
    .eq("mode", c.mode)
    .in(
      "city",
      // exact city forms used in seed data
      c.location.cities.length ? c.location.cities : cityKeys
    )
    .limit(500);

  const rows: { alert_id: string; listing_id: string; match_score: number }[] = [];
  for (const l of (listings as Listing[]) ?? []) {
    const score = scoreListing(l, c).total;
    if (isMatch(score, high)) {
      rows.push({ alert_id: alert.id, listing_id: l.id, match_score: score });
    }
  }
  if (rows.length) {
    await sb.from("alert_matches").upsert(rows, { onConflict: "alert_id,listing_id", ignoreDuplicates: true });
  }
  return rows.length;
}
