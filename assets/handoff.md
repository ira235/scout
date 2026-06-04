# Build prompt — **Scout**, a real-estate listing alerts app

You are GitHub Copilot. Build a production web app called **Scout** that helps people get notified about new real-estate listings matching their criteria. Use the spec below verbatim. When something is unspecified, choose conventional defaults and note your choice.

---

## 1. What it does, in one paragraph

A user describes the kind of home they're looking for — either in **natural language** ("3-bed house under $700k with a garden in a walkable neighborhood") or via **structured filters** (Zillow-style: buy/rent, location, price, beds, baths, type, must-have features). Scout saves that as a **named alert** and watches a real-estate listings feed. New listings that match are emailed to the user on the cadence they pick: **instant**, **daily digest**, or **weekly digest**.

The flow has six screens: criteria builder → results feed → listing detail → saved alerts dashboard → settings → an email-digest preview that mirrors what the user will receive.

---

## 2. Tech stack

- **Framework:** Next.js 15 (App Router) + TypeScript + React 18.
- **Styling:** Tailwind CSS with CSS variables for theming (5 palettes, see §9).
- **DB:** Supabase (Postgres + Auth + Row-Level Security). Use the official `@supabase/supabase-js` client on the server (service-role key for cron jobs, anon key + RLS for user-scoped reads). For local dev, use `supabase start` (Docker) or point at a Supabase cloud project.
- **Auth:** Supabase Auth (email magic link + Google OAuth). Sessions on the server via `@supabase/ssr`. Use Supabase's `auth.users` table as the source of truth and join into `public.profiles` via `id`.
- **Background jobs:** Inngest **or** a Vercel Cron + queue table. Two jobs:
  - `crawl-listings` — runs every 15 min, pulls fresh listings, upserts into DB, flags new matches.
  - `send-digests` — runs hourly, finds users whose digest window opens this hour, emails them.
- **Email:** Resend (`react-email` for templates). Plain-text fallback included.
- **LLM (prompt parsing):** Anthropic Claude via `@anthropic-ai/sdk`. Function-call into a strict JSON schema (§4). Cache parses by prompt text hash.
- **Listings source:** Abstract behind a `ListingProvider` interface (§6). Ship two adapters: a `MockProvider` seeded from fixtures for dev/tests, and an `RentcastProvider` calling rentcast.io (any other MLS-compatible API works — keep it swappable).
- **Maps:** Mapbox or Google Maps, gated behind a `MapProvider` interface.
- **Testing:** Vitest for units, Playwright for the two critical flows (create alert → see match; receive + click digest email).

---

## 3. Data model (Supabase / Postgres)

Write SQL migrations in `supabase/migrations/`. Generate TypeScript types with `supabase gen types typescript --local > src/lib/db.types.ts` and consume them in the app via a typed Supabase client.

```sql
-- enums
create type digest_freq    as enum ('INSTANT','DAILY','WEEKLY');
create type listing_mode   as enum ('BUY','RENT');
create type listing_status as enum ('ACTIVE','PENDING','SOLD','OFF');
create type property_type  as enum ('HOUSE','TOWNHOME','CONDO','APARTMENT');

-- profile (1:1 with auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  created_at  timestamptz not null default now()
);

create table public.user_settings (
  user_id          uuid primary key references public.profiles(id) on delete cascade,
  default_freq     digest_freq not null default 'DAILY',
  send_hour        int not null default 8 check (send_hour between 0 and 23),
  timezone         text not null default 'America/Los_Angeles',
  per_email_cap    int not null default 10,
  push_enabled     boolean not null default true,
  hide_pending     boolean not null default true,
  high_match_only  boolean not null default false,
  theme            text not null default 'sage'
);

create table public.alerts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  mode              listing_mode not null,
  criteria          jsonb not null,            -- shape in §4
  raw_prompt        text,
  frequency         digest_freq not null default 'DAILY',
  active            boolean not null default true,
  last_notified_at  timestamptz,
  created_at        timestamptz not null default now()
);
create index alerts_user_active_idx on public.alerts (user_id, active);

create table public.listings (
  id             text primary key,             -- provider-stable, e.g. 'rentcast:42'
  source         text not null,
  mode           listing_mode not null,
  status         listing_status not null default 'ACTIVE',
  price          int not null,                 -- cents; for RENT, monthly rent in cents
  address        text not null,
  hood           text,
  city           text not null,
  state          text not null,
  zip            text,
  lat            double precision not null,
  lng            double precision not null,
  beds           numeric not null,             -- allow 0.5 for studios
  baths          numeric not null,
  sqft           int,
  lot_sqft       int,
  year_built     int,
  property_type  property_type not null,
  features       text[] not null default '{}', -- canonical tags, §7
  description    text,
  photos         text[] not null default '{}', -- URLs
  posted_at      timestamptz not null,
  fetched_at     timestamptz not null default now()
);
create index listings_city_mode_status_idx on public.listings (city, mode, status, posted_at desc);
create index listings_features_idx on public.listings using gin (features);

create table public.alert_matches (
  id           uuid primary key default gen_random_uuid(),
  alert_id     uuid not null references public.alerts(id) on delete cascade,
  listing_id   text not null references public.listings(id) on delete cascade,
  match_score  int not null check (match_score between 0 and 100),
  notified_at  timestamptz,                    -- null = pending in next digest
  created_at   timestamptz not null default now(),
  unique (alert_id, listing_id)
);
create index alert_matches_pending_idx on public.alert_matches (alert_id) where notified_at is null;

create table public.favorites (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  listing_id  text not null references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);
```

### Row-Level Security

Enable RLS on every `public.*` table. The cron jobs use the **service-role key** which bypasses RLS; the app uses the **anon key** with a user session.

```sql
alter table public.profiles      enable row level security;
alter table public.user_settings enable row level security;
alter table public.alerts        enable row level security;
alter table public.alert_matches enable row level security;
alter table public.favorites     enable row level security;
alter table public.listings      enable row level security;

-- users can read/write their own rows
create policy "own profile"   on public.profiles      for all using (auth.uid() = id)      with check (auth.uid() = id);
create policy "own settings"  on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own alerts"    on public.alerts        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own favorites" on public.favorites     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- alert_matches: visible if the parent alert is yours
create policy "own alert matches" on public.alert_matches
  for select using (exists (select 1 from public.alerts a where a.id = alert_id and a.user_id = auth.uid()));

-- listings: public read (they're MLS data); writes only by service role
create policy "listings readable" on public.listings for select using (true);
```

### Profile bootstrap trigger

When a new auth user signs up, create their `profiles` and `user_settings` rows:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  insert into public.user_settings (user_id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Realtime

Enable Supabase Realtime on `public.alert_matches` so the dashboard can show new matches live without polling. Filter the subscription to the current user via RLS — the channel will only fire for rows their policy allows.

### Storage

Use a Supabase Storage bucket `listing-photos` for any images the app re-hosts (most photos stay at the provider URL; only re-host if a provider requires it). Public read, service-role writes.

---

## 4. Criteria schema (the heart of the app)

This is the canonical shape stored in `Alert.criteria`, and also what the LLM emits from a prompt. Validate with Zod.

```ts
const CriteriaSchema = z.object({
  mode: z.enum(["BUY", "RENT"]),
  location: z.object({
    cities: z.array(z.string()).min(1),    // ["Portland, OR"]
    neighborhoods: z.array(z.string()).default([]),
    polygon: z.array(z.tuple([z.number(), z.number()])).optional(), // [[lat,lng], ...]
  }),
  priceMax: z.number().int().positive(),    // cents
  priceMin: z.number().int().nonnegative().default(0),
  bedsMin: z.number().min(0).default(0),
  bathsMin: z.number().min(0).default(0),
  sqftMin: z.number().int().optional(),
  propertyTypes: z.array(z.enum(["HOUSE","TOWNHOME","CONDO","APARTMENT"])).default([]),
  features: z.array(z.string()).default([]),    // canonical, see §7
  excludeFeatures: z.array(z.string()).default([]),
  maxAgeYears: z.number().int().optional(),
  petFriendly: z.boolean().optional(),       // rent-only fast-path
});
```

### Prompt → Criteria

`POST /api/parse-prompt { prompt: string }` returns `{ criteria, confidence, unparsed }`.
- Call Claude with a system prompt that instructs it to emit ONLY the JSON schema above, no prose.
- Few-shot it with 3 examples.
- Echo back any tokens it couldn't map in `unparsed[]` so the UI can offer manual refinement.
- Cache by `sha256(prompt)` for 24h.

The UI shows parsed chips below the prompt box ("Scout understood: Rent · 2+ bed · ≤ $2,800 · Pet friendly") so the user can verify before saving.

---

## 5. Routes / pages

App Router. Mobile-first; the prototype is iPhone-sized but layouts are responsive — at ≥ 768px, dashboard and results use two columns.

| Path | Purpose |
|---|---|
| `/` | Marketing landing (out of scope — stub one h1 + CTA). |
| `/app/search` | **Criteria builder.** Prompt + structured filters; segmented toggle by default. Three layout variants are shipped (toggle, stacked, wizard) and selectable in dev via `?style=`. |
| `/app/matches` | **Results feed** for the current/draft criteria. Sort: best match / price / newest. Card or list layout (user-settable). Density toggle. |
| `/app/listings/[id]` | **Listing detail.** Photo gallery, specs, "Why Scout flagged this" reasoning (top 3 criteria matched). |
| `/app/alerts` | **Saved alerts dashboard.** List of Alert rows with on/off switch, daily/weekly badge, last-sent timestamp, "edit" deep link, and a banner showing what tomorrow's digest will look like. |
| `/app/settings` | Delivery cadence (instant/daily/weekly), send time, email, per-email cap, push toggle, filter toggles. |
| `/app/alerts/[id]/preview` | **Email digest preview** — server-renders the actual email template the user will receive. |
| `/api/parse-prompt` | LLM endpoint, §4. |
| `/api/alerts` `GET/POST/PATCH/DELETE` | CRUD. |
| `/api/matches?alertId=…` | List `AlertMatch` joined with `Listing`. |
| `/api/cron/crawl` | Cron entry, §8. |
| `/api/cron/digest` | Cron entry, §8. |
| `/api/webhooks/email-events` | Resend bounce/complaint webhook → mark email unhealthy. |

Auth gate everything under `/app/*` and `/api/*` with `@supabase/ssr` middleware (except cron, which checks a `x-cron-secret` header against `CRON_SECRET`).

---

## 6. ListingProvider interface

```ts
interface ListingProvider {
  key: string;                                    // "mock" | "rentcast"
  fetchNew(opts: { since: Date; cities: string[] }): Promise<RawListing[]>;
  fetchById(id: string): Promise<RawListing | null>;
}
```

The crawl job:
1. Reads distinct `(city, mode)` pairs from active Alerts.
2. Asks each provider for listings posted since `MAX(Listing.fetchedAt) - 1h`.
3. Upserts into `Listing`, normalizing features to the canonical vocab (§7).
4. For each new `Listing`, scores it against every active Alert in the matching city (§7); on score ≥ 70 inserts an `AlertMatch` with `notifiedAt = null`.

Implementation note: do NOT hammer providers per-alert. Crawl by city, then match in memory.

---

## 7. Matching & feature vocabulary

**Canonical feature tags** (lowercased, kebab-cased — normalize provider tags into these):
`garden, garage, in-unit-laundry, pet-friendly, fireplace, balcony, new-build, walkable, transit, parking, dishwasher, ac, fenced-yard, basement, rooftop, doorman, elevator, pool, ev-charger`

**Match scoring** (0–100, integers). Compute deterministically:

| Component | Weight | How |
|---|---|---|
| Price within budget | 25 | 25 if ≤ priceMax. Else 0. (Hard fail if over by > 5%.) |
| Beds | 20 | 20 if ≥ bedsMin; 10 if one short; else 0. |
| Baths | 10 | Same shape as beds. |
| Property type | 10 | 10 if in propertyTypes (or list empty); else 0. |
| Location | 15 | 15 if in named neighborhoods; 10 if in city; else 0. |
| Features overlap | 15 | `15 * matched / required` (matched / required features). |
| Freshness | 5 | 5 if posted in last 24h; decay to 0 over 14d. |

Score = `Math.round(sum)`. **Threshold: 70.** Below 70 → not a match. `highMatchOnly` user setting raises threshold to 85.

---

## 8. Digest pipeline (the email part)

### Cadences
- `INSTANT` — email immediately on new match (rate-limited to 1 per alert per 15 min; bundle multiple matches that arrived in the window).
- `DAILY` — every day at `UserSettings.sendHour` in the user's TZ.
- `WEEKLY` — Mondays at the same hour.

### `send-digests` cron (hourly)
```pseudocode
for each user where it is sendHour in their TZ:
  for each active Alert owned by user:
    pending = AlertMatch.where(alertId, notifiedAt: null).orderBy(matchScore desc).limit(perEmailCap)
    if pending matches the alert's frequency window: skip
    if INSTANT: send right away in the crawl job, not here
    if pending.length == 0 and frequency == WEEKLY: send a "no new matches this week" thin email
    if pending.length > 0: send digest email, set notifiedAt = now() on those AlertMatches
```

### Email template
React Email component. Mirrors the in-app preview (see `EmailScreen` in the prototype):
- Brand header (Scout pin + name + recipient + timestamp).
- Hero band in primary color: "N new homes match '{alert name}'" + 3 stat tiles (new today, top match %, price-from).
- Up to `perEmailCap` listing blocks: photo, NEW badge, match %, price, address, beds/baths/sqft mono row, short blurb, "View listing" CTA linking to `/app/listings/{id}?utm=digest-{alertId}`.
- Footer: "(N - cap) more matches in the app" + frequency line + Change frequency / Pause / Unsubscribe links (signed tokens, no login).

All gradients use CSS vars so a re-theme cascades. Plain-text fallback lists each match as `$price — address — beds/baths/sqft — match% — URL`.

---

## 9. Design system

**One sentence:** Warm-neutral, mobile-first, generous radii (20/13), one heavy display weight, monospace for numerics and badges, no emoji.

### Typography
- **Sans:** Hanken Grotesk, weights 400/500/600/700/800. Display sizes are 800.
- **Mono:** JetBrains Mono, weights 400/500/600. Used for prices, specs (beds/baths/sqft), match badges, timestamps.

### Palettes (all theme-able via CSS vars)
Ship as 5 named themes; user picks via Settings. Variable names stay constant.

| Theme | primary | accent | bg |
|---|---|---|---|
| Sage & Clay (default) | `#2F5D4F` | `#C9794A` | `#EFEBE2` |
| Cobalt & White | `#1F4FD9` | `#E07A3C` | `#EDF0F7` |
| Navy & Sky | `#0B3A6F` | `#4A90E2` | `#EFF3F9` |
| Ocean & Sand | `#0E6E8A` | `#E3A857` | `#E8EEF1` |
| Ink Blue & Bone | `#15315B` | `#D77A4A` | `#F0EBDF` |

Each theme also sets `--green-deep`, `--green-tint`, `--clay-deep`, `--clay-tint`, `--surface`, `--ink`, `--ink-soft`, `--ink-faint`, `--line`. (The legacy var names `--green`/`--clay` map to primary/accent — keep them for ease of refactor.)

### Components

- **Listing card** — 16/20px padded, surface bg, photo on top (184px tall, 16r), price (mono price + `/mo` for rent), match badge (mono, green tint when ≥ 92), address, hood · city, divider, beds/baths/sqft mono row, up to 3 feature chips.
- **Listing row** — compact horizontal variant for the list layout: 104×88 photo, two-line text, match badge bottom-right.
- **Chip** — 4 tones (neutral / primary / accent / outline), `999px` radius. With or without leading icon.
- **MatchBadge** — `{n}% match`, mono, optional dark fill for use over photos.
- **FreqBadge** — Daily (clay tint, clock icon) / Weekly (green tint, calendar icon).
- **Segmented control** — used for buy/rent, beds/baths +N pickers, sort, builder toggle. Pill-style, primary-on-surface for the active cell.
- **Bottom tab bar** — 4 tabs: Search, Matches, Alerts (with red dot for new), Settings. Floating "liquid" surface with backdrop-blur.
- **Photo placeholder** — diagonal-stripe SVG pattern in palette tones with the room label centered. Use this when no photo URL yet.

### Tokens
- Radii: 20 (cards), 13 (small cards), 999 (chips/badges).
- Shadow: `0 1px 2px rgba(28,32,28,0.05), 0 6px 16px rgba(28,32,28,0.04)`.
- Density scale: compact (pad 12, gap 8), regular (16, 12), comfy (20, 16). Expose as a user pref.

---

## 10. Acceptance criteria

A non-technical reviewer should be able to:

1. Sign up by email, land on `/app/search`.
2. Type "2-bed pet-friendly rental under $2,800 in Portland" → see parsed chips → click **See matches** → see a sorted feed.
3. Tap **Save** → name the alert → pick Daily → land on `/app/alerts` and see it active with "Daily" badge.
4. Open the digest preview from the dashboard banner → see the exact email that will arrive tomorrow morning.
5. Receive a real email at the next 8 AM tick (use a test sender if needed) with 1+ listings matching the saved alert, clickable through to `/app/listings/[id]`.
6. Toggle the alert off on the dashboard → next digest skips it.
7. Switch theme to "Cobalt & White" in Settings → entire app (and the next email) reflects the new palette.

### Non-goals (do not build):
- In-app messaging with agents.
- Real-time price prediction / valuation.
- Saving custom map polygons via drawing tool (criteria.polygon supports it; UI for drawing it can wait).
- Native mobile app.

---

## 11. Deliverables

- A working Next.js app in `/`.
- Seeded local DB with 30 demo listings across Portland, Seattle, and Austin.
- `npm run dev` runs the app; `npm run jobs:dev` runs the crawl + digest jobs locally with a 1-minute tick.
- README with `.env.example` covering `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `LISTING_PROVIDER` (`mock`/`rentcast`), `RENTCAST_API_KEY`, `CRON_SECRET`.
- Two Playwright specs: `create-alert-and-see-match.spec.ts`, `digest-email-renders.spec.ts`.
- Documentation note describing the `MatchScore` algorithm and how to tune the threshold.

Build it.
