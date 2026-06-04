import type { Listing } from "./db.types";
import type { Criteria } from "./criteria";

export interface MatchBreakdown {
  total: number;
  components: {
    price: number;
    beds: number;
    baths: number;
    propertyType: number;
    location: number;
    features: number;
    freshness: number;
  };
  hardFail: boolean;
  reasons: string[]; // human-readable; top reasons listed first
}

const isCityMatch = (listingCity: string, criteriaCities: string[]) =>
  criteriaCities.some(
    (c) => c.toLowerCase().split(",")[0].trim() === listingCity.toLowerCase().split(",")[0].trim()
  );

export function scoreListing(listing: Listing, c: Criteria, now = new Date()): MatchBreakdown {
  const reasons: string[] = [];

  // Price (25): hard fail if over budget by >5%
  let price = 0;
  let hardFail = false;
  if (listing.price <= c.priceMax) {
    price = 25;
    reasons.push("Price within budget");
  } else if (listing.price > Math.round(c.priceMax * 1.05)) {
    hardFail = true;
  } else {
    price = 0;
  }

  // Beds (20): full / one short / else 0
  let beds = 0;
  if (listing.beds >= c.bedsMin) {
    beds = 20;
    if (c.bedsMin > 0) reasons.push(`${listing.beds}+ beds (you wanted ${c.bedsMin}+)`);
  } else if (listing.beds >= c.bedsMin - 1) {
    beds = 10;
  }

  // Baths (10): same shape
  let baths = 0;
  if (listing.baths >= c.bathsMin) baths = 10;
  else if (listing.baths >= c.bathsMin - 1) baths = 5;

  // Property type (10)
  let propertyType = 0;
  if (c.propertyTypes.length === 0 || c.propertyTypes.includes(listing.property_type as never)) {
    propertyType = 10;
    if (c.propertyTypes.length > 0) reasons.push(`Property type: ${listing.property_type.toLowerCase()}`);
  }

  // Location (15): neighborhood > city
  let location = 0;
  const hood = (listing.hood || "").toLowerCase();
  const wantHoods = c.location.neighborhoods.map((n) => n.toLowerCase());
  if (wantHoods.length > 0 && wantHoods.some((n) => hood.includes(n) || n.includes(hood))) {
    location = 15;
    reasons.push(`In ${listing.hood}`);
  } else if (isCityMatch(listing.city, c.location.cities)) {
    location = 10;
    reasons.push(`In ${listing.city}`);
  }

  // Features (15): matched/required
  const required = c.features ?? [];
  let features = 0;
  if (required.length === 0) {
    features = 15;
  } else {
    const have = new Set(listing.features);
    const matched = required.filter((f) => have.has(f));
    features = Math.round((15 * matched.length) / required.length);
    if (matched.length > 0) reasons.push(`Matches: ${matched.slice(0, 3).join(", ")}`);
  }

  // Excluded features → hard fail
  if (c.excludeFeatures?.some((f) => listing.features.includes(f))) {
    hardFail = true;
  }

  // Freshness (5): 5 if posted in last 24h, decay to 0 over 14d.
  const ageMs = now.getTime() - new Date(listing.posted_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  let freshness = 0;
  if (ageDays <= 1) freshness = 5;
  else if (ageDays >= 14) freshness = 0;
  else freshness = Math.round(5 * (1 - (ageDays - 1) / 13));

  if (ageDays <= 1) reasons.push("Posted in the last 24h");

  // Pet-friendly fast-path (rent only)
  if (c.mode === "RENT" && c.petFriendly && !listing.features.includes("pet-friendly")) {
    // soft penalty: zero out features contribution
    features = 0;
  }

  // sqftMin / maxAgeYears soft checks
  if (typeof c.sqftMin === "number" && (listing.sqft ?? 0) < c.sqftMin) {
    // moderate penalty: half features
    features = Math.round(features / 2);
  }
  if (typeof c.maxAgeYears === "number" && listing.year_built) {
    const yearsOld = now.getUTCFullYear() - listing.year_built;
    if (yearsOld > c.maxAgeYears) {
      features = Math.round(features / 2);
    }
  }

  const total = hardFail
    ? 0
    : Math.round(price + beds + baths + propertyType + location + features + freshness);

  return {
    total,
    components: { price, beds, baths, propertyType, location, features, freshness },
    hardFail,
    reasons,
  };
}

// Threshold (spec §7): 70 default; 85 if highMatchOnly
export const DEFAULT_MATCH_THRESHOLD = 70;
export const HIGH_MATCH_THRESHOLD = 85;

export function isMatch(score: number, highMatchOnly = false): boolean {
  return score >= (highMatchOnly ? HIGH_MATCH_THRESHOLD : DEFAULT_MATCH_THRESHOLD);
}
