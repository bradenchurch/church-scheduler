import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// MOCK_AUTH=true bypasses real Supabase token verification and instead reads the
// caller's identity from the `X-Mock-User` request header (JSON, e.g.
// {"id":"...","role":"leader"}). This lets smoke tests exercise the auth gates
// without a magic-link round-trip. NEVER enable this in production.
const MOCK_AUTH = process.env.MOCK_AUTH === 'true';

const supabaseUrl = process.env.SUPABASE_URL || 'https://example.supabase.co';

// Token verification uses the SERVICE-ROLE key (not the anon key) so we can
// introspect the leaders table to resolve the caller's role regardless of RLS.
const serviceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  'public-anon-key';

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Resolve a role + leader identity for an authenticated Supabase user.
 *
 * Leaders are matched by email in the `leaders` table (which carries a
 * `role` column: 'admin' | 'leader'). Any authenticated user who is not a
 * leader is treated as a companion; their companionship assignment is
 * resolved by requireCompanionFor (fully implemented in the
 * cs-chapel-companion-auth PR).
 *
 * Returns { id, email, role, leader_id }.
 */
async function resolveIdentity(user) {
  const { data: leader, error } = await supabaseAdmin
    .from('leaders')
    .select('id, role')
    .eq('email', user.email)
    .maybeSingle();

  if (error) throw error;

  if (leader) {
    return {
      id: user.id,
      email: user.email,
      role: leader.role || 'leader',
      leader_id: leader.id,
    };
  }

  return { id: user.id, email: user.email, role: 'companion', leader_id: null };
}

/**
 * requireAuth — verify the caller's identity and populate req.user.
 *
 *   req.user = { id, email, role, leader_id }
 *
 * 401 on a missing/invalid token, 500 on a server-side Supabase error.
 */
export async function requireAuth(req, res, next) {
  if (MOCK_AUTH) {
    const raw = req.headers['x-mock-user'];
    if (!raw) {
      return res
        .status(401)
        .json({ error: 'Missing X-Mock-User header (MOCK_AUTH mode)', code: 'UNAUTHORIZED' });
    }

    let mock;
    try {
      mock = JSON.parse(raw);
    } catch {
      return res
        .status(401)
        .json({ error: 'Invalid X-Mock-User header', code: 'UNAUTHORIZED' });
    }

    req.user = {
      id: mock.id || null,
      email: mock.email || null,
      role: mock.role || 'leader',
      ...mock,
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token', code: 'UNAUTHORIZED' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' });
    }

    req.user = await resolveIdentity(data.user);
    return next();
  } catch (err) {
    console.error('[auth] token verification error:', err.message);
    return res.status(500).json({ error: 'Authentication error', code: 'AUTH_ERROR' });
  }
}

/**
 * requireRole(role) — factory returning middleware that authenticates the
 * request and then enforces a minimum role. Admins pass any role check.
 *
 * 401 unauthenticated, 403 wrong role, 500 auth server error.
 */
export function requireRole(role) {
  return async function roleGuard(req, res, next) {
    if (!req.user) {
      await requireAuth(req, res, () => {});
    }
    // requireAuth responded (401/500) without setting req.user.
    if (!req.user) return;

    if (req.user.role === 'admin' || req.user.role === role) {
      return next();
    }
    return res
      .status(403)
      .json({ error: `Requires role '${role}'`, code: 'FORBIDDEN' });
  };
}

/**
 * requireCompanionFor(paramName) — factory returning middleware that ensures
 * the caller is the assigned companion for the companionship identified by
 * req.params / req.body / req.query[paramName].
 *
 * STUB — the real companionship-assignment check is implemented in the
 * cs-chapel-companion-auth PR (it needs the Chapel magic-link sign-in UX to
 * know which companionship a companion belongs to). In real-auth mode this
 * fails closed so nobody can book a slot on a companionship they don't own.
 *
 * In MOCK_AUTH dev mode a trivial check compares the mock identity's
 * `companionship_id` against the target so smoke tests can exercise both the
 * assigned (201) and unassigned (403) paths.
 */
export function requireCompanionFor(paramName) {
  return function companionGuard(req, res, next) {
    const target =
      req.params?.[paramName] ??
      req.body?.[paramName] ??
      req.query?.[paramName];

    if (MOCK_AUTH) {
      if (req.user?.companionship_id && req.user.companionship_id === target) {
        return next();
      }
      return res
        .status(403)
        .json({ error: 'Not assigned to this companionship', code: 'FORBIDDEN' });
    }

    // Real auth path: fail closed until the companionships-table lookup lands.
    return res
      .status(403)
      .json({ error: 'Companion assignment verification unavailable', code: 'FORBIDDEN' });
  };
}
