import { describe, it, expect } from "vitest";
import { normalizeFeature, normalizeFeatures } from "@/lib/criteria";

describe("normalizeFeature", () => {
  it("returns canonical for exact tag", () => {
    expect(normalizeFeature("garden")).toBe("garden");
    expect(normalizeFeature("pet-friendly")).toBe("pet-friendly");
  });
  it("normalizes synonyms", () => {
    expect(normalizeFeature("Pet Friendly")).toBe("pet-friendly");
    expect(normalizeFeature("central air")).toBe("ac");
    expect(normalizeFeature("washer")).toBe("in-unit-laundry");
    expect(normalizeFeature("attached garage")).toBe("garage");
  });
  it("returns null for unknown features", () => {
    expect(normalizeFeature("xyzzy")).toBeNull();
  });
  it("normalizeFeatures dedupes", () => {
    const out = normalizeFeatures(["garden", "garden", "Pet Friendly", "pets ok"]);
    expect(out.sort()).toEqual(["garden", "pet-friendly"].sort());
  });
});
