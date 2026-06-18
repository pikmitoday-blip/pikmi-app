-- ─────────────────────────────────────────────────────────────────────────────
-- Migracija za sistem automatskih trial/onboarding mejlova.
-- Pokreni JEDNOM u Supabase SQL editoru (Dashboard → SQL Editor → New query → Run).
-- Idempotentno je (IF NOT EXISTS) — bezbedno i ako se pokrene više puta.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  -- Idempotencija mejlova pred istek (svaki ide tačno jednom po korisniku)
  add column if not exists trial_email_2d_sent      boolean not null default false,
  add column if not exists trial_email_1d_sent      boolean not null default false,
  add column if not exists trial_email_expired_sent boolean not null default false,
  -- Podsetnici za nepopunjen portfolio: koja varijacija je sledeća (0..) i kog dana je poslednji put poslat
  add column if not exists portfolio_reminder_count     integer not null default 0,
  add column if not exists portfolio_reminder_last_date date;
