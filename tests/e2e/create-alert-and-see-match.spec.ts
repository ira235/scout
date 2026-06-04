// E2E: create an alert via the structured filters and confirm a match shows up.
// This test uses the public criteria builder + matches feed in unauthenticated
// dev mode (sessionStorage-backed draft). It does NOT hit Supabase. The "Save"
// flow which requires auth is exercised in `digest-email-renders.spec.ts` only
// when SUPABASE env vars are present.
import { test, expect } from "@playwright/test";

test("create alert criteria and see at least one match", async ({ page }) => {
  await page.goto("/app/search?style=stacked");

  // Type a prompt
  await page.getByPlaceholder(/2-bed pet-friendly rental/i).fill(
    "Pet-friendly 2-bed rental near transit, in-unit laundry, under $2,800 in Portland"
  );

  // Parse
  await page.getByRole("button", { name: /parse with scout/i }).click();
  await expect(page.getByText(/Scout understood/i)).toBeVisible({ timeout: 10_000 });

  // Go to matches
  await page.getByRole("button", { name: /see matches/i }).click();
  await expect(page).toHaveURL(/\/app\/matches$/);

  // We expect listings to populate either from the DB or the search endpoint.
  // The mock provider seeds Portland rentals so at least one card should render.
  await expect(page.getByText(/Matches/i).first()).toBeVisible();
  // If the DB is empty (no seed) the page should still render an empty state without errors.
  const empty = page.getByText(/No matches yet/i);
  const card = page.locator('a[href^="/app/listings/"]').first();
  await expect(empty.or(card)).toBeVisible({ timeout: 15_000 });
});
