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

### Connecting a Supabase Cloud project (detailed)

1. Create a project at https://supabase.com/dashboard → copy the project ref (e.g. `amagmbdtkcopvhtlmwns`).
2. **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` (the `https://<ref>.supabase.co` form — *not* the dashboard URL)
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (server only — never ship to browser)
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`
4. Apply the migration. The fastest route is the **SQL editor**:
   - Open `https://supabase.com/dashboard/project/<ref>/sql/new`
   - Paste the contents of `supabase/migrations/0001_init.sql`
   - Click **Run**
   - Alternatively use the CLI: `supabase login && supabase link --project-ref <ref> && supabase db push`. If you hit a `tls error / i/o timeout` connecting to port `5432`, your network blocks direct DB connections — use the SQL editor instead, or pass the Supavisor pooler URL (port `6543`) via `supabase db push --db-url '<pooler-uri>'`.
5. Seed listings: `npm run seed` (uses the service role key to bypass RLS).
6. Sign in via magic link at `http://localhost:3000/auth/sign-in` — the email will be sent by Supabase Auth to whatever address you submit.

### Running without Supabase (offline demo)

The mock provider + local prompt parser work without any keys. Only the landing page, `/app/search`, and the draft `/app/matches` view function — anything that needs auth or persistence will error. Set `LISTING_PROVIDER=mock` and any non-empty placeholder values for the Supabase keys.

### `.env` reference

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM            # e.g. "Scout <alerts@scout.app>"
RESEND_WEBHOOK_SECRET  # optional, for /api/webhooks/email-events
ANTHROPIC_API_KEY      # optional; falls back to a local heuristic parser
LISTING_PROVIDER       # "mock" (default), "rentcast", or "rapidapi"
RENTCAST_API_KEY       # required when LISTING_PROVIDER=rentcast
RAPIDAPI_KEY           # required when LISTING_PROVIDER=rapidapi
RAPIDAPI_HOST          # defaults to us-real-estate-listings.p.rapidapi.com
RAPIDAPI_LIMIT         # per-city page size (default 25)
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

`ListingProvider` (see `src/lib/listing-provider.ts`) abstracts the data source. Three adapters ship today:

- `mock` (default) — 30 in-memory seed listings across Portland, Seattle, Austin.
- `rentcast` — calls `api.rentcast.io` (`/listings/sale`, `/listings/rental`).
- `rapidapi` — calls the **US Real Estate Listings** API on RapidAPI (`/for-sale`, `/for-rent`, `/propertyDetails`).

Drop in a new adapter (Redfin/Zillow/MLS partner) by implementing `fetchNew` and `fetchById` and registering it in `getListingProvider()`.

### Using the RapidAPI provider

```bash
# .env.local
LISTING_PROVIDER=rapidapi
RAPIDAPI_KEY=<your X-RapidAPI-Key>
RAPIDAPI_HOST=us-real-estate-listings.p.rapidapi.com
RAPIDAPI_LIMIT=25
```

Cities are taken from each active alert's `criteria.location.cities` (e.g. `"Portland, OR"`). The crawler queries `/for-sale` and `/for-rent` once per city per tick, normalizes the response into `RawListing`, and upserts. Provider tag vocabulary (e.g. `central_air`, `garage_2_or_more`) is normalized into the canonical features in `src/lib/criteria.ts` — extend `FEATURE_SYNONYMS` there if you want better coverage.

## Match score

See [`docs/match-score.md`](docs/match-score.md). Threshold: 70 (default), 85 if user has `high_match_only` enabled.

## Theme

Five palettes (Sage & Clay, Cobalt & White, Navy & Sky, Ocean & Sand, Ink Blue & Bone). Picked in Settings; applied via CSS variables to both the app and the next outgoing email.

## Dev: bypass auth

Set `SCOUT_SKIP_AUTH=1` in `.env.local` to skip the sign-in gate. `/app/*` and `/api/*` will render without a user (DB-backed pages like Alerts/Settings will simply be empty until you sign in). Useful for previewing the UI quickly.

```bash
echo 'SCOUT_SKIP_AUTH=1' >> .env.local
npm run dev
# open http://localhost:3000/app/search
```

Never enable this in production.

## Non-goals (per spec)

In-app messaging with agents, real-time price prediction, polygon-drawing UI (the `polygon` field is in the schema, but the drawing tool is deferred), native mobile apps.
