// Anthropic-backed prompt parser. Falls back to a local heuristic parser when
// ANTHROPIC_API_KEY is unset or the call fails.
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { CriteriaSchema, type Criteria } from "./criteria";
import { localParsePrompt } from "./parse-prompt-local";

interface ParseResult {
  criteria: Criteria;
  confidence: number;
  unparsed: string[];
  source: "anthropic" | "local" | "cache";
}

// In-process cache (24h). For multi-instance: swap for Redis or DB.
const CACHE = new Map<string, { value: ParseResult; expires: number }>();
const TTL_MS = 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You convert real-estate search prompts into a strict JSON object matching this TypeScript shape:

type Criteria = {
  mode: "BUY" | "RENT";
  location: { cities: string[]; neighborhoods: string[]; polygon?: [number, number][] };
  priceMax: number;        // cents (USD)
  priceMin?: number;       // cents (USD), default 0
  bedsMin?: number;        // default 0
  bathsMin?: number;       // default 0
  sqftMin?: number;
  propertyTypes?: ("HOUSE"|"TOWNHOME"|"CONDO"|"APARTMENT")[];
  features?: string[];     // canonical kebab-case from this fixed list ONLY:
                           // garden, garage, in-unit-laundry, pet-friendly, fireplace,
                           // balcony, new-build, walkable, transit, parking, dishwasher,
                           // ac, fenced-yard, basement, rooftop, doorman, elevator, pool, ev-charger
  excludeFeatures?: string[];
  maxAgeYears?: number;
  petFriendly?: boolean;
};

Return ONLY the JSON object plus a top-level "_unparsed" string array of any tokens you couldn't map and a "_confidence" number between 0 and 1. Do not return prose. Cities should include the state, e.g. "Portland, OR". Convert prices to cents (e.g. $700k → 70000000; $2,800/mo → 280000).`;

const FEW_SHOT: { user: string; assistant: string }[] = [
  {
    user: "3-bed house under $700k with a garden in a walkable neighborhood",
    assistant: JSON.stringify({
      mode: "BUY",
      location: { cities: ["Portland, OR"], neighborhoods: [] },
      priceMax: 70000000, priceMin: 0, bedsMin: 3, bathsMin: 0,
      propertyTypes: ["HOUSE"], features: ["garden", "walkable"], excludeFeatures: [],
      _unparsed: [], _confidence: 0.92,
    }),
  },
  {
    user: "Pet-friendly 2-bed rental near transit, in-unit laundry, under $2,800",
    assistant: JSON.stringify({
      mode: "RENT",
      location: { cities: ["Portland, OR"], neighborhoods: [] },
      priceMax: 280000, priceMin: 0, bedsMin: 2, bathsMin: 0,
      propertyTypes: [], features: ["pet-friendly", "transit", "in-unit-laundry"], excludeFeatures: [],
      petFriendly: true, _unparsed: [], _confidence: 0.95,
    }),
  },
  {
    user: "Move-in ready place close to a park, quiet street, garage, max $850,000 in Capitol Hill, Seattle",
    assistant: JSON.stringify({
      mode: "BUY",
      location: { cities: ["Seattle, WA"], neighborhoods: ["Capitol Hill"] },
      priceMax: 85000000, priceMin: 0, bedsMin: 0, bathsMin: 0,
      propertyTypes: [], features: ["garage"], excludeFeatures: [],
      _unparsed: ["move-in", "park", "quiet"], _confidence: 0.78,
    }),
  },
];

// Canonicalize known city aliases so the result matches what the crawler
// stores (e.g. all NYC boroughs collapse to "New York, NY").
const CITY_ALIASES: Record<string, string> = {
  "manhattan, ny": "New York, NY",
  "brooklyn, ny": "New York, NY",
  "queens, ny": "New York, NY",
  "bronx, ny": "New York, NY",
  "staten island, ny": "New York, NY",
  "nyc, ny": "New York, NY",
  "new york": "New York, NY",
  "new york city, ny": "New York, NY",
};

function canonicalizeCriteria(c: Criteria): Criteria {
  const cities = Array.from(
    new Set(c.location.cities.map((city) => CITY_ALIASES[city.toLowerCase().trim()] ?? city)),
  );
  return { ...c, location: { ...c.location, cities } };
}

function hashKey(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function parsePromptLLM(prompt: string): Promise<ParseResult> {
  const trimmed = prompt.trim();
  const key = hashKey(trimmed);
  const hit = CACHE.get(key);
  if (hit && hit.expires > Date.now()) {
    return { ...hit.value, source: "cache" };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const local = localParsePrompt(trimmed);
    const result: ParseResult = { ...local, criteria: canonicalizeCriteria(local.criteria), source: "local" };
    CACHE.set(key, { value: result, expires: Date.now() + TTL_MS });
    return result;
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const messages: Anthropic.MessageParam[] = [];
    for (const ex of FEW_SHOT) {
      messages.push({ role: "user", content: ex.user });
      messages.push({ role: "assistant", content: ex.assistant });
    }
    messages.push({ role: "user", content: trimmed });

    const resp = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages,
    });
    const block = resp.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") throw new Error("no text in response");
    const raw = block.text.trim();
    // tolerate ```json fences
    const json = raw.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
    const parsed = JSON.parse(json);
    const { _unparsed, _confidence, ...criteriaInput } = parsed;
    const criteria = canonicalizeCriteria(CriteriaSchema.parse(criteriaInput));
    const result: ParseResult = {
      criteria,
      confidence: typeof _confidence === "number" ? _confidence : 0.7,
      unparsed: Array.isArray(_unparsed) ? _unparsed.map(String) : [],
      source: "anthropic",
    };
    CACHE.set(key, { value: result, expires: Date.now() + TTL_MS });
    return result;
  } catch (err) {
    console.error("[parse-prompt] anthropic failed, falling back:", err);
    const local = localParsePrompt(trimmed);
    const result: ParseResult = { ...local, criteria: canonicalizeCriteria(local.criteria), source: "local" };
    CACHE.set(key, { value: result, expires: Date.now() + TTL_MS });
    return result;
  }
}
