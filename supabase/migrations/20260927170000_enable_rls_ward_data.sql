-- Lock ward tables so the publishable/anon key in the SPA cannot read or write
-- them. Scheduling stays on the Vercel /api routes, which use the service role
-- (bypasses RLS). Magic-link login still resolves role from `leaders` in the
-- browser, so authenticated allowlisted (or active) leaders may SELECT their
-- own id, email, role, and position — nothing else.
--
-- Deploy the service-role server change in this commit BEFORE applying this
-- migration. Until that code is live, /api still queries with the anon key
-- and these policies will fail those queries.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

-- SECURITY DEFINER + postgres (BYPASSRLS) so the helper can read the allowlist
-- and leaders without recursing through RLS. Not exposed via PostgREST
-- (schema `private` is outside the Data API). Returns only a boolean.
CREATE OR REPLACE FUNCTION private.is_presidency_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.authorized_emails AS allowlist
      WHERE lower(allowlist.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    OR EXISTS (
      SELECT 1
      FROM public.leaders AS leader
      WHERE coalesce(leader.active, true)
        AND lower(leader.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

REVOKE ALL ON FUNCTION private.is_presidency_member() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_presidency_member() TO authenticated;

-- New public tables should not be granted to the Data API roles by default.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tables the SPA and anon key must not touch. Explicit deny policies
-- (USING false) plus REVOKE, so restoring default grants without a new
-- policy still returns no rows. service_role keeps its grants and bypasses RLS.
-- ---------------------------------------------------------------------------

ALTER TABLE public.companionships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companionships FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.companionships FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS companionships_deny_api_roles ON public.companionships;
CREATE POLICY companionships_deny_api_roles
  ON public.companionships
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.slots FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS slots_deny_api_roles ON public.slots;
CREATE POLICY slots_deny_api_roles
  ON public.slots
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.availability_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_windows FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.availability_windows FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS availability_windows_deny_api_roles ON public.availability_windows;
CREATE POLICY availability_windows_deny_api_roles
  ON public.availability_windows
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bookings FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS bookings_deny_api_roles ON public.bookings;
CREATE POLICY bookings_deny_api_roles
  ON public.bookings
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.config FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS config_deny_api_roles ON public.config;
CREATE POLICY config_deny_api_roles
  ON public.config
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.qr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_requests FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.qr_requests FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS qr_requests_deny_api_roles ON public.qr_requests;
CREATE POLICY qr_requests_deny_api_roles
  ON public.qr_requests
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.chapel_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapel_submissions FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.chapel_submissions FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS chapel_submissions_deny_api_roles ON public.chapel_submissions;
CREATE POLICY chapel_submissions_deny_api_roles
  ON public.chapel_submissions
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.households FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS households_deny_api_roles ON public.households;
CREATE POLICY households_deny_api_roles
  ON public.households
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.household_members FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS household_members_deny_api_roles ON public.household_members;
CREATE POLICY household_members_deny_api_roles
  ON public.household_members
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.companionship_households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companionship_households FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.companionship_households FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS companionship_households_deny_api_roles ON public.companionship_households;
CREATE POLICY companionship_households_deny_api_roles
  ON public.companionship_households
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Allowlist contents stay server-side (POST /api/auth/allowlist-check uses
-- service_role). The helper above reads this table; the Data API does not.
ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_emails FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.authorized_emails FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS authorized_emails_deny_api_roles ON public.authorized_emails;
CREATE POLICY authorized_emails_deny_api_roles
  ON public.authorized_emails
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Google refresh tokens and delivery logs: service_role only.
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.oauth_tokens FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS oauth_tokens_deny_api_roles ON public.oauth_tokens;
CREATE POLICY oauth_tokens_deny_api_roles
  ON public.oauth_tokens
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.confirmation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmation_log FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.confirmation_log FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS confirmation_log_deny_api_roles ON public.confirmation_log;
CREATE POLICY confirmation_log_deny_api_roles
  ON public.confirmation_log
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- leaders: the SPA reads this after magic-link login
-- (AuthContext / AuthCallback: id, role, position where email = jwt email).
-- Secrets on the row (phone, ical_token, uuid, calendar id) stay ungranted.
-- ---------------------------------------------------------------------------

ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaders FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.leaders FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, email, role, position) ON TABLE public.leaders TO authenticated;

DROP POLICY IF EXISTS leaders_deny_anon ON public.leaders;
CREATE POLICY leaders_deny_anon
  ON public.leaders
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS leaders_select_own ON public.leaders;
CREATE POLICY leaders_select_own
  ON public.leaders
  FOR SELECT
  TO authenticated
  USING (
    private.is_presidency_member()
    AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

COMMENT ON POLICY leaders_select_own ON public.leaders IS
  'Allowlisted or active leaders may read their own id, email, role, and position. All other ward data is service_role via /api.';
