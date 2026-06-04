// E2E: render the digest email template directly (unit-style, no auth needed).
// We import `renderDigestEmail` and check the HTML contains the right markers.
// Playwright is used here as the test runner so we share `npm run test:e2e`.
import { test, expect } from "@playwright/test";

test("digest email template renders with brand header + listings", async () => {
  const { renderDigestEmail } = await import("../../src/lib/email");
  const sample = {
    alert: { id: "a1", name: "Walkable 2-bed rental", frequency: "DAILY" as const },
    user: { id: "u1", email: "test@example.com", name: "Test User" },
    matches: [
      {
        matchId: "m1",
        score: 96,
        listing: {
          id: "mock:pdx-003", source: "mock", mode: "RENT" as const, status: "ACTIVE" as const,
          price: 265000, address: "410 Belmont St #3B", hood: "Buckman",
          city: "Portland, OR", state: "OR", zip: "97214", lat: 45.5, lng: -122.6,
          beds: 2, baths: 1, sqft: 940, lot_sqft: null, year_built: 2019,
          property_type: "APARTMENT" as const,
          features: ["in-unit-laundry", "pet-friendly", "balcony"],
          description: "Corner two-bed with balcony.",
          photos: [],
          posted_at: new Date().toISOString(),
          fetched_at: new Date().toISOString(),
        },
      },
    ],
    theme: "sage" as const,
    perEmailCap: 10,
  };
  const { html, text } = await renderDigestEmail(sample);
  expect(html).toContain("Scout");
  expect(html).toContain("Walkable 2-bed rental");
  expect(html).toContain("96% match");
  expect(html).toContain("410 Belmont");
  expect(html).toContain("View listing");
  expect(text).toContain("$2,650/mo — 410 Belmont");
  expect(text).toContain("96%");
});
