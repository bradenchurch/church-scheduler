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
