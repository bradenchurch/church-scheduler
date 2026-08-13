// Single source of truth for the ward slug used in QR-code URLs.
//
// Resolution order (highest priority first):
//   1. process.env.WARD_SLUG
//   2. config table row (key='ward_slug') in Supabase
//   3. DEFAULT_WARD_SLUG constant
//
// The config table is the recommended mechanism — it can be updated at
// runtime without redeploying. The env var is an override for emergencies.
// The constant is the safety net so QR codes never break if both above
// are missing.

import { createClient } from '@supabase/supabase-js';

const DEFAULT_WARD_SLUG = 'long-valley-2nd-ward';

let _cached = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export function getDefaultWardSlug() {
  return DEFAULT_WARD_SLUG;
}

export async function getWardSlug() {
  // 1. Env var override (always wins, no caching).
  if (process.env.WARD_SLUG) return process.env.WARD_SLUG;

  // 2/3. Config table or fallback, with a short in-memory cache.
  const now = Date.now();
  if (_cached && now - _cachedAt < CACHE_TTL_MS) return _cached;

  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    if (url && key) {
      const sb = createClient(url, key, { auth: { persistSession: false } });
      const { data, error } = await sb
        .from('config')
        .select('value')
        .eq('key', 'ward_slug')
        .maybeSingle();
      if (!error && data && typeof data.value === 'string' && data.value.length > 0) {
        _cached = data.value;
        _cachedAt = now;
        return _cached;
      }
    }
  } catch (_e) {
    // fall through to default
  }

  _cached = DEFAULT_WARD_SLUG;
  _cachedAt = now;
  return _cached;
}

export function clearWardSlugCache() {
  _cached = null;
  _cachedAt = 0;
}
