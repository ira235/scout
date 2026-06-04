# Scout

A real-estate listing alerts app. Tell Scout what you're looking for in plain English ("3-bed house under $700k with a garden in a walkable neighborhood") or via structured filters; Scout watches a listings feed and emails you the moment new homes match — instantly, daily, or weekly.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + React 18
- **Tailwind CSS** with CSS-variable themes (5 palettes)
- **Supabase** (Postgres + Auth + RLS + Realtime)
- **Resend** + **react-email** for digest emails
- **Anthropic Claude** for prompt → criteria parsing (with a deterministic local fallback)
- **Vercel Cron** for `crawl-listings` (every 15 min) and `send-digests` (hourly)
- **Vitest** + **Playwright** for tests
- Provider-agnostic listings via the `ListingProvider` interface (`mock` ships seeded; `rentcast` ships ready)

## Pages

| Route | What it does |
| --- | --- |
| `/` | Stub landing |
| `/app/search` | Criteria builder. `?style=toggle` (default), `?style=stacked`, `?style=wizard` |
| `/app/matches` | Results feed: best/price/newest sort, card or list, density toggle |
| `/app/listings/[id]` | Listing detail with "Why Scout flagged this" |
| `/app/alerts` | Saved alerts dashboard with toggle, freq badge, last-sent, digest-preview banner |
| `/app/alerts/[id]/preview` | Server-renders the exact digest email |
| `/app/settings` | Cadence, send time, per-email cap, push toggle, theme picker |

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# fill in Supabase URL/keys, Resend key, Anthropic key, etc.

# 3. Apply DB schema
# Either: copy the SQL into your Supabase SQL editor, or use the Supabase CLI:
supabase db push

# 4. Seed 30 demo listings
npm run seed

# 5. Run
npm run dev               # app on :3000
npm run jobs:dev          # in another tab: crawl + digest tick every 60s
```

### `.env` reference

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM            # e.g. "Scout <alerts@scout.app>"
RESEND_WEBHOOK_SECRET  # optional, for /api/webhooks/email-events
ANTHROPIC_API_KEY      # optional; falls back to a local heuristic parser
LISTING_PROVIDER       # "mock" (default) or "rentcast"
RENTCAST_API_KEY       # required when LISTING_PROVIDER=rentcast
CRON_SECRET            # required header for /api/cron/*
NEXT_PUBLIC_APP_URL    # e.g. http://localhost:3000
UNSUB_SECRET           # signs unsubscribe / pause / freq email links
```

## Tests

```bash
npm test            # vitest unit tests (match scoring, prompt parser, feature normalization)
npm run test:e2e    # Playwright E2E (search→matches, email template render)
```

The two specs required by the spec are:
- `tests/e2e/create-alert-and-see-match.spec.ts`
- `tests/e2e/digest-email-renders.spec.ts`

## Cron / jobs

In production these run via Vercel Cron (see `vercel.json`):
- `*/15 * * * *` → `POST /api/cron/crawl` (with `x-cron-secret`)
- `0 * * * *`   → `POST /api/cron/digest`

In dev: `npm run jobs:dev` ticks both every 60s for fast feedback.

## Provider swap

`ListingProvider` (see `src/lib/listing-provider.ts`) abstracts the data source. Drop in a new adapter (Redfin/Zillow/MLS partner) by implementing `fetchNew` and `fetchById` and selecting it via `LISTING_PROVIDER=mine`.

## Match score

See [`docs/match-score.md`](docs/match-score.md). Threshold: 70 (default), 85 if user has `high_match_only` enabled.

## Theme

Five palettes (Sage & Clay, Cobalt & White, Navy & Sky, Ocean & Sand, Ink Blue & Bone). Picked in Settings; applied via CSS variables to both the app and the next outgoing email.

## Non-goals (per spec)

In-app messaging with agents, real-time price prediction, polygon-drawing UI (the `polygon` field is in the schema, but the drawing tool is deferred), native mobile apps.
