CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schema for EQ Presidency Scheduler

CREATE TABLE IF NOT EXISTS leaders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  google_calendar_id TEXT,
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS companionships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id TEXT REFERENCES leaders(id) ON DELETE SET NULL,
  companion1_name TEXT NOT NULL,
  companion2_name TEXT NOT NULL,
  companion1_email TEXT,
  companion2_email TEXT
);

CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id TEXT REFERENCES leaders(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  companionship_id UUID REFERENCES companionships(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'booked', 'completed', 'cancelled')) DEFAULT 'pending'
);

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
