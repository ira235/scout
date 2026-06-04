// Crawl-listings job (spec §6, §8).
import { supabaseService } from "../supabase";
import { getListingProvider, type RawListing } from "../listing-provider";
import { normalizeFeatures, CriteriaSchema, type Criteria } from "../criteria";
import { scoreListing, isMatch } from "../match";
import type { Listing } from "../db.types";

function rawToInsert(r: RawListing) {
  return {
    id: r.id,
    source: r.source,
    mode: r.mode,
    status: r.status ?? "ACTIVE",
    price: r.price,
    address: r.address,
    hood: r.hood ?? null,
    city: r.city,
    state: r.state,
    zip: r.zip ?? null,
    lat: r.lat,
    lng: r.lng,
    beds: r.beds,
    baths: r.baths,
    sqft: r.sqft ?? null,
    lot_sqft: r.lotSqft ?? null,
    year_built: r.yearBuilt ?? null,
    property_type: r.propertyType,
    features: normalizeFeatures(r.features),
    description: r.description ?? null,
    photos: r.photos ?? [],
    posted_at: r.postedAt,
    fetched_at: new Date().toISOString(),
  };
}

export async function runCrawl(opts: { sinceMs?: number; cities?: string[] } = {}) {
  const sb = supabaseService();
  const provider = getListingProvider();
  console.log(`[crawl] starting, provider=${provider.key}`);

  let cities = new Set<string>();
  if (opts.cities?.length) {
    opts.cities.forEach((c) => cities.add(c));
  } else {
    const { data: alerts0, error: a0Err } = await sb
      .from("alerts")
      .select("id, criteria")
      .eq("active", true);
    if (a0Err) console.error("[crawl] alerts query failed", a0Err);
    for (const a of alerts0 ?? []) {
      const parsed = CriteriaSchema.safeParse(a.criteria);
      if (parsed.success) for (const c of parsed.data.location.cities) cities.add(c);
    }
    if (cities.size === 0) {
      ["Portland, OR", "Seattle, WA", "Austin, TX", "New York, NY"].forEach((c) => cities.add(c));
    }
  }
  console.log(`[crawl] cities=${Array.from(cities).join(" | ")}`);

  const { data: alerts, error: aErr } = await sb
    .from("alerts")
    .select("id, user_id, criteria, mode, frequency, active")
    .eq("active", true);
  if (aErr) throw aErr;

  const { data: latest } = await sb
    .from("listings")
    .select("fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1);
  const since =
    opts.sinceMs !== undefined
      ? new Date(opts.sinceMs)
      : latest?.[0]?.fetched_at
      ? new Date(new Date(latest[0].fetched_at).getTime() - 60 * 60 * 1000)
      : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  console.log(`[crawl] fetching since ${since.toISOString()}`);

  const fresh = await provider.fetchNew({ since, cities: Array.from(cities) });
  console.log(`[crawl] provider returned ${fresh.length} listings`);
  if (!fresh.length) return { fetched: 0, upserted: 0, matched: 0 };

  const ids = fresh.map((l) => l.id);
  const { data: existing } = await sb.from("listings").select("id").in("id", ids);
  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const newOnes = fresh.filter((l) => !existingIds.has(l.id));
  console.log(`[crawl] new=${newOnes.length} updates=${fresh.length - newOnes.length}`);

  const inserts = fresh.map(rawToInsert);
  const { error: upErr } = await sb.from("listings").upsert(inserts);
  if (upErr) {
    console.error("[crawl] upsert failed", upErr);
    throw upErr;
  }

  if (!newOnes.length) return { fetched: fresh.length, upserted: fresh.length, matched: 0 };

  const settingsMap = new Map<string, { high_match_only: boolean }>();
  const userIds = Array.from(new Set((alerts ?? []).map((a) => a.user_id)));
  if (userIds.length) {
    const { data: settings } = await sb
      .from("user_settings")
      .select("user_id, high_match_only")
      .in("user_id", userIds);
    for (const s of settings ?? []) settingsMap.set(s.user_id, { high_match_only: s.high_match_only });
  }

  const matchRows: { alert_id: string; listing_id: string; match_score: number }[] = [];
  for (const a of alerts ?? []) {
    const parsed = CriteriaSchema.safeParse(a.criteria);
    if (!parsed.success) continue;
    const c: Criteria = parsed.data;
    const settings = settingsMap.get(a.user_id);
    const high = settings?.high_match_only ?? false;
    for (const raw of newOnes) {
      if (raw.mode !== c.mode) continue;
      if (
        !c.location.cities.some(
          (cc) => cc.toLowerCase().split(",")[0].trim() === raw.city.toLowerCase().split(",")[0].trim()
        )
      ) continue;
      const listing = rawToInsert(raw) as unknown as Listing;
      const score = scoreListing(listing, c).total;
      if (isMatch(score, high)) {
        matchRows.push({ alert_id: a.id, listing_id: raw.id, match_score: score });
      }
    }
  }

  if (matchRows.length) {
    const { error: mErr } = await sb
      .from("alert_matches")
      .upsert(matchRows, { onConflict: "alert_id,listing_id", ignoreDuplicates: true });
    if (mErr) throw mErr;
  }

  // INSTANT cadence → email immediately (rate-limited to 1/15min/alert)
  const instantAlertIds = new Set<string>();
  for (const m of matchRows) {
    const a = (alerts ?? []).find((x) => x.id === m.alert_id);
    if (a?.frequency === "INSTANT") instantAlertIds.add(a.id);
  }
  if (instantAlertIds.size) {
    const { sendInstantDigests } = await import("./digest");
    await sendInstantDigests(Array.from(instantAlertIds));
  }

  console.log(`[crawl] done fetched=${fresh.length} matched=${matchRows.length}`);
  return { fetched: fresh.length, upserted: fresh.length, matched: matchRows.length };
}
