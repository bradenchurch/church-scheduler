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

// Fetch an auth-gated endpoint and trigger a browser download of its response
// (used for the admin CSV export, which returns text/csv rather than JSON).
export async function downloadCsv(url, filename = 'export.csv') {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session?.access_token || ''}` },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep the status message
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function deleteRoster() {
  const res = await authedFetch('/api/admin/roster', { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Failed to reset roster');
  return data;
}
