import { supabase } from './supabase';

// Fetch wrapper that attaches the current Supabase session's bearer token.
// Required for endpoints gated behind requireAuth / requireRole (e.g.
// GET /api/leaders, POST /api/bookings).
export async function authedFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${session?.access_token || ''}`,
      'Content-Type': 'application/json',
    },
  });
}
