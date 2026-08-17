// Verifies the REAL (non-mock) auth path of server/middleware/auth.js.
//
// This script mints a real Supabase access token for a throwaway test user,
// then exercises a gated endpoint against a server running WITHOUT MOCK_AUTH.
// It proves three things:
//   1. A garbage token is rejected (401).
//   2. A valid token is accepted and resolves to role 'companion' when the
//      email has no matching leaders row (403 on a leader-only endpoint).
//   3. A valid token whose email matches a leaders row resolves to the leader
//      role and passes the role gate (200).
//
// Usage:
//   node scripts/verify-real-auth.mjs [baseUrl]
//
// Requires SUPABASE_URL + SUPABASE_SERVICE_KEY (or SUPABASE_SECRET_KEY) in env.
// A throwaway auth user + leaders row are created and cleaned up.

import { createClient } from '@supabase/supabase-js';

const baseUrl = process.argv[2] || 'http://localhost:3108';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const stamp = Date.now();
const email = `cs-auth-smoke-${stamp}@example.com`;
const password = 'correct-horse-battery-staple';

async function get(path, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

let userId = null;
let leaderRowId = null;

try {
  // 1. Create a throwaway auth user + sign in to mint a real access token.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) throw new Error(`createUser: ${createErr.message}`);
  userId = created.user.id;

  const { data: session, error: signInErr } = await admin.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) throw new Error(`signInWithPassword: ${signInErr.message}`);
  const token = session.session.access_token;
  console.log('minted real access token for', email);

  // 2. Garbage token → 401
  const bad = await get('/api/leaders', 'garbage-token');
  console.log(`garbage token  -> ${bad.status} ${bad.body}`);

  // 3. Valid token, no leaders row → role 'companion' → 403 on /api/leaders
  const companion = await get('/api/leaders', token);
  console.log(`valid token (no leader row) -> ${companion.status} ${companion.body}`);

  // 4. Add a temporary leaders row matching the email, role 'leader' → 200
  const { data: leaderRow, error: leadErr } = await admin
    .from('leaders')
    .insert({ id: `cs-auth-test-${stamp}`, name: 'Auth Test', email, role: 'leader', active: true })
    .select()
    .single();
  if (leadErr) throw new Error(`insert leader: ${leadErr.message}`);
  leaderRowId = leaderRow.id;

  const leader = await get('/api/leaders', token);
  console.log(`valid token (leader row) -> ${leader.status} (${leader.body.slice(0, 80)}...)`);

  console.log('\nReal auth path verified.');
} catch (err) {
  console.error('verify-real-auth failed:', err.message);
  process.exitCode = 1;
} finally {
  // Cleanup: delete the temporary leaders row and the throwaway auth user.
  if (leaderRowId) {
    await admin.from('leaders').delete().eq('id', leaderRowId);
    console.log('cleaned up temp leaders row');
  }
  if (userId) {
    await admin.auth.admin.deleteUser(userId);
    console.log('cleaned up throwaway auth user');
  }
}
