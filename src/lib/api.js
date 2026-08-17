import { supabase } from './supabase';

// Fetch wrapper that attaches the current Supabase session's access token as a
// bearer Authorization header. Used by authenticated pages so the server's
// auth-gated endpoints (requireAuth / requireRole) receive the token.
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
