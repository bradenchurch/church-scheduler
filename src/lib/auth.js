import { supabase } from './supabase';

/**
 * Request a Supabase magic-link sign-in email.
 *
 * The server-side sign-in allowlist (authorized_emails table) is enforced here
 * BEFORE supabase.auth.signInWithOtp is called: POST /api/auth/allowlist-check
 * returns 403 for emails that may not sign in, and in that case we never ask
 * Supabase to send a link (fail closed — if the check itself errors, we also
 * refuse to send). Pass { requireAllowlist: false } to skip the check for a
 * flow that must stay open to non-allowlisted emails (e.g. a public companion
 * sign-in) — today every caller is gated.
 */
export const signInWithOtp = async (email, redirectTo, { requireAllowlist = true } = {}) => {
  if (requireAllowlist) {
    try {
      const res = await fetch('/api/auth/allowlist-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 403) {
        return { error: { message: 'Email not authorized for sign-in' } };
      }
      if (!res.ok) {
        return { error: { message: 'Could not verify email access. Please try again.' } };
      }
    } catch {
      return { error: { message: 'Could not verify email access. Please try again.' } };
    }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
  return { error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
