# Match score

The match algorithm lives in [`src/lib/match.ts`](../src/lib/match.ts) and is **deterministic** — same listing + same criteria + same `now` → same score. No ML, no fuzzing, no surprise rerankings.

## Components (0–100, weights sum to 100)

| Component | Weight | How |
| --- | --- | --- |
| **Price** | 25 | 25 if `listing.price ≤ priceMax`, 0 otherwise. **Hard fail** (score = 0) if listing is more than 5% over budget. |
| **Beds** | 20 | 20 if `listing.beds ≥ bedsMin`; 10 if exactly one short; 0 otherwise. |
| **Baths** | 10 | Same shape as Beds. |
| **Property type** | 10 | 10 if `listing.property_type ∈ propertyTypes`, or `propertyTypes` is empty. |
| **Location** | 15 | 15 for a neighborhood match; 10 for the right city; 0 otherwise. |
| **Features** | 15 | `15 × matched / required`. If no features required, 15. Soft penalty (halved) when `sqftMin` or `maxAgeYears` constraints fail; zeroed when `petFriendly` is on but the listing isn't. |
| **Freshness** | 5 | 5 if posted within the last 24h, decaying linearly to 0 over 14 days. |

`excludeFeatures` triggers a hard fail.

## Threshold

- **Default:** 70 — listings scoring 70+ become alert matches.
- **High-match-only mode** (`user_settings.high_match_only`): threshold raises to 85.

Tweak both constants in `src/lib/match.ts`:

```ts
export const DEFAULT_MATCH_THRESHOLD = 70;
export const HIGH_MATCH_THRESHOLD = 85;
```

## Tuning checklist

When considering a change to the algorithm:

1. Run `npm test` — the existing match tests (`tests/unit/match.test.ts`) lock down the basic shape (perfect match scores ≥ 90, hard-fail when >5% over budget, neighborhood beats city, freshness decays).
2. Sweep over `seed-listings.ts` against representative criteria; sanity-check the top-5 ranking visually.
3. If you raise weights, make sure the maximum still sums to 100 — the badge UI assumes a 0–100 range and shows a "strong match" tint at ≥ 92.
4. Lowering the threshold (e.g. to 65) is the safe knob to broaden delivery; raising it past 85 makes most alerts dormant unless the feed is large.

## Why it's deterministic

The user picks frequency, threshold, and feature priorities. The algorithm executes those choices visibly: any match in the dashboard or email can be explained by the **components** breakdown returned alongside the total. This shows up in the UI as the "Why Scout flagged this" list on `/app/listings/[id]` (top 3 reasons by weight).
