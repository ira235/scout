// Local prompt parser — heuristic fallback when no Anthropic key is configured.
// Returns the same shape as the API: { criteria, confidence, unparsed }.
import type { Criteria } from "./criteria";
import { CANONICAL_FEATURES, normalizeFeatures } from "./criteria";
import type { PropertyType } from "./db.types";

const TYPE_WORDS: Record<string, PropertyType> = {
  house: "HOUSE",
  home: "HOUSE",
  craftsman: "HOUSE",
  bungalow: "HOUSE",
  townhome: "TOWNHOME",
  townhouse: "TOWNHOME",
  condo: "CONDO",
  condominium: "CONDO",
  apartment: "APARTMENT",
  apt: "APARTMENT",
  loft: "APARTMENT",
};

const KNOWN_CITIES = [
  ["portland", "Portland, OR"],
  ["seattle", "Seattle, WA"],
  ["austin", "Austin, TX"],
] as const;

const KNOWN_HOODS = [
  "sellwood", "mt tabor", "mount tabor", "buckman", "division", "woodstock",
  "brooklyn", "hawthorne", "alameda", "lloyd", "richmond",
  "capitol hill", "south lake union", "queen anne", "pioneer square",
  "ballard", "u district", "magnolia", "belltown", "beacon hill", "wedgwood",
  "east cesar chavez", "rainey", "tarrytown", "mueller", "govalle",
  "west end", "allandale", "downtown", "south lamar", "lakeway",
];

function parsePrice(text: string, isRent: boolean): number | null {
  // matches "$700k", "$2,800", "$2.5m", "under 700000"
  const m = text.match(/\$?\s*([\d,.]+)\s*([km])?\b/gi);
  if (!m) return null;
  const candidates = m
    .map((s) => {
      const n = s.match(/([\d,.]+)\s*([km])?/i);
      if (!n) return null;
      const num = parseFloat(n[1].replace(/,/g, ""));
      if (Number.isNaN(num)) return null;
      let value = num;
      if (n[2]?.toLowerCase() === "k") value *= 1_000;
      else if (n[2]?.toLowerCase() === "m") value *= 1_000_000;
      return value;
    })
    .filter((v): v is number => typeof v === "number");
  if (!candidates.length) return null;
  // Heuristic: pick the largest plausible value
  const max = Math.max(...candidates);
  if (isRent) {
    if (max < 200) return null;
    return Math.round(max * 100); // cents
  }
  if (max < 50_000) return null;
  return Math.round(max * 100);
}

export function localParsePrompt(prompt: string): {
  criteria: Criteria;
  confidence: number;
  unparsed: string[];
} {
  const text = prompt || "";
  const s = text.toLowerCase().replace(/-/g, " ");
  const unparsed: string[] = [];

  // mode
  const isRent = /\brent(al)?\b|\blease\b|\bmonth(ly)?\b|\/mo\b|\bpet[- ]friendly\b/.test(s);
  const mode: "BUY" | "RENT" = isRent ? "RENT" : /\bbuy|own|purchase|for sale\b/.test(s) ? "BUY" : "BUY";

  // location
  const cities: string[] = [];
  for (const [needle, full] of KNOWN_CITIES) if (s.includes(needle)) cities.push(full);
  if (cities.length === 0) cities.push("Portland, OR"); // default
  const neighborhoods = KNOWN_HOODS.filter((h) => s.includes(h)).map(
    (h) => h.replace(/\b\w/g, (c) => c.toUpperCase())
  );

  // beds / baths
  const bedM = s.match(/(\d+(?:\.\d+)?)\s*[- ]?\s*(?:bed|bd|br)/);
  const bathM = s.match(/(\d+(?:\.\d+)?)\s*[- ]?\s*(?:bath|ba)/);
  const bedsMin = bedM ? parseFloat(bedM[1]) : 0;
  const bathsMin = bathM ? parseFloat(bathM[1]) : 0;

  // price
  let priceMax = parsePrice(text, isRent);
  if (!priceMax) priceMax = isRent ? 350_000 : 80_000_000; // sensible defaults (cents)

  // property types
  const propertyTypes: PropertyType[] = [];
  for (const [w, t] of Object.entries(TYPE_WORDS)) {
    if (new RegExp(`\\b${w}\\b`).test(s) && !propertyTypes.includes(t)) propertyTypes.push(t);
  }

  // features (canonical via normalizer + simple substring match for canonical tags)
  const features: string[] = [];
  for (const f of CANONICAL_FEATURES) {
    const variants = [f, f.replace(/-/g, " ")];
    if (variants.some((v) => s.includes(v))) features.push(f);
  }
  // Common synonym hints
  const extra = normalizeFeatures(
    [
      "pet friendly", "in unit laundry", "central air", "near transit",
      "yard", "patio", "porch",
    ].filter((k) => s.includes(k))
  );
  for (const e of extra) if (!features.includes(e)) features.push(e);

  // pet-friendly fast path
  const petFriendly = /pet[- ]friendly|pets?\s+(ok|allowed)|dog|cat/.test(s) || features.includes("pet-friendly");

  // Build "unparsed" list: words/phrases not mapped
  const matched = new Set<string>();
  [...cities, ...neighborhoods, ...features, ...propertyTypes].forEach((m) =>
    m.toLowerCase().split(/\s+/).forEach((w) => matched.add(w))
  );
  if (bedM) matched.add(bedM[0]);
  if (bathM) matched.add(bathM[0]);
  for (const w of s.split(/[^a-z0-9$]+/).filter(Boolean)) {
    if (w.length < 4) continue;
    if (matched.has(w)) continue;
    if (/^(under|with|the|and|for|in|near|close|less|than|max|budget|home|search|rental|rent|buy|new)$/.test(w)) continue;
    if (/\d/.test(w)) continue;
    if (!unparsed.includes(w)) unparsed.push(w);
  }

  const confidence = Math.min(
    1,
    0.35 +
      (cities.length ? 0.2 : 0) +
      (bedsMin ? 0.15 : 0) +
      (priceMax ? 0.15 : 0) +
      (features.length ? 0.1 : 0) +
      (propertyTypes.length ? 0.05 : 0)
  );

  const criteria: Criteria = {
    mode,
    location: { cities, neighborhoods, polygon: undefined },
    priceMax,
    priceMin: 0,
    bedsMin,
    bathsMin,
    sqftMin: undefined,
    propertyTypes,
    features,
    excludeFeatures: [],
    maxAgeYears: undefined,
    petFriendly: isRent ? petFriendly : undefined,
  };

  return { criteria, confidence, unparsed };
}
