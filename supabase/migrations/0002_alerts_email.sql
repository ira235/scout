-- Scout: move alerts from account-based (user_id) to email-based (no login required)
-- Keeps user_id around as nullable, so accounts can be re-added later without another migration.

-- 1. Allow alerts to exist without a user_id
alter table public.alerts
  alter column user_id drop not null;

-- 2. Add the email column alerts will actually key off of
alter table public.alerts
  add column email text;

-- 3. Require at least one of user_id or email to be set
alter table public.alerts
  add constraint alerts_owner_check check (user_id is not null or email is not null);

-- 4. Index email for fast lookups (e.g. "show me my alerts")
create index alerts_email_idx on public.alerts (email);