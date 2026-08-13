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
  companion2_name TEXT NOT NULL
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

-- QR-code interview requests (public chapel entry flow)
CREATE TABLE IF NOT EXISTS qr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companionship_id UUID REFERENCES companionships(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'expired')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_to TEXT REFERENCES leaders(id),
  assigned_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_qr_requests_status ON qr_requests(status);
CREATE INDEX IF NOT EXISTS idx_qr_requests_companionship ON qr_requests(companionship_id);
