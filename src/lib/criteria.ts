import { z } from "zod";

export const PROPERTY_TYPES = ["HOUSE", "TOWNHOME", "CONDO", "APARTMENT"] as const;
export const DIGEST_FREQS = ["INSTANT", "DAILY", "WEEKLY"] as const;

// Canonical, lowercase + kebab-case feature vocabulary (spec §7).
export const CANONICAL_FEATURES = [
  "garden",
  "garage",
  "in-unit-laundry",
  "pet-friendly",
  "fireplace",
  "balcony",
  "new-build",
  "walkable",
  "transit",
  "parking",
  "dishwasher",
  "ac",
  "fenced-yard",
  "basement",
  "rooftop",
  "doorman",
  "elevator",
  "pool",
  "ev-charger",
] as const;

export type CanonicalFeature = (typeof CANONICAL_FEATURES)[number];

const FEATURE_SYNONYMS: Record<string, CanonicalFeature> = {
  yard: "fenced-yard",
  "back yard": "fenced-yard",
  "backyard": "fenced-yard",
  "fenced backyard": "fenced-yard",
  "in unit laundry": "in-unit-laundry",
  "in-unit washer": "in-unit-laundry",
  washer: "in-unit-laundry",
  dryer: "in-unit-laundry",
  laundry: "in-unit-laundry",
  pets: "pet-friendly",
  "pet ok": "pet-friendly",
  "pets ok": "pet-friendly",
  "pet friendly": "pet-friendly",
  "dogs ok": "pet-friendly",
  "cats ok": "pet-friendly",
  "central air": "ac",
  "air conditioning": "ac",
  hvac: "ac",
  "new construction": "new-build",
  "newly built": "new-build",
  "near transit": "transit",
  bus: "transit",
  subway: "transit",
  metro: "transit",
  "covered parking": "parking",
  carport: "parking",
  "rooftop deck": "rooftop",
  "roof deck": "rooftop",
  "ev charger": "ev-charger",
  "charging station": "ev-charger",
  charger: "ev-charger",
  "swimming pool": "pool",
  "deck": "balcony",
  patio: "balcony",
  porch: "balcony",
  "wood stove": "fireplace",
  hearth: "fireplace",
  "1-car garage": "garage",
  "2-car garage": "garage",
  "attached garage": "garage",
  "detached garage": "garage",
  "raised beds": "garden",
  "garden beds": "garden",
};

export function normalizeFeature(raw: string): CanonicalFeature | null {
  const t = raw
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .replace(/[^a-z0-9 -]/g, "");
  // exact canonical match
  if ((CANONICAL_FEATURES as readonly string[]).includes(t)) return t as CanonicalFeature;
  // hyphen→space
  const hy = t.replace(/-/g, " ");
  if ((CANONICAL_FEATURES as readonly string[]).includes(hy.replace(/ /g, "-"))) {
    return hy.replace(/ /g, "-") as CanonicalFeature;
  }
  // synonym table
  if (FEATURE_SYNONYMS[t]) return FEATURE_SYNONYMS[t];
  if (FEATURE_SYNONYMS[hy]) return FEATURE_SYNONYMS[hy];
  // last attempt: token stem match
  for (const [k, v] of Object.entries(FEATURE_SYNONYMS)) if (t.includes(k)) return v;
  for (const f of CANONICAL_FEATURES) if (t.includes(f) || t.includes(f.replace(/-/g, " "))) return f;
  return null;
}

export function normalizeFeatures(list: readonly string[]): CanonicalFeature[] {
  const out = new Set<CanonicalFeature>();
  for (const r of list) {
    const c = normalizeFeature(r);
    if (c) out.add(c);
  }
  return Array.from(out);
}

export const CriteriaSchema = z.object({
  mode: z.enum(["BUY", "RENT"]),
  location: z.object({
    cities: z.array(z.string()).min(1),
    neighborhoods: z.array(z.string()).default([]),
    polygon: z.array(z.tuple([z.number(), z.number()])).optional(),
  }),
  priceMax: z.number().int().positive(),
  priceMin: z.number().int().nonnegative().default(0),
  bedsMin: z.number().min(0).default(0),
  bathsMin: z.number().min(0).default(0),
  sqftMin: z.number().int().optional(),
  propertyTypes: z.array(z.enum(PROPERTY_TYPES)).default([]),
  features: z.array(z.string()).default([]),
  excludeFeatures: z.array(z.string()).default([]),
  maxAgeYears: z.number().int().optional(),
  petFriendly: z.boolean().optional(),
});

export type Criteria = z.infer<typeof CriteriaSchema>;

// API: parse-prompt response shape
export const ParsePromptResponseSchema = z.object({
  criteria: CriteriaSchema,
  confidence: z.number().min(0).max(1),
  unparsed: z.array(z.string()),
});
export type ParsePromptResponse = z.infer<typeof ParsePromptResponseSchema>;
