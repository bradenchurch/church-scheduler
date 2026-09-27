-- Deny the publishable/anon key (and any other non-service role) access to
-- ward tables. /api reads and writes with the service role, which bypasses RLS.
-- Deploy that server change before applying this migration.
--
-- No policies for anon: with RLS enabled and no policy, anon is denied.
-- authorized_emails, oauth_tokens, and confirmation_log already have RLS and
-- no policies (service role only). Leave them as they are.

ALTER TABLE public.companionships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapel_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companionship_households ENABLE ROW LEVEL SECURITY;

-- The SPA does not query these tables. It does query `leaders` after magic-link
-- login (AuthContext / AuthCallback: id, role, position for the session email).
-- That is the only authenticated PostgREST policy. Anon has none, so anon is denied.
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leaders_select_own ON public.leaders;
CREATE POLICY leaders_select_own
  ON public.leaders
  FOR SELECT
  TO authenticated
  USING (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND coalesce(active, true)
  );

COMMENT ON POLICY leaders_select_own ON public.leaders IS
  'Signed-in user may read their own active leader row so the SPA can resolve role. All other ward data is service_role via /api.';
