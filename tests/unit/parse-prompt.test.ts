import { describe, it, expect } from "vitest";
import { localParsePrompt } from "@/lib/parse-prompt-local";

describe("localParsePrompt", () => {
  it("parses a rental prompt", () => {
    const r = localParsePrompt("Pet-friendly 2-bed rental near transit, in-unit laundry, under $2,800");
    expect(r.criteria.mode).toBe("RENT");
    expect(r.criteria.bedsMin).toBe(2);
    expect(r.criteria.priceMax).toBe(280_000);
    expect(r.criteria.features).toContain("pet-friendly");
    expect(r.criteria.features).toContain("in-unit-laundry");
    expect(r.criteria.features).toContain("transit");
  });

  it("parses a sale prompt with city", () => {
    const r = localParsePrompt("3-bed house under $700k with a garden in walkable Portland");
    expect(r.criteria.mode).toBe("BUY");
    expect(r.criteria.bedsMin).toBe(3);
    expect(r.criteria.priceMax).toBe(70_000_000);
    expect(r.criteria.location.cities).toContain("Portland, OR");
    expect(r.criteria.propertyTypes).toContain("HOUSE");
    expect(r.criteria.features).toContain("garden");
    expect(r.criteria.features).toContain("walkable");
  });
});
