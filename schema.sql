CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schema for EQ Presidency Scheduler

CREATE TABLE IF NOT EXISTS leaders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  google_calendar_id TEXT,
  active BOOLEAN DEFAULT true,
  phone TEXT
);

-- Idempotent: bring forward the phone column on databases where leaders was
-- created before this column was added (Aug 2026).
ALTER TABLE leaders ADD COLUMN IF NOT EXISTS phone TEXT;

-- iCal subscription token (one per leader) for personal calendar feeds.
-- Secret-bearing: the /api/cal/:leader_id.ics endpoint requires this token
-- as a ?key= query param (no OAuth). Populated by scripts/ical-tokens.mjs.
ALTER TABLE leaders ADD COLUMN IF NOT EXISTS ical_token TEXT;

-- Authorization role per leader ('admin' | 'leader'). Admin can manage any
-- leader's dashboard + access /admin routes; leader manages only their own.
-- This column was referenced by the auth middleware long before the DDL was
-- committed, so it is added idempotently here (see server/middleware/auth.js).
ALTER TABLE leaders ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'leader';

-- Backfill: Braden (ward secretary) is the admin; presidency members are leaders.
UPDATE leaders SET role = 'admin' WHERE id = 'braden';
UPDATE leaders SET role = 'leader' WHERE id IN ('cole', 'kawika', 'sean');

CREATE TABLE IF NOT EXISTS companionships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id TEXT REFERENCES leaders(id) ON DELETE SET NULL,
  companion1_name TEXT NOT NULL,
  companion2_name TEXT,
  companion1_email TEXT,
  companion2_email TEXT
);

-- Drop NOT NULL on companion2_name so solo companionships can be seeded.
-- This is idempotent: the constraint was never strict in fresh DBs but the
-- existing prod schema installed before this PR had it as NOT NULL.
ALTER TABLE companionships ALTER COLUMN companion2_name DROP NOT NULL;

CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id TEXT REFERENCES leaders(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30
);

-- Date-specific availability windows published by a presidency member.
-- Companionships book these via the existing /api/bookings endpoints.
-- Distinct from the recurring `slots` table (which has day_of_week).
CREATE TABLE IF NOT EXISTS availability_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id TEXT NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
  window_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_duration_minutes IN (15, 20, 30, 45, 60)),
  buffer_minutes INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes IN (0, 5, 10)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);
-- Idempotent: bring forward slot_duration_minutes on databases where
-- availability_windows was created before this column was added (Aug 2026).
ALTER TABLE availability_windows ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER NOT NULL DEFAULT 30;
-- Optional break (0, 5, or 10 minutes) inserted between published slots.
-- Added Aug 2026: companions see back-to-back slots spread out by this gap.
ALTER TABLE availability_windows ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_availability_windows_leader_date ON availability_windows(leader_id, window_date);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  companionship_id UUID REFERENCES companionships(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'booked', 'completed', 'cancelled')) DEFAULT 'pending'
);

-- Traceability for date-specific bookings: when a companionship books a
-- date-specific availability window, slot_id is NULL and window_id points at
-- the availability_windows row.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS window_id UUID REFERENCES availability_windows(id) ON DELETE SET NULL;

-- Optional family-needs / discussion-topics note the companion leaves at
-- booking time, surfaced to the presidency on the admin dashboard + leader page.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Canonical ward slug for QR-code URLs. Single source of truth; server/ward.js
-- reads from this row (with env var override + hardcoded fallback). Update
-- the slug here at runtime if the ward boundary changes.
INSERT INTO config (key, value)
VALUES ('ward_slug', '"long-valley-2nd-ward"')
ON CONFLICT (key) DO NOTHING;

-- QR-code interview requests (public chapel entry flow)
CREATE TABLE IF NOT EXISTS qr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companionship_id UUID REFERENCES companionships(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'expired')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_to TEXT REFERENCES leaders(id),
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Backfill: add completed_at to existing qr_requests tables (added by cs-smart-routing in flight).
ALTER TABLE qr_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_qr_requests_status ON qr_requests(status);
CREATE INDEX IF NOT EXISTS idx_qr_requests_companionship ON qr_requests(companionship_id);
-- Google OAuth tokens (one row per connected leader/user).
-- user_id references the Supabase auth user (auth.users), not profiles.
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT,
  provider TEXT NOT NULL DEFAULT 'google',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Delivery results for calendar invites + confirmation emails.
CREATE TABLE IF NOT EXISTS confirmation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('calendar', 'email')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  recipient TEXT NOT NULL,
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sensitive tables: deny anon access, allow service role only.
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmation_log ENABLE ROW LEVEL SECURITY;

-- Chapel-side companion visit submissions (Phase B1, anonymous flow).
-- A companion scans the chapel QR, picks their name, optionally picks a
-- preferred meeting slot, reports which families they visited, and submits.
-- The submission routes to their companionship's assigned presidency member.
CREATE TABLE IF NOT EXISTS chapel_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companionship_id UUID REFERENCES companionships(id) ON DELETE CASCADE,
  companion_name TEXT NOT NULL,
  district_number INTEGER NOT NULL,
  assigned_to TEXT REFERENCES leaders(id),
  families_visited JSONB,
  visit_notes TEXT,
  preferred_slot_date DATE,
  preferred_slot_time TIME,
  presidency_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'completed', 'cancelled')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chapel_submissions_assigned ON chapel_submissions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_chapel_submissions_status ON chapel_submissions(status);
CREATE INDEX IF NOT EXISTS idx_chapel_submissions_companionship ON chapel_submissions(companionship_id);

-- =============================================================
-- Ministering roster: households + members + companionship links
-- (Phase A1). Seeded by seed.sql (deterministic, idempotent).
-- =============================================================

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY,
  ward_slug TEXT NOT NULL,
  family_name TEXT,
  head_first_name TEXT,
  head_last_name TEXT,
  head_phone TEXT,
  head_email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  category TEXT CHECK (category IN ('family','single','cross_district')),
  district_number INTEGER,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  gender TEXT CHECK (gender IN ('M','F')),
  birthday_partial TEXT,
  role TEXT CHECK (role IN ('spouse','child','single_adult','other'))
);

CREATE TABLE IF NOT EXISTS companionship_households (
  companionship_id UUID REFERENCES companionships(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  PRIMARY KEY (companionship_id, household_id)
);

CREATE INDEX IF NOT EXISTS idx_households_district ON households(district_number);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_companionship_households_household ON companionship_households(household_id);
