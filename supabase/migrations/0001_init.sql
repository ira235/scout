-- Scout: initial schema
-- Enums
create type digest_freq    as enum ('INSTANT','DAILY','WEEKLY');
create type listing_mode   as enum ('BUY','RENT');
create type listing_status as enum ('ACTIVE','PENDING','SOLD','OFF');
create type property_type  as enum ('HOUSE','TOWNHOME','CONDO','APARTMENT');

-- Profile (1:1 with auth.users)
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
  criteria          jsonb not null,
  raw_prompt        text,
  frequency         digest_freq not null default 'DAILY',
  active            boolean not null default true,
  last_notified_at  timestamptz,
  created_at        timestamptz not null default now()
);
create index alerts_user_active_idx on public.alerts (user_id, active);

create table public.listings (
  id             text primary key,
  source         text not null,
  mode           listing_mode not null,
  status         listing_status not null default 'ACTIVE',
  price          int not null,
  address        text not null,
  hood           text,
  city           text not null,
  state          text not null,
  zip            text,
  lat            double precision not null,
  lng            double precision not null,
  beds           numeric not null,
  baths          numeric not null,
  sqft           int,
  lot_sqft       int,
  year_built     int,
  property_type  property_type not null,
  features       text[] not null default '{}',
  description    text,
  photos         text[] not null default '{}',
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
  notified_at  timestamptz,
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

-- Email health (for Resend webhooks)
create table public.email_health (
  email      text primary key,
  status     text not null default 'ok', -- ok | bounced | complained
  reason     text,
  updated_at timestamptz not null default now()
);

-- Throttle for INSTANT cadence: at most one email per alert per 15 minutes
create table public.alert_send_log (
  alert_id   uuid not null references public.alerts(id) on delete cascade,
  sent_at    timestamptz not null default now(),
  primary key (alert_id, sent_at)
);

-- RLS
alter table public.profiles      enable row level security;
alter table public.user_settings enable row level security;
alter table public.alerts        enable row level security;
alter table public.alert_matches enable row level security;
alter table public.favorites     enable row level security;
alter table public.listings      enable row level security;
alter table public.email_health  enable row level security;
alter table public.alert_send_log enable row level security;

create policy "own profile"   on public.profiles      for all using (auth.uid() = id)      with check (auth.uid() = id);
create policy "own settings"  on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own alerts"    on public.alerts        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own favorites" on public.favorites     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own alert matches" on public.alert_matches
  for select using (exists (select 1 from public.alerts a where a.id = alert_id and a.user_id = auth.uid()));

create policy "listings readable" on public.listings for select using (true);

-- Profile bootstrap on signup
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

-- Realtime: enable replication on alert_matches so users see live updates
alter publication supabase_realtime add table public.alert_matches;
