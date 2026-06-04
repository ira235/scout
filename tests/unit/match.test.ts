import { describe, it, expect } from "vitest";
import { scoreListing, isMatch, DEFAULT_MATCH_THRESHOLD, HIGH_MATCH_THRESHOLD } from "@/lib/match";
import type { Listing } from "@/lib/db.types";
import type { Criteria } from "@/lib/criteria";

const NOW = new Date("2025-01-15T12:00:00Z");

const baseListing: Listing = {
  id: "t:1",
  source: "test",
  mode: "RENT",
  status: "ACTIVE",
  price: 270_000, // $2,700/mo in cents
  address: "100 Test St",
  hood: "Buckman",
  city: "Portland, OR",
  state: "OR",
  zip: "97214",
  lat: 45.5,
  lng: -122.6,
  beds: 2,
  baths: 1,
  sqft: 900,
  lot_sqft: null,
  year_built: 2020,
  property_type: "APARTMENT",
  features: ["pet-friendly", "in-unit-laundry", "transit"],
  description: null,
  photos: [],
  posted_at: new Date(NOW.getTime() - 12 * 3600 * 1000).toISOString(), // 12h old
  fetched_at: NOW.toISOString(),
};

const baseCriteria: Criteria = {
  mode: "RENT",
  location: { cities: ["Portland, OR"], neighborhoods: ["Buckman"] },
  priceMax: 280_000,
  priceMin: 0,
  bedsMin: 2,
  bathsMin: 1,
  propertyTypes: ["APARTMENT"],
  features: ["pet-friendly", "in-unit-laundry"],
  excludeFeatures: [],
  petFriendly: true,
};

describe("scoreListing", () => {
  it("scores a near-perfect match above 90", () => {
    const r = scoreListing(baseListing, baseCriteria, NOW);
    expect(r.total).toBeGreaterThanOrEqual(90);
    expect(r.hardFail).toBe(false);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("hard-fails when price exceeds budget by >5%", () => {
    const l = { ...baseListing, price: Math.round(baseCriteria.priceMax * 1.10) };
    const r = scoreListing(l, baseCriteria, NOW);
    expect(r.hardFail).toBe(true);
    expect(r.total).toBe(0);
  });

  it("does not hard-fail at 5% over (but loses price weight)", () => {
    const l = { ...baseListing, price: Math.round(baseCriteria.priceMax * 1.04) };
    const r = scoreListing(l, baseCriteria, NOW);
    expect(r.hardFail).toBe(false);
    expect(r.components.price).toBe(0);
  });

  it("rewards neighborhood match more than city-only", () => {
    const hoodMatch = scoreListing(baseListing, baseCriteria, NOW);
    const cityOnly = scoreListing(
      { ...baseListing, hood: "Some Other Hood" },
      baseCriteria,
      NOW
    );
    expect(hoodMatch.components.location).toBe(15);
    expect(cityOnly.components.location).toBe(10);
  });

  it("partial bed credit when one short", () => {
    const r = scoreListing({ ...baseListing, beds: 1 }, baseCriteria, NOW);
    expect(r.components.beds).toBe(10);
  });

  it("zero bed credit when more than one short", () => {
    const r = scoreListing({ ...baseListing, beds: 0 }, baseCriteria, NOW);
    expect(r.components.beds).toBe(0);
  });

  it("freshness decays over time", () => {
    const fresh = scoreListing(baseListing, baseCriteria, NOW);
    const old = scoreListing(
      { ...baseListing, posted_at: new Date(NOW.getTime() - 30 * 24 * 3600 * 1000).toISOString() },
      baseCriteria,
      NOW
    );
    expect(fresh.components.freshness).toBe(5);
    expect(old.components.freshness).toBe(0);
  });

  it("isMatch threshold defaults to 70 and rises with high-match-only", () => {
    expect(isMatch(70)).toBe(true);
    expect(isMatch(69)).toBe(false);
    expect(isMatch(80, true)).toBe(false);
    expect(isMatch(85, true)).toBe(true);
    expect(DEFAULT_MATCH_THRESHOLD).toBe(70);
    expect(HIGH_MATCH_THRESHOLD).toBe(85);
  });

  it("excludeFeatures triggers a hard fail", () => {
    const c = { ...baseCriteria, excludeFeatures: ["pet-friendly"] };
    const r = scoreListing(baseListing, c, NOW);
    expect(r.hardFail).toBe(true);
  });
});
