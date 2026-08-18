import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getWardSlug, getDefaultWardSlug } from './ward.js';
import { assignNextPending } from './routing.js';
import {
  buildAuthUrl,
  exchangeCode,
  authorizedClient,
  getTokenEmail,
  revokeToken,
  createCalendarEvent,
  sendEmail,
  GOOGLE_SCOPES,
} from './google.js';
import { handleBookingConfirmation } from './notifications.js';
import { getRoster, formatAddress, splitCompanions, getUnlinkedCompanions } from './roster.js';
import { requireAuth as requireSession, requireRole, requireCompanionFor } from './middleware/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'public-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Service-role client for sensitive tables (oauth_tokens / confirmation_log) that are RLS-protected.
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || supabaseKey;
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

app.use(cors());
app.use(express.json());

// Middleware to verify auth token
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch user role and leader details
    const { data: leaderData, error: leaderError } = await supabase
      .from('leaders')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (leaderError || !leaderData) {
       return res.status(403).json({ error: 'User is not an authorized leader' });
    }

    req.user = {
      ...user,
      leader_id: leaderData.id,
      role: leaderData.role || 'leader'
    };

    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// --- Admin management tools: leader/district mapping + welcome links ---
//
// District → leader mapping is authoritative for Long Valley 2nd Ward (see
// ARCHITECTURE.md / mockRoster.js): Cole = District 1 (1st Counselor),
// Kawika = District 2 (2nd Counselor), Sean = District 3 (President). The
// secretary (braden) is admin and owns no district.
const LEADER_DISTRICT = { cole: 1, kawika: 2, sean: 3 };
const LEADER_BY_DISTRICT = { 1: 'cole', 2: 'kawika', 3: 'sean' };

// Names/aliases a Church directory export might use for the "Assigned Leader /
// District" column (id, "First Last", "Last, First"). Last-name-only variants
// are intentionally omitted — they collide with ward members.
const LEADER_ALIASES = {
  cole: ['cole', 'cole chollet', 'chollet cole'],
  kawika: ['kawika', 'kawika tupuola', 'tupuola kawika'],
  sean: ['sean', 'sean bryan', 'bryan sean'],
};
const LEADER_ALIAS_TO_ID = {};
for (const [id, aliases] of Object.entries(LEADER_ALIASES)) {
  for (const a of aliases) LEADER_ALIAS_TO_ID[a] = id;
}

const WELCOME_LEADERS = [
  { id: 'cole', name: 'Cole Chollet', role_title: '1st Counselor', district: 1 },
  { id: 'kawika', name: 'Kawika Tupuola', role_title: '2nd Counselor', district: 2 },
  { id: 'sean', name: 'Sean Bryan', role_title: 'President', district: 3 },
];

const STATUS_LABEL = { pending: 'Pending', booked: 'Booked', completed: 'Completed', cancelled: 'Cancelled' };

// --- CSV parsing / matching helpers (roster import + export) ---

function normName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Order-insensitive, formatting-insensitive identity for a companionship pair.
// Handles "First Last" vs "Last, First" and reordered companions.
function pairTokens(a, b) {
  return [...normName(a).split(' '), ...normName(b).split(' ')]
    .filter(Boolean)
    .sort()
    .join('|');
}

function emailKey(value) {
  return `email:${String(value ?? '').toLowerCase().trim()}`;
}

function existingMatchKeys(comp) {
  const keys = [];
  if (comp.companion1_email) keys.push(emailKey(comp.companion1_email));
  if (comp.companion2_email) keys.push(emailKey(comp.companion2_email));
  keys.push(`names:${pairTokens(comp.companion1_name, comp.companion2_name)}`);
  return keys;
}

// Find the existing companionship (if any) a CSV row should update. Email
// matches take priority (most specific), then the normalized name pair.
function matchExisting(index, row) {
  const keys = [];
  if (row.companion1_email) keys.push(emailKey(row.companion1_email));
  if (row.companion2_email) keys.push(emailKey(row.companion2_email));
  keys.push(`names:${pairTokens(row.companion1_name, row.companion2_name)}`);
  for (const k of keys) {
    if (index.has(k)) return index.get(k);
  }
  return null;
}

// Minimal RFC 4180 CSV parser: quoted fields, escaped quotes, CRLF/LF rows,
// skips blank lines. Names never carry their own commas in this pipeline, but
// Church exports sometimes quote "Last, First", so quotes are handled.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = String(text ?? '');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((c) => String(c).trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((c) => String(c).trim() !== '')) rows.push(row);
  }
  return rows;
}

function detectColumns(headerRow) {
  const cols = { companion1_name: -1, companion2_name: -1, companion1_email: -1, companion2_email: -1, leader: -1 };
  headerRow.forEach((raw, i) => {
    const n = normName(raw);
    if (!n) return;
    if (n.includes('email')) {
      if (/1|first/.test(n) && !/2|second/.test(n)) cols.companion1_email = i;
      else if (/2|second/.test(n)) cols.companion2_email = i;
      else if (cols.companion1_email === -1) cols.companion1_email = i;
      else cols.companion2_email = i;
      return;
    }
    if (n.includes('leader') || n.includes('district') || n.includes('assigned')) {
      cols.leader = i;
      return;
    }
    if (n.includes('companion') || n.includes('elder') || n.includes('member') || n.includes('name')) {
      if (/1|first/.test(n) && !/2|second/.test(n)) cols.companion1_name = i;
      else if (/2|second/.test(n)) cols.companion2_name = i;
      else if (cols.companion1_name === -1) cols.companion1_name = i;
      else cols.companion2_name = i;
      return;
    }
  });
  return cols;
}

function mapColumns(rows) {
  const first = rows[0];
  const looksLikeHeader = first.some((c) =>
    /companion|elder|member|leader|district|assigned|email|name/i.test(String(c))
  );
  if (!looksLikeHeader) {
    // Positional: Companion 1, Companion 2, Assigned Leader/District, C1 Email, C2 Email
    const n = first.length;
    return {
      columns: {
        companion1_name: n > 0 ? 0 : -1,
        companion2_name: n > 1 ? 1 : -1,
        leader: n > 2 ? 2 : -1,
        companion1_email: n > 3 ? 3 : -1,
        companion2_email: n > 4 ? 4 : -1,
      },
      dataRows: rows,
    };
  }
  const columns = detectColumns(first);
  if (columns.companion1_name === -1 && columns.companion2_name === -1) {
    columns.companion1_name = 0;
    columns.companion2_name = 1;
    if (columns.leader === -1) columns.leader = 2;
    if (columns.companion1_email === -1) columns.companion1_email = 3;
    if (columns.companion2_email === -1) columns.companion2_email = 4;
  }
  return { columns, dataRows: rows.slice(1) };
}

function cell(row, idx) {
  if (idx === -1 || idx == null) return '';
  return String(row[idx] ?? '').trim();
}

function csvCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Resolve the "Assigned Leader / District" cell to a leaders.id (or null).
function resolveLeaderId(raw, byName) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return null;

  const bare = trimmed.match(/^(\d)$/);
  if (bare && LEADER_BY_DISTRICT[bare[1]]) return LEADER_BY_DISTRICT[bare[1]];

  const district = trimmed.match(/district\s*(\d)/i);
  if (district && LEADER_BY_DISTRICT[district[1]]) return LEADER_BY_DISTRICT[district[1]];

  const key = normName(trimmed);
  if (!key) return null;
  if (LEADER_ALIAS_TO_ID[key]) return LEADER_ALIAS_TO_ID[key];
  if (byName.has(key)) return byName.get(key);
  return null;
}

// Shared aggregation: every companionship joined against its most recent
// non-cancelled booking to derive status + leader + scheduled date/time. Used
// by GET /api/admin/analytics and GET /api/admin/export.csv so the two stay in
// lock-step. Best-effort on optional tables (bookings.window_id and
// availability_windows) so a missing migration degrades instead of 500-ing.
async function computeRosterStatuses() {
  const [leadersRes, compsRes, slotsRes] = await Promise.all([
    supabase.from('leaders').select('id, name').order('name'),
    supabase.from('companionships').select('id, leader_id, companion1_name, companion2_name'),
    supabase.from('slots').select('id, leader_id, start_time'),
  ]);

  if (leadersRes.error) throw leadersRes.error;
  if (compsRes.error) throw compsRes.error;
  if (slotsRes.error) throw slotsRes.error;

  const leaders = leadersRes.data || [];
  const comps = compsRes.data || [];
  const slots = slotsRes.data || [];

  let bookings = [];
  try {
    const bookingsRes = await supabase
      .from('bookings')
      .select('id, companionship_id, slot_id, window_id, scheduled_date, status')
      .neq('status', 'cancelled')
      .order('scheduled_date', { ascending: false });
    if (bookingsRes.error) throw bookingsRes.error;
    bookings = bookingsRes.data || [];
  } catch {
    const fallbackRes = await supabase
      .from('bookings')
      .select('id, companionship_id, slot_id, scheduled_date, status')
      .neq('status', 'cancelled')
      .order('scheduled_date', { ascending: false });
    if (fallbackRes.error) throw fallbackRes.error;
    bookings = fallbackRes.data || [];
  }

  let windows = [];
  try {
    const windowsRes = await supabase
      .from('availability_windows')
      .select('id, leader_id, window_date, start_time');
    if (windowsRes.error) throw windowsRes.error;
    windows = windowsRes.data || [];
  } catch {
    windows = [];
  }

  const leaderById = new Map(leaders.map((l) => [l.id, l]));
  const slotTimeById = new Map(slots.map((s) => [s.id, s.start_time]));
  const windowTimeById = new Map(windows.map((w) => [w.id, w.start_time]));

  const latestBookingByComp = new Map();
  for (const b of bookings) {
    if (!latestBookingByComp.has(b.companionship_id)) {
      latestBookingByComp.set(b.companionship_id, b);
    }
  }

  // Static roster carries the companions' phone numbers (the companionships
  // table only has email). Used to build group-SMS links on the dashboard.
  const { companionships: rosterComps } = getRoster();
  const rosterByCompId = new Map((rosterComps || []).map((rc) => [rc.id, rc]));

  const statusFor = (comp) => {
    const b = latestBookingByComp.get(comp.id);
    if (!b) return 'pending';
    return b.status === 'completed' ? 'completed' : 'booked';
  };

  const base = (process.env.PUBLIC_BASE_URL || 'https://church-scheduler-tawny.vercel.app').replace(/\/$/, '');

  const companionships_status = comps.map((comp) => {
    const b = latestBookingByComp.get(comp.id);
    const leader = leaderById.get(comp.leader_id);
    const booking_time = b
      ? (b.slot_id ? slotTimeById.get(b.slot_id) : b.window_id ? windowTimeById.get(b.window_id) : null)
      : null;
    const rosterComp = rosterByCompId.get(comp.id);
    const { companion_1, companion_2 } = splitCompanions(rosterComp?.companions || []);
    return {
      id: comp.id,
      elder1_name: comp.companion1_name || '',
      elder2_name: comp.companion2_name || '',
      companion1_phone: companion_1?.phone || '',
      companion2_phone: companion_2?.phone || '',
      leader_name: leader?.name || '',
      leader_id: comp.leader_id || null,
      status: statusFor(comp),
      booking_id: b?.id || null,
      booking_date: b?.scheduled_date || null,
      booking_time: booking_time || null,
      unique_booking_url: `${base}/book?companionship=${encodeURIComponent(comp.id)}`,
      slug: comp.id,
    };
  });

  return { leaders, comps, bookings, slots, windows, companionships_status, statusFor };
}


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- Google OAuth helpers ---

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function oauthCookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeMs,
  };
}

function clearOAuthCookies(res) {
  const opts = { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' };
  res.clearCookie('oauth_state', opts);
  res.clearCookie('oauth_user_id', opts);
}

// GET /api/auth/google/start — returns the Google consent URL (auth required)
app.get('/api/auth/google/start', requireAuth, (req, res) => {
  try {
    const state = crypto.randomBytes(24).toString('hex');
    const url = buildAuthUrl(state);
    const opts = oauthCookieOptions(10 * 60 * 1000);
    res.cookie('oauth_state', state, opts);
    res.cookie('oauth_user_id', req.user.id, opts);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/google/callback — exchange code, persist tokens, redirect to /settings
app.get('/api/auth/google/callback', async (req, res) => {
  const cookies = parseCookies(req);
  const { code, state, error } = req.query;

  if (error) {
    clearOAuthCookies(res);
    return res.redirect(`/settings?connected=false&error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    clearOAuthCookies(res);
    return res.redirect(`/settings?connected=false&error=${encodeURIComponent('missing authorization code')}`);
  }
  if (state !== cookies.oauth_state) {
    clearOAuthCookies(res);
    return res.redirect(`/settings?connected=false&error=${encodeURIComponent('state mismatch')}`);
  }

  const userId = cookies.oauth_user_id;
  if (!userId) {
    clearOAuthCookies(res);
    return res.redirect(`/settings?connected=false&error=${encodeURIComponent('missing user session')}`);
  }

  try {
    const tokens = await exchangeCode(code);
    const email = await getTokenEmail(tokens.access_token);

    const row = {
      user_id: userId,
      email,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scopes: GOOGLE_SCOPES,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert(row, { onConflict: 'user_id' });

    clearOAuthCookies(res);
    if (upsertError) {
      return res.redirect(`/settings?connected=false&error=${encodeURIComponent(upsertError.message)}`);
    }
    return res.redirect('/settings?connected=true');
  } catch (err) {
    clearOAuthCookies(res);
    return res.redirect(`/settings?connected=false&error=${encodeURIComponent(err.message)}`);
  }
});

// GET /api/auth/google/status — current connection status for the logged-in leader
app.get('/api/auth/google/status', requireAuth, async (req, res) => {
  try {
    const { data: tokenRow } = await supabaseAdmin
      .from('oauth_tokens')
      .select('id, email, provider, scopes, updated_at')
      .eq('user_id', req.user.id)
      .maybeSingle();

    res.json({
      connected: !!tokenRow,
      email: tokenRow?.email || req.user.email,
      provider: tokenRow?.provider || 'google',
      scopes: tokenRow?.scopes || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/google/disconnect — revoke tokens and delete the row
app.post('/api/auth/google/disconnect', requireAuth, async (req, res) => {
  try {
    const { data: tokenRow } = await supabaseAdmin
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (tokenRow?.access_token) {
      try {
        await revokeToken(tokenRow.access_token);
      } catch (err) {
        console.error('Token revoke failed (continuing to delete row):', err.message);
      }
    }

    await supabaseAdmin.from('oauth_tokens').delete().eq('user_id', req.user.id);
    res.json({ disconnected: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/google/test-invite — send a test calendar invite + email to self
app.post('/api/auth/google/test-invite', requireAuth, async (req, res) => {
  try {
    const { data: tokenRow } = await supabaseAdmin
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!tokenRow) {
      return res.status(400).json({ error: 'No Google account connected' });
    }

    const oauth2 = authorizedClient(tokenRow);
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    let calendarResult = 'sent';
    let emailResult = 'sent';

    try {
      await createCalendarEvent(oauth2, {
        summary: 'EQ Scheduler — Test Invite',
        description: 'This is a test event from the EQ Scheduler settings page.',
        date,
        time,
        durationMinutes: 15,
        attendees: [req.user.email],
      });
    } catch (err) {
      calendarResult = `failed: ${err.message}`;
    }

    try {
      await sendEmail(oauth2, {
        to: req.user.email,
        subject: 'EQ Scheduler — Test Email',
        body: 'This is a test email from the EQ Scheduler settings page.',
      });
    } catch (err) {
      emailResult = `failed: ${err.message}`;
    }

    res.json({ calendar: calendarResult, email: emailResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes

// GET /api/companionships?search=
app.get('/api/companionships', async (req, res) => {
  const { search } = req.query;

  try {
    let query = supabase.from('companionships').select('*, leaders(name)');
    if (search) {
      query = query.or(`companion1_name.ilike.%${search}%,companion2_name.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/companions?ward=long-valley-2nd-ward — auth-gated companion roster
// grouped by district, with companionship pair info.
//
// Privacy policy (PII): this roster carries companion phone + email and the
// presidency member's contact info. Only admins receive the full rows; all
// other authenticated callers (leaders + companions) get name + district +
// assigned presidency member id, with phone/email stripped. The Chapel
// companion picker only needs names for self-identification; a companion's own
// presidency member contact comes from GET /api/availability/:leaderId.
app.get('/api/companions', requireSession, async (req, res) => {
  const ward = String(req.query.ward || 'long-valley-2nd-ward').trim();
  const isAdmin = req.user?.role === 'admin';
  try {
    const { companionships, presidencyByDistrict } = getRoster();

    // Enrich with the DB leader_id (assigned presidency member id). The static
    // roster only carries the presidency member's name; the companionships table
    // holds the authoritative leader_id used for routing submissions.
    let leaderById = new Map();
    const { data: dbComps, error: dbErr } = await supabase
      .from('companionships')
      .select('id, leader_id');
    if (dbErr) {
      console.error('[companions] leader_id lookup failed:', dbErr.message);
    } else {
      leaderById = new Map((dbComps || []).map((c) => [c.id, c.leader_id]));
    }

    const byDistrict = new Map();
    for (const comp of companionships) {
      if (!byDistrict.has(comp.district)) byDistrict.set(comp.district, []);
      byDistrict.get(comp.district).push(comp);
    }

    const districts = [...byDistrict.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([districtNumber, comps]) => {
        const presidency = presidencyByDistrict.get(districtNumber) ||
          { name: comps[0]?.presidency_member || '', email: '', phone: '' };
        const presidencyLeaderId = comps.map((c) => leaderById.get(c.id)).find(Boolean) || null;
        return {
          district_number: districtNumber,
          presidency_member: isAdmin
            ? { ...presidency, id: presidencyLeaderId }
            : { name: presidency.name, id: presidencyLeaderId },
          companionships: comps.map((comp) => {
            const { companion_1, companion_2 } = splitCompanions(comp.companions);
            return {
              id: comp.id,
              assigned_to: leaderById.get(comp.id) || null,
              companion_1: isAdmin
                ? companion_1
                : companion_1 && { name: companion_1.name },
              companion_2: isAdmin
                ? companion_2
                : companion_2 && { name: companion_2.name },
            };
          }),
        };
      });

    res.json({ ward, districts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/families?companion_name=...&companionship_id=... — the families a
// companionship ministers to, plus its assigned presidency member. Requires the
// caller to be the assigned companion for that companionship (proof of
// companionship), so ward member addresses are never exposed to unassigned users.
app.get('/api/families', requireSession, requireCompanionFor('companionship_id'), async (req, res) => {
  const { companion_name, companionship_id } = req.query;
  try {
    const { companionships, householdById, presidencyByDistrict } = getRoster();

    let comp = null;
    if (companionship_id) {
      comp = companionships.find((c) => c.id === companionship_id);
    } else if (companion_name) {
      const needle = String(companion_name).toLowerCase();
      comp = companionships.find((c) =>
        (c.companions || []).some((p) => (p.name || '').toLowerCase() === needle)
      );
    }

    if (!comp) {
      return res.status(404).json({ error: 'Companionship not found' });
    }

    const { companion_1, companion_2 } = splitCompanions(comp.companions);
    const companions = [companion_1, companion_2].filter(Boolean);

    const families = (comp.families_visited || []).map((f) => {
      const hh = householdById.get(f.household_id);
      return {
        household_id: f.household_id,
        head_name: f.head_name || '',
        address: f.address || '',
        phone: hh?.head?.phone || '',
        email: hh?.head?.email || '',
        category: f.category || '',
        members: hh?.members || [],
      };
    });

    res.json({
      companionship_id: comp.id,
      companions,
      presidency_member:
        presidencyByDistrict.get(comp.district) ||
        { name: comp.presidency_member || '', email: '', phone: '' },
      families,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chapel/submit — chapel-side companion visit submission.
// Body: { companionship_id, companion_name, families_visited?, visit_notes?,
//         preferred_slot_date?, preferred_slot_time? }
// Requires the caller to be the assigned companion for the companionship
// (requireCompanionFor matches req.user.email against companion1_email /
// companion2_email), so visit reports can't be spoofed into another leader's
// queue. Validates the companionship exists, looks up its assigned leader, and
// inserts a chapel_submissions row routed to that presidency member's queue.
app.post('/api/chapel/submit', requireSession, requireCompanionFor('companionship_id'), async (req, res) => {
  const {
    companionship_id,
    companion_name,
    families_visited,
    visit_notes,
    preferred_slot_date,
    preferred_slot_time,
  } = req.body || {};

  if (!companionship_id) {
    return res.status(400).json({ error: 'companionship_id is required' });
  }
  if (!companion_name || !String(companion_name).trim()) {
    return res.status(400).json({ error: 'companion_name is required' });
  }

  try {
    // Validate the companionship and resolve its assigned presidency member.
    const { data: comp, error: compErr } = await supabase
      .from('companionships')
      .select('id, leader_id')
      .eq('id', companionship_id)
      .maybeSingle();
    if (compErr) throw compErr;
    if (!comp) {
      return res.status(404).json({ error: 'companionship_not_found' });
    }

    const leaderId = comp.leader_id || null;

    // District number comes from the static roster (companionships table has no
    // district column); fall back to 0 if the roster and DB ever drift.
    const rosterComp = getRoster().companionships.find((c) => c.id === companionship_id);
    const districtNumber = rosterComp?.district ?? 0;

    let presidency = null;
    if (leaderId) {
      const { data: leader, error: leaderErr } = await supabase
        .from('leaders')
        .select('id, name, email, phone')
        .eq('id', leaderId)
        .maybeSingle();
      if (leaderErr) throw leaderErr;
      if (leader) {
        presidency = { name: leader.name, email: leader.email, phone: leader.phone || '' };
      }
    }

    const row = {
      companionship_id,
      companion_name: String(companion_name).trim(),
      district_number: districtNumber,
      assigned_to: leaderId,
      families_visited: families_visited || null,
      visit_notes: visit_notes || null,
      preferred_slot_date: preferred_slot_date || null,
      preferred_slot_time: preferred_slot_time || null,
    };

    const { data: inserted, error: insErr } = await supabase
      .from('chapel_submissions')
      .insert([row])
      .select()
      .single();
    if (insErr) throw insErr;

    res.status(201).json({
      ok: true,
      submission_id: inserted.id,
      submitted_at: inserted.submitted_at,
      assigned_to: leaderId,
      presidency_member: presidency || { name: '', email: '', phone: '' },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/roster — admin: full ward view (totals + by-district rollup +
// filterable household list). Query: ?district=1 &category=single &search=Walker
app.get('/api/admin/roster', requireAuth, requireAdmin, async (req, res) => {
  const { district, category, search } = req.query;
  try {
    const { ward, companionships, householdsFlat, presidencyByDistrict, districts } = getRoster();

    const totals = {
      households: householdsFlat.length,
      members: householdsFlat.reduce((sum, hh) => sum + 1 + (hh.members || []).length, 0),
      companionships: companionships.length,
    };

    const by_district = districts.map((d) => {
      const comps = companionships.filter((c) => c.district === d.district);
      const hhs = householdsFlat.filter((hh) => hh.district_number === d.district);
      return {
        district_number: d.district,
        presidency_member:
          presidencyByDistrict.get(d.district) || { name: '', email: '', phone: '' },
        companionships_count: comps.length,
        households_count: hhs.length,
        members_count: hhs.reduce((sum, hh) => sum + 1 + (hh.members || []).length, 0),
      };
    });

    let households = householdsFlat.map((hh) => ({
      household_id: hh.id,
      head_name: `${hh.head?.first_name || ''} ${hh.head?.last_name || ''}`.trim(),
      family_name: hh.family_name || '',
      address: formatAddress(hh.head),
      phone: hh.head?.phone || '',
      email: hh.head?.email || '',
      category: hh.category || '',
      district_number: hh.district_number,
      members: hh.members || [],
    }));

    if (district) {
      const dn = Number(district);
      households = households.filter((hh) => hh.district_number === dn);
    }
    if (category) {
      households = households.filter((hh) => hh.category === category);
    }
    if (search) {
      const needle = String(search).toLowerCase();
      households = households.filter((hh) => {
        const hay = [
          hh.head_name,
          hh.family_name,
          hh.address,
          hh.phone,
          hh.email,
          ...(hh.members || []).map((m) => `${m.first_name || ''} ${m.last_name || ''}`),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(needle);
      });
    }

    res.json({ ward, totals, by_district, households, unlinked_companions: getUnlinkedCompanions() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/availability/:leaderId — returns the leader's contact info plus their
// recurring weekly slots. Used by the chapel companion flow (SlotPicker) to offer
// preferred meeting times, and by the booking page.
// GET /api/admin/queue?status=pending|reviewed|completed|cancelled|all
// Presidency queue: chapel submissions routed to the current leader (or all
// submissions for admins). Counselors (role=leader) only see their own
// district's submissions (assigned_to = their leader id).
app.get('/api/admin/queue', requireAuth, async (req, res) => {
  const { status } = req.query;
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && req.user.role !== 'leader') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    let query = supabase
      .from('chapel_submissions')
      .select('*, leaders(name, email, phone)')
      .order('submitted_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Counselors (role=leader) are scoped to their own district.
    if (!isAdmin) {
      query = query.eq('assigned_to', req.user.leader_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const submissions = (data || []).map((s) => ({
      id: s.id,
      companionship_id: s.companionship_id,
      companion_name: s.companion_name,
      district_number: s.district_number,
      assigned_to: s.assigned_to,
      families_visited: s.families_visited,
      visit_notes: s.visit_notes,
      preferred_slot_date: s.preferred_slot_date,
      preferred_slot_time: s.preferred_slot_time,
      presidency_notes: s.presidency_notes,
      submitted_at: s.submitted_at,
      reviewed_at: s.reviewed_at,
      status: s.status,
      assigned_presidency_member: s.leaders
        ? { name: s.leaders.name || '', email: s.leaders.email || '', phone: s.leaders.phone || '' }
        : null,
    }));

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/queue/:id/complete — mark a submission complete with the
// presidency member's notes. Counselors may only complete their own district's
// submissions; admins may complete any.
app.post('/api/admin/queue/:id/complete', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { presidency_notes } = req.body || {};
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && req.user.role !== 'leader') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (typeof presidency_notes !== 'string' || !presidency_notes.trim()) {
    return res.status(400).json({ error: 'presidency_notes is required' });
  }

  try {
    let query = supabase
      .from('chapel_submissions')
      .update({
        status: 'completed',
        presidency_notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Counselors can only complete their own district's submissions.
    if (!isAdmin) {
      query = query.eq('assigned_to', req.user.leader_id);
    }

    const { data, error } = await query.select().maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'not_found_or_not_yours' });
    }

    res.json({ ok: true, submission: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/analytics — analytics + "who hasn't scheduled" action list.
//
// Gated by requireRole('leader') (admits admins + leaders, rejects companions),
// which authenticates via requireSession under the hood. Aggregates every
// companionship against its most recent non-cancelled booking to derive a
// per-companionship status: pending (no booking), booked, or completed.
app.get('/api/admin/analytics', requireSession, requireRole('leader'), async (req, res) => {
  try {
    const { leaders, comps, bookings, slots, windows, companionships_status, statusFor } =
      await computeRosterStatuses();

    const total_companionships = comps.length;
    const completed_count = companionships_status.filter((c) => c.status === 'completed').length;
    const booked_count = companionships_status.filter((c) => c.status === 'booked').length;
    const pending_count = companionships_status.filter((c) => c.status === 'pending').length;

    const ward_completion_rate =
      total_companionships === 0 ? 0 : Math.round((completed_count / total_companionships) * 1000) / 10;

    // Open capacity = unbooked published windows/slots. Future-dated windows and
    // recurring slots that have no non-cancelled booking are "open".
    const today = new Date().toISOString().slice(0, 10);
    const bookedWindowIds = new Set(bookings.filter((b) => b.window_id).map((b) => b.window_id));
    const bookedSlotIds = new Set(bookings.filter((b) => b.slot_id).map((b) => b.slot_id));
    const openWindows = windows.filter((w) => w.window_date >= today && !bookedWindowIds.has(w.id));
    const openSlots = slots.filter((s) => !bookedSlotIds.has(s.id));
    const open_slots_count = openWindows.length + openSlots.length;

    // District breakdown — one entry per leader with assigned companionships.
    // District leaders are the 3 presidency members (cole / kawika / sean); the
    // secretary (braden) has no companionships and drops out naturally.
    const district_breakdown = [];
    for (const leader of leaders) {
      const districtComps = comps.filter((c) => c.leader_id === leader.id);
      if (districtComps.length === 0) continue;

      let total = 0;
      let booked = 0;
      let completed = 0;
      let pending = 0;
      for (const c of districtComps) {
        total += 1;
        const st = statusFor(c);
        if (st === 'completed') completed += 1;
        else if (st === 'booked') booked += 1;
        else pending += 1;
      }

      district_breakdown.push({
        leader_id: leader.id,
        leader_name: leader.name,
        total,
        booked,
        completed,
        pending,
        completion_rate: total === 0 ? 0 : Math.round((completed / total) * 1000) / 10,
      });
    }

    res.json({
      total_companionships,
      booked_count,
      completed_count,
      pending_count,
      ward_completion_rate,
      open_slots_count,
      district_breakdown,
      companionships_status,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bookings/:id/complete — mark a scheduled interview as completed.
// Gated: admin or the leader who owns the companionship (mirrors the existing
// PUT /api/bookings/:id/status ownership scoping).
app.post('/api/bookings/:id/complete', requireSession, async (req, res) => {
  const { id } = req.params;

  try {
    // Non-admins may only complete bookings under their own companionship.
    if (req.user.role !== 'admin') {
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('companionships(leader_id)')
        .eq('id', id)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!booking || booking.companionships?.leader_id !== req.user.leader_id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.json({ ok: true, booking: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/availability/:leaderId', async (req, res) => {
  const { leaderId } = req.params;

  try {
    // Date-specific windows for the next 90 days (Chapel-side SlotPicker shows
    // a rolling 30-day strip, so 90 days gives ample headroom). Stored as plain
    // TIME (no timezone) to match the existing `slots` convention.
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const laterStr = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [leaderRes, slotsRes] = await Promise.all([
      supabase.from('leaders').select('id, name, email, phone').eq('id', leaderId).maybeSingle(),
      supabase.from('slots').select('id, day_of_week, start_time, duration_minutes').eq('leader_id', leaderId).order('day_of_week').order('start_time'),
    ]);

    if (leaderRes.error) throw leaderRes.error;
    if (slotsRes.error) throw slotsRes.error;
    if (!leaderRes.data) {
      return res.status(404).json({ error: 'leader_not_found' });
    }

    // Date-specific windows are best-effort: if the availability_windows table
    // hasn't been migrated yet (schema.sql applied via Supabase dashboard),
    // degrade to an empty list rather than 500-ing the whole availability feed.
    let windows = [];
    try {
      const windowsRes = await supabase
        .from('availability_windows')
        .select('id, leader_id, window_date, start_time, end_time, slot_duration_minutes')
        .eq('leader_id', leaderId)
        .gte('window_date', todayStr)
        .lte('window_date', laterStr)
        .order('window_date')
        .order('start_time');
      if (windowsRes.error) throw windowsRes.error;
      windows = windowsRes.data || [];
    } catch {
      windows = [];
    }

    res.json({
      leader_id: leaderRes.data.id,
      name: leaderRes.data.name,
      email: leaderRes.data.email,
      phone: leaderRes.data.phone || '',
      slots: slotsRes.data || [],
      windows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/availability/:leaderId/windows — all date-specific windows for a
// leader (no date filter). Anonymous, matching the main availability endpoint.
// Used by the AdminAvailability page to render per-date badge counts across
// any month (including past months).
app.get('/api/availability/:leaderId/windows', async (req, res) => {
  const { leaderId } = req.params;

  try {
    const { data, error } = await supabase
      .from('availability_windows')
      .select('id, leader_id, window_date, start_time, end_time, slot_duration_minutes')
      .eq('leader_id', leaderId)
      .order('window_date')
      .order('start_time');
    if (error) throw error;
    res.json({ windows: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Shared validation for a single availability window payload. Returns
// { error } on invalid input, or { value: { window_date, start_time,
// end_time, slot_duration_minutes } } with slot_duration_minutes defaulted
// to 30 and coerced to a number.
const SLOT_DURATIONS = [15, 20, 30, 45, 60];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

function validateWindowInput(input) {
  const { window_date, start_time, end_time, slot_duration_minutes } = input || {};

  if (!window_date || !start_time || !end_time) {
    return { error: 'window_date, start_time, end_time required' };
  }
  if (!DATE_RE.test(String(window_date))) {
    return { error: 'window_date must be YYYY-MM-DD' };
  }
  if (!TIME_RE.test(String(start_time)) || !TIME_RE.test(String(end_time))) {
    return { error: 'start_time / end_time must be HH:MM[:SS]' };
  }
  if (String(end_time) <= String(start_time)) {
    return { error: 'end_time must be after start_time' };
  }

  let slotDuration = 30;
  if (slot_duration_minutes !== undefined && slot_duration_minutes !== null) {
    const parsed = Number(slot_duration_minutes);
    if (!Number.isInteger(parsed) || !SLOT_DURATIONS.includes(parsed)) {
      return { error: 'slot_duration_minutes must be one of 15, 20, 30, 45, 60' };
    }
    slotDuration = parsed;
  }

  return {
    value: {
      window_date: String(window_date),
      start_time: String(start_time),
      end_time: String(end_time),
      slot_duration_minutes: slotDuration,
    },
  };
}

// POST /api/availability/:leaderId/windows — publish a date-specific window.
// Gated: admin or the leader themselves. Uses requireSession (the MOCK_AUTH-aware
// middleware) so smoke tests can exercise the auth gate.
app.post('/api/availability/:leaderId/windows', requireSession, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.leader_id !== req.params.leaderId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { leaderId } = req.params;
  const parsed = validateWindowInput(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const { data, error } = await supabase
      .from('availability_windows')
      .insert([{ leader_id: leaderId, ...parsed.value }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/availability/:leaderId/windows/batch — publish many date-specific
// windows in one call (used by the AdminAvailability "publish a month" flow).
// Gated the same as the single-window endpoint: admin or the owning leader.
app.post('/api/availability/:leaderId/windows/batch', requireSession, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.leader_id !== req.params.leaderId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { leaderId } = req.params;
  const { windows } = req.body || {};

  if (!Array.isArray(windows) || windows.length === 0) {
    return res.status(400).json({ error: 'windows must be a non-empty array' });
  }

  const rows = [];
  for (let i = 0; i < windows.length; i++) {
    const parsed = validateWindowInput(windows[i]);
    if (parsed.error) {
      return res.status(400).json({ error: `windows[${i}]: ${parsed.error}` });
    }
    rows.push({ leader_id: leaderId, ...parsed.value });
  }

  try {
    const { data, error } = await supabase
      .from('availability_windows')
      .insert(rows)
      .select();
    if (error) throw error;
    res.status(201).json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/availability/windows/:id — remove a published window.
// Gated: admin or the owning leader.
app.delete('/api/availability/windows/:id', requireSession, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    const { data: win, error: fetchErr } = await supabase
      .from('availability_windows')
      .select('leader_id')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr || !win || win.leader_id !== req.user.leader_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  try {
    const { error } = await supabase.from('availability_windows').delete().eq('id', id);
    if (error) throw error;
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bookings/all
//
// Returns all interview bookings for the dashboard. Gated by
// requireRole('leader'), which authenticates the caller (401) and admits
// admins + leaders while rejecting companions (403).
//
// Least-privilege scoping: admins see every leader's bookings; leaders see
// only bookings under their own companionship assignments. `bookings` has no
// `leader_id` column, so we scope through the `companionships` join —
// `companionships.leader_id` must equal the caller's resolved
// `req.user.leader_id` (the leaders.id text id, NOT the Supabase auth UUID in
// `req.user.id`).
app.get('/api/bookings/all', requireRole('leader'), async (req, res) => {
  try {
    let query = supabase
      .from('bookings')
      .select('*, companionships!inner(*, leaders(id, name, email, phone)), slots(*)');

    if (req.user.role !== 'admin') {
      query = query.eq('companionships.leader_id', req.user.leader_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bookings/:leaderId
app.get('/api/bookings/:leaderId', requireSession, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.leader_id !== req.params.leaderId) return res.status(403).json({ error: 'Forbidden' });
  const { leaderId } = req.params;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, companionships!inner(*, leaders(id, name, email, phone)), slots(*)')
      .eq('companionships.leader_id', leaderId);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bookings
app.post('/api/bookings', requireRole('companion'), requireCompanionFor('companionship_id'), async (req, res) => {
  const { companionship_id, slot_id, window_id, scheduled_date } = req.body;

  try {
    // Double-booking prevention: a companionship may hold only one active
    // (booked/pending) appointment at a time. Reject a second conflicting slot
    // before it is written, so the client banner is backed by a server guard.
    const active = await findActiveBooking(companionship_id);
    if (active) {
      return res.status(409).json({
        error: 'You already have an active appointment',
        active_booking_id: active.id,
      });
    }

    // A booking is anchored by either a recurring slot_id OR a date-specific
    // window_id (+ scheduled_date = the window's date). Both may not be set.
    const insert = {
      companionship_id,
      scheduled_date,
      status: 'booked',
      slot_id: slot_id || null,
      window_id: window_id || null,
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([insert])
      .select();
    if (error) throw error;
    const booking = data[0];

    // After confirmation, send calendar invite + email to the assigned leader/elder.
    // Guarded so notification failures never break the booking response.
    try {
      await handleBookingConfirmation(supabaseAdmin, booking);
    } catch (notifErr) {
      console.error('Booking notification error:', notifErr.message);
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/bookings/:id/cancel
app.put('/api/bookings/:id/cancel', requireAuth, async (req, res) => {
  const { id } = req.params;
  // Ideally we would fetch the booking first to check ownership, but let's just do it directly for simplicity or fetch it.
  if (req.user.role !== 'admin') {
    const { data: booking } = await supabase.from('bookings').select('companionships(leader_id)').eq('id', id).single();
    if (!booking || booking.companionships?.leader_id !== req.user.leader_id) return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/bookings/:id/status
app.put('/api/bookings/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    const { data: booking } = await supabase.from('bookings').select('companionships(leader_id)').eq('id', id).single();
    if (!booking || booking.companionships?.leader_id !== req.user.leader_id) return res.status(403).json({ error: 'Forbidden' });
  }
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Active-booking lookup (double-booking prevention + reschedule) ---

// Returns the companionship's most recent active booking (status 'booked' or
// 'pending'), or null. Shared by the /book active-appointment banner, the
// server-side double-booking guard, and the reschedule flow.
async function findActiveBooking(companionshipId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, companionship_id, slot_id, window_id, scheduled_date, status')
    .eq('companionship_id', companionshipId)
    .in('status', ['booked', 'pending'])
    .order('scheduled_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

// GET /api/companionships/:id/active-booking — the companionship's active
// (booked/pending) appointment with its resolved date, start time, duration,
// and assigned leader name, or { active: false } when none exists.
// Authenticated (any role) so the /book page can render the "already scheduled"
// banner for the companion, and MOCK_AUTH smoke tests can exercise it.
app.get('/api/companionships/:id/active-booking', requireSession, async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await findActiveBooking(id);

    if (!booking) {
      return res.json({ active: false, booking: null });
    }

    let scheduledDate = booking.scheduled_date;
    let startTime = null;
    let durationMinutes = 30;

    if (booking.slot_id) {
      const { data: slot } = await supabase
        .from('slots')
        .select('start_time, duration_minutes')
        .eq('id', booking.slot_id)
        .maybeSingle();
      if (slot) {
        startTime = slot.start_time;
        durationMinutes = slot.duration_minutes || 30;
      }
    } else if (booking.window_id) {
      const { data: win } = await supabase
        .from('availability_windows')
        .select('window_date, start_time, slot_duration_minutes')
        .eq('id', booking.window_id)
        .maybeSingle();
      if (win) {
        scheduledDate = win.window_date || scheduledDate;
        startTime = win.start_time;
        durationMinutes = win.slot_duration_minutes || 30;
      }
    }

    let leaderName = '';
    const { data: comp } = await supabase
      .from('companionships')
      .select('leader_id, leaders(name)')
      .eq('id', id)
      .maybeSingle();
    if (comp?.leaders?.name) leaderName = comp.leaders.name;

    res.json({
      active: true,
      booking: {
        id: booking.id,
        scheduled_date: scheduledDate,
        start_time: startTime,
        duration_minutes: durationMinutes,
        leader_name: leaderName,
        status: booking.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bookings/:id/reschedule — cancel an existing appointment so its
// slot opens back up and the companionship can pick a new date & time.
// Ownership: admin, the assigned leader, or the companion themself (email
// match). Because bookings carry no per-slot capacity counter, "releasing" a
// slot is exactly the status → 'cancelled' transition (open capacity is derived
// by excluding cancelled bookings in the analytics aggregation).
app.post('/api/bookings/:id/reschedule', requireSession, async (req, res) => {
  const { id } = req.params;

  try {
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('id, companionship_id, status, companionships(leader_id, companion1_email, companion2_email)')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!booking) return res.status(404).json({ error: 'not_found' });

    const isAdmin = req.user.role === 'admin';
    const ownsAsLeader = booking.companionships?.leader_id === req.user.leader_id;
    const email = String(req.user.email || '').toLowerCase();
    const ownsAsCompanion =
      !!booking.companionships &&
      [booking.companionships.companion1_email, booking.companionships.companion2_email].some(
        (e) => !!e && String(e).toLowerCase() === email,
      );

    if (!isAdmin && !ownsAsLeader && !ownsAsCompanion) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: updated, error: updErr } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (updErr) throw updErr;
    if (!updated) return res.status(404).json({ error: 'not_found' });

    res.json({ ok: true, released: true, booking: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/bookings — book on behalf of a companionship (Call & Book
// drawer). Admin-only; mirrors POST /api/bookings but skips the companion
// email-match gate and enforces single-active-booking server-side.
app.post('/api/admin/bookings', requireSession, requireRole('admin'), async (req, res) => {
  const { companionship_id, slot_id, window_id, scheduled_date } = req.body || {};
  if (!companionship_id || (!slot_id && !window_id)) {
    return res.status(400).json({ error: 'companionship_id and slot_id (or window_id) are required' });
  }

  try {
    const active = await findActiveBooking(companionship_id);
    if (active) {
      return res.status(409).json({
        error: 'This companionship already has an active appointment',
        active_booking_id: active.id,
      });
    }

    const insert = {
      companionship_id,
      scheduled_date,
      status: 'booked',
      slot_id: slot_id || null,
      window_id: window_id || null,
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([insert])
      .select();
    if (error) throw error;
    const booking = data[0];

    try {
      await handleBookingConfirmation(supabaseAdmin, booking);
    } catch (notifErr) {
      console.error('Booking notification error:', notifErr.message);
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/slots/:leaderId
app.get('/api/slots/:leaderId', async (req, res) => {
  const { leaderId } = req.params;

  try {
    const { data, error } = await supabase.from('slots').select('*').eq('leader_id', leaderId);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/slots/:leaderId
app.post('/api/slots/:leaderId', requireSession, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.leader_id !== req.params.leaderId) return res.status(403).json({ error: 'Forbidden' });
  const { leaderId } = req.params;
  const { day_of_week, start_time, duration_minutes } = req.body;

  try {
    const { data, error } = await supabase
      .from('slots')
      .insert([{ leader_id: leaderId, day_of_week, start_time, duration_minutes: duration_minutes || 30 }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/slots/:id
app.delete('/api/slots/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    const { data: slot } = await supabase.from('slots').select('leader_id').eq('id', id).single();
    if (!slot || slot.leader_id !== req.user.leader_id) return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { error } = await supabase.from('slots').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ward/:slug — public: returns the (single) ward context for the QR page.
// The app is single-ward today (Long Valley 2nd Ward), so no wards table exists yet.
app.get('/api/ward/:slug', async (req, res) => {
  const { slug } = req.params;
  // Humanize the slug for display; no DB lookup needed until a wards table exists.
  const name = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  res.json({ slug, name });
});

// POST /api/qr/request — elder/companionship submits an interview request.
// Inserts a pending row, then triggers auto-assignment.
app.post('/api/qr/request', async (req, res) => {
  const { companionship_id, notes } = req.body || {};

  try {
    const { data, error } = await supabase
      .from('qr_requests')
      .insert([{ companionship_id: companionship_id || null, notes: notes || null }])
      .select()
      .single();
    if (error) throw error;

    // Auto-assign the new request (non-fatal if routing fails).
    let assignment = null;
    try {
      assignment = await assignNextPending(supabase);
    } catch (err) {
      console.error('[qr] auto-assign failed:', err.message);
    }

    res.status(201).json({ ok: true, request: data, assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/qr/assign-next — assign the oldest pending request to the
// presidency member with the fewest active assignments.
app.post('/api/qr/assign-next', async (req, res) => {
  try {
    const result = await assignNextPending(supabase);
    if (result.ok === false && result.status === 409) {
      return res.status(409).json({ ok: false, error: result.error });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/qr/queue — pending + assigned (+ completed this week) for the ward.
app.get('/api/qr/queue', requireAuth, async (req, res) => {
  // Start of the current week (Sunday 00:00 local) for the "completed this week" count.
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday

  const select = `*, leaders(name), companionships(companion1_name, companion2_name, leader_id, leaders(name))`;

  try {
    const [pendingRes, assignedRes, completedRes] = await Promise.all([
      supabase.from('qr_requests').select(select).eq('status', 'pending').order('submitted_at', { ascending: true }),
      supabase.from('qr_requests').select(select).eq('status', 'assigned').order('assigned_at', { ascending: true }),
      supabase.from('qr_requests').select(select).eq('status', 'completed').gte('completed_at', startOfWeek.toISOString()).order('completed_at', { ascending: false }),
    ]);

    if (pendingRes.error) throw pendingRes.error;
    if (assignedRes.error) throw assignedRes.error;
    if (completedRes.error) throw completedRes.error;

    res.json({
      pending: pendingRes.data || [],
      assigned: assignedRes.data || [],
      completed: completedRes.data || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/qr/assign-now — admin manual override: force-assign a specific
// request to a specific leader.
app.post('/api/qr/assign-now', requireAuth, requireAdmin, async (req, res) => {
  const { request_id, leader_id } = req.body || {};
  if (!request_id || !leader_id) {
    return res.status(400).json({ error: 'request_id and leader_id are required' });
  }

  try {
    const { data, error } = await supabase
      .from('qr_requests')
      .update({ status: 'assigned', assigned_to: leader_id, assigned_at: new Date().toISOString() })
      .eq('id', request_id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'request not found' });

    res.json({ ok: true, request: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/qr/request/:id/status — transition a request (e.g. 'completed'),
// allowed for admins or the assigned leader.
app.put('/api/qr/request/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['assigned', 'completed', 'expired'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('qr_requests')
      .select('id, assigned_to')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return res.status(404).json({ ok: false, error: 'request not found' });

    // Only the assigned leader (or an admin) may transition it.
    if (req.user.role !== 'admin' && existing.assigned_to !== req.user.leader_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const patch = { status };
    if (status === 'completed') patch.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('qr_requests')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;

    res.json({ ok: true, request: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/qr/generate?target=... — returns a QR code (PNG data URL) for a given URL.
// If no target is provided, defaults to the canonical ward QR URL.
app.get('/api/qr/generate', async (req, res) => {
  let target = req.query.target;
  if (!target) {
    const slug = await getWardSlug();
    const base = process.env.PUBLIC_BASE_URL || 'https://church-scheduler-tawny.vercel.app';
    target = `${base.replace(/\/$/, '')}/q/${encodeURIComponent(slug)}`;
  }
  try {
    const dataUrl = await QRCode.toDataURL(target, { width: 400, margin: 2 });
    res.json({ ok: true, url: target, dataUrl });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/ward — returns the canonical ward slug + the canonical QR URL.
// Public endpoint (no auth) so the QREntry page and Admin page can both use it.
app.get('/api/ward', async (req, res) => {
  try {
    const slug = await getWardSlug();
    const base = process.env.PUBLIC_BASE_URL || 'https://church-scheduler-tawny.vercel.app';
    const qrUrl = `${base.replace(/\/$/, '')}/q/${encodeURIComponent(slug)}`;
    res.json({ ok: true, slug, qrUrl, defaultSlug: getDefaultWardSlug() });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/admin/welcome-links — 1-click text templates for the three presidency
// interviewers (Cole, Kawika, Sean) that deep-link into their availability
// calendar. Admin-only (the ward secretary sends these out at the start of a
// quarter). Names/roles fall back to the static mapping when the DB is down.
app.get('/api/admin/welcome-links', requireSession, requireRole('admin'), async (req, res) => {
  try {
    const base = (process.env.PUBLIC_BASE_URL || 'https://church-scheduler-tawny.vercel.app').replace(/\/$/, '');

    let byId = new Map();
    try {
      const { data: leaders, error } = await supabase
        .from('leaders')
        .select('id, name, email')
        .in('id', WELCOME_LEADERS.map((w) => w.id));
      if (!error) byId = new Map((leaders || []).map((l) => [l.id, l]));
    } catch {
      // DB unavailable — fall through to static names/roles below.
    }

    const links = WELCOME_LEADERS.map((wl) => {
      const db = byId.get(wl.id) || {};
      const name = db.name || wl.name;
      const email = db.email || '';
      const availabilityUrl = `${base}/admin/availability`;
      const smsText = `Hi ${name.split(' ')[0]}, set your EQ interview availability for the quarter here: ${availabilityUrl}`;
      return {
        id: wl.id,
        name,
        role_title: wl.role_title,
        district: wl.district,
        email,
        availability_url: availabilityUrl,
        sms_text: smsText,
        sms_href: `sms:?&body=${encodeURIComponent(smsText)}`,
      };
    });

    res.json({ leaders: links });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/add-admin — grant the admin role to an email address (add a
// Co-Admin / Secretary). If a leaders row already exists for the email, promote
// it in place; otherwise insert a new secretary row (id derived from the email
// local part). Admin-only.
app.post('/api/admin/add-admin', requireSession, requireRole('admin'), async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  try {
    const { data: existing, error: lookupErr } = await supabase
      .from('leaders')
      .select('id, name, email, role')
      .ilike('email', email)
      .maybeSingle();
    if (lookupErr) throw lookupErr;

    if (existing) {
      const { data: updated, error: updErr } = await supabase
        .from('leaders')
        .update({ role: 'admin', active: true })
        .eq('id', existing.id)
        .select('id, name, email, role')
        .maybeSingle();
      if (updErr) throw updErr;
      return res.json({ ok: true, leader: updated, created: false });
    }

    const local = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    let id = local || `admin-${crypto.randomBytes(4).toString('hex')}`;

    // Avoid a primary-key collision if a different leader already uses this id.
    const { data: idTaken } = await supabase.from('leaders').select('id').eq('id', id).maybeSingle();
    if (idTaken) id = `${id}-${crypto.randomBytes(3).toString('hex')}`;

    const name =
      email
        .split('@')[0]
        .split(/[._-]/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ') || 'Secretary';

    const { data: inserted, error: insErr } = await supabase
      .from('leaders')
      .insert([{ id, name, email, role: 'admin', active: true }])
      .select('id, name, email, role')
      .maybeSingle();
    if (insErr) throw insErr;

    res.status(201).json({ ok: true, leader: inserted, created: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/export.csv — downloadable CSV of interview progress.
// Columns: District, Leader, Companion 1, Companion 2, Status, Scheduled Date,
// Scheduled Time. Gated by requireRole('leader') (admits admins + presidency),
// which authenticates via requireSession under the hood (MOCK_AUTH-aware).
app.get('/api/admin/export.csv', requireSession, requireRole('leader'), async (req, res) => {
  try {
    const { companionships_status } = await computeRosterStatuses();

    const rows = [
      ['District', 'Leader', 'Companion 1', 'Companion 2', 'Status', 'Scheduled Date', 'Scheduled Time'],
    ];
    for (const c of companionships_status) {
      rows.push([
        (c.leader_id && LEADER_DISTRICT[c.leader_id]) || '',
        c.leader_name,
        c.elder1_name,
        c.elder2_name,
        STATUS_LABEL[c.status] || c.status,
        c.booking_date || '',
        c.booking_time ? String(c.booking_time).slice(0, 5) : '',
      ]);
    }

    // BOM so Excel/Sheets open UTF-8 names correctly.
    const csv = `\uFEFF${rows.map((r) => r.map(csvCell).join(',')).join('\n')}\n`;

    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="interview-progress.csv"');
    res.set('Cache-Control', 'no-store');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/import-roster — import a fresh ward roster CSV and upsert
// companionships by name pair / email, preserving existing ids so historical
// bookings survive (bookings FK is ON DELETE CASCADE, so we never delete — only
// update or insert). Accepts the CSV as a JSON body ({ csv: "..." }) or a raw
// text/csv body. Columns: Companion 1, Companion 2, Assigned Leader / District,
// Companion 1 Email, Companion 2 Email. Returns { added, updated, total }.
app.post(
  '/api/admin/import-roster',
  requireSession,
  requireRole('admin'),
  express.text({ type: ['text/csv', 'text/plain'] }),
  async (req, res) => {
    let csvText = '';
    if (typeof req.body === 'string') {
      csvText = req.body;
    } else if (req.body && typeof req.body.csv === 'string') {
      csvText = req.body.csv;
    }

    if (!csvText || !String(csvText).trim()) {
      return res.status(400).json({ error: 'No CSV data provided. Send { csv: "..." } or a text/csv body.' });
    }

    try {
      const parsed = parseCsv(csvText);
      if (parsed.length === 0) {
        return res.status(400).json({ error: 'CSV contained no data rows.' });
      }

      const { columns, dataRows } = mapColumns(parsed);
      if (columns.companion1_name === -1) {
        return res.status(400).json({ error: 'CSV must include a Companion 1 column.' });
      }

      const rows = dataRows
        .map((r) => ({
          companion1_name: cell(r, columns.companion1_name),
          companion2_name: cell(r, columns.companion2_name),
          leader: cell(r, columns.leader),
          companion1_email: cell(r, columns.companion1_email),
          companion2_email: cell(r, columns.companion2_email),
        }))
        .filter((r) => String(r.companion1_name || '').trim() !== '');

      if (rows.length === 0) {
        return res.status(400).json({ error: 'No valid rows — each row needs at least a Companion 1 name.' });
      }

      // Load leaders + existing companionships once, then upsert row-by-row.
      const [leadersRes, compsRes] = await Promise.all([
        supabase.from('leaders').select('id, name'),
        supabase.from('companionships').select('id, companion1_name, companion2_name, companion1_email, companion2_email, leader_id'),
      ]);
      if (leadersRes.error) throw leadersRes.error;
      if (compsRes.error) throw compsRes.error;

      const byName = new Map((leadersRes.data || []).map((l) => [normName(l.name), l.id]));

      const index = new Map();
      for (const comp of compsRes.data || []) {
        for (const key of existingMatchKeys(comp)) {
          if (!index.has(key)) index.set(key, comp);
        }
      }

      let added = 0;
      let updated = 0;

      for (const row of rows) {
        const leaderId = resolveLeaderId(row.leader, byName);
        const match = matchExisting(index, row);

        if (match) {
          // Update in place so the companionship id (and its bookings) survive.
          // Emails are only touched when the CSV provides them, so a name-only
          // directory export never wipes existing contact info.
          const patch = {
            leader_id: leaderId ?? null,
            companion1_name: String(row.companion1_name).trim(),
            companion2_name: String(row.companion2_name || '').trim() || null,
          };
          if (row.companion1_email) patch.companion1_email = row.companion1_email;
          if (row.companion2_email) patch.companion2_email = row.companion2_email;
          const { error } = await supabase.from('companionships').update(patch).eq('id', match.id);
          if (error) throw error;
          updated += 1;
        } else {
          const insert = {
            leader_id: leaderId ?? null,
            companion1_name: String(row.companion1_name).trim(),
            companion2_name: String(row.companion2_name || '').trim() || null,
            companion1_email: row.companion1_email || null,
            companion2_email: row.companion2_email || null,
          };
          const { error } = await supabase.from('companionships').insert([insert]);
          if (error) throw error;
          added += 1;
        }
      }

      res.json({ added, updated, total: rows.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});

export default app;
// POST /api/companionships (Admin)
app.post('/api/companionships', requireAuth, requireAdmin, async (req, res) => {
  const { leader_id, companion1_name, companion2_name, companion1_email, companion2_email } = req.body;
  try {
    const { data, error } = await supabase
      .from('companionships')
      .insert([{
        leader_id: leader_id || null,
        companion1_name,
        companion2_name: companion2_name || null,
        companion1_email: companion1_email || null,
        companion2_email: companion2_email || null,
      }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leaders
// NOTE: ical_token is intentionally excluded — it is a secret and must never
// be returned to unauthenticated callers. The current leader's own token is
// available via GET /api/me/ical-token (auth-gated).
app.get('/api/leaders', requireRole('leader'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaders')
      .select('id, name, email, google_calendar_id, active, role, phone');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/me/ical-token — returns the current leader's own iCal token.
// Auth-gated so tokens are never exposed via the public /api/leaders list.
app.get('/api/me/ical-token', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaders')
      .select('ical_token')
      .eq('id', req.user.leader_id)
      .maybeSingle();
    if (error) throw error;
    res.json({ ical_token: data?.ical_token || null });
  } catch (error) {
    console.error('ical-token lookup error:', error.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/leader/:leaderId/ical-token — returns a specific leader's iCal token.
// Admins may fetch any leader's token (to build that leader's subscription URL);
// non-admins may only fetch their own. Uses requireSession so MOCK_AUTH smoke
// tests can exercise the admin path without a real token round-trip.
app.get('/api/leader/:leaderId/ical-token', requireSession, async (req, res) => {
  const { leaderId } = req.params;
  if (req.user.role !== 'admin' && req.user.leader_id !== leaderId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { data, error } = await supabase
      .from('leaders')
      .select('ical_token')
      .eq('id', leaderId)
      .maybeSingle();
    if (error) throw error;
    res.json({ ical_token: data?.ical_token || null });
  } catch (error) {
    console.error('ical-token lookup error:', error.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// --- iCal subscription feed (RFC 5545) ---

// Leaders who see every submission (admin view). Counselors are scoped to
// their own assigned_to. Keyed by leader id, matching the task spec.
const ICAL_ADMIN_LEADERS = new Set(['cole', 'braden']);

const ICAL_ROLE_LABELS = {
  cole: 'Elders Quorum President',
  kawika: 'Elders Quorum Counselor',
  sean: 'Elders Quorum Counselor',
  braden: 'Ward Secretary / Admin',
};

function icalEscape(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

// Fold a logical line at 75 octets, inserting a leading space on continuations.
function icalFold(line) {
  const MAX = 75;
  if (Buffer.byteLength(line, 'utf8') <= MAX) return line;
  const parts = [];
  let current = '';
  let currentBytes = 0;
  for (const ch of line) {
    const chBytes = Buffer.byteLength(ch, 'utf8');
    if (currentBytes + chBytes > MAX) {
      parts.push(current);
      current = ` ${ch}`;
      currentBytes = 1 + chBytes;
    } else {
      current += ch;
      currentBytes += chBytes;
    }
  }
  if (current) parts.push(current);
  return parts.join('\n');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function icalUtcStamp(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
}

function parseDateParts(dateStr) {
  const [y, mo, d] = String(dateStr).split('-').map(Number);
  return { y, mo, d };
}

function dateToIcal(dateStr) {
  const { y, mo, d } = parseDateParts(dateStr);
  return `${y}${pad2(mo)}${pad2(d)}`;
}

function datePlusDays(dateStr, days) {
  const { y, mo, d } = parseDateParts(dateStr);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}${pad2(dt.getUTCMonth() + 1)}${pad2(dt.getUTCDate())}`;
}

function timeToIcal(timeStr) {
  const [h, m, s] = String(timeStr).split(':').map((n) => Number(n) || 0);
  return `${pad2(h)}${pad2(m)}${pad2(s)}`;
}

function dateTimePlusMinutes(dateStr, timeStr, minutes) {
  const { y, mo, d } = parseDateParts(dateStr);
  const [h, m, s] = String(timeStr).split(':').map((n) => Number(n) || 0);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, m, s));
  dt.setUTCMinutes(dt.getUTCMinutes() + minutes);
  return `${dt.getUTCFullYear()}${pad2(dt.getUTCMonth() + 1)}${pad2(dt.getUTCDate())}T${pad2(dt.getUTCHours())}${pad2(dt.getUTCMinutes())}${pad2(dt.getUTCSeconds())}`;
}

function icalFamilies(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return Object.values(raw);
  return [];
}

function icalFamilyName(f) {
  if (!f || typeof f !== 'object') return 'Family';
  return f.name || f.family_name || f.head_name || 'Family';
}

// The "other" companion in the pair (the one who didn't submit).
function icalCompanion2(submission, comp) {
  const submitter = String(submission.companion_name || '').trim();
  const c1 = String(comp?.companion1_name || '').trim();
  const c2 = String(comp?.companion2_name || '').trim();
  if (c1 && c1 === submitter) return c2 || null;
  if (c2 && c2 === submitter) return c1 || null;
  return null;
}

function buildVEvent(s) {
  const date = s.preferred_slot_date;
  const time = s.preferred_slot_time;
  const stamp = icalUtcStamp(s.submitted_at) || icalUtcStamp(new Date().toISOString());

  const lines = [];
  lines.push(icalFold('BEGIN:VEVENT'));
  lines.push(icalFold(`UID:${s.id}@church-scheduler`));
  lines.push(icalFold(`DTSTAMP:${stamp}`));

  if (time) {
    lines.push(icalFold(`DTSTART:${dateToIcal(date)}T${timeToIcal(time)}`));
    lines.push(icalFold(`DTEND:${dateTimePlusMinutes(date, time, 30)}`));
  } else {
    // No time → all-day event spanning the preferred date (DTEND = next day).
    lines.push(icalFold(`DTSTART;VALUE=DATE:${dateToIcal(date)}`));
    lines.push(icalFold(`DTEND;VALUE=DATE:${datePlusDays(date, 1)}`));
  }

  let summary = `Interview: ${s.companion_name || 'Companionship'}`;
  const c2 = icalCompanion2(s, s.companionships);
  if (c2) summary = `${summary} with ${c2}`;
  lines.push(icalFold(`SUMMARY:${icalEscape(summary)}`));

  const families = icalFamilies(s.families_visited)
    .map(icalFamilyName)
    .filter(Boolean)
    .join(', ');
  const description = [
    s.visit_notes || '',
    `Families visited: ${families}`,
    `Status: ${s.status}`,
  ].join('\n\n');
  lines.push(icalFold(`DESCRIPTION:${icalEscape(description)}`));

  lines.push(icalFold(`LAST-MODIFIED:${stamp}`));
  lines.push(icalFold('STATUS:CONFIRMED'));
  lines.push(icalFold('END:VEVENT'));
  return lines.join('\n');
}

function buildCalendar(leader, submissions) {
  const name = leader.name || leader.id;
  const roleLabel = ICAL_ROLE_LABELS[leader.id] || 'Elders Quorum Presidency';
  const calName = `${name} — Presidency Interviews`;
  const calDesc = `Ministering interviews — ${name} (${roleLabel})`;

  const lines = [];
  lines.push(icalFold('BEGIN:VCALENDAR'));
  lines.push(icalFold('VERSION:2.0'));
  lines.push(icalFold('PRODID:-//Church Scheduler//EN'));
  lines.push(icalFold('CALSCALE:GREGORIAN'));
  lines.push(icalFold('METHOD:PUBLISH'));
  lines.push(icalFold(`X-WR-CALNAME:${icalEscape(calName)}`));
  lines.push(icalFold(`X-WR-CALDESC:${icalEscape(calDesc)}`));

  for (const s of submissions) {
    lines.push(buildVEvent(s));
  }

  lines.push(icalFold('END:VCALENDAR'));
  return `${lines.join('\n')}\n`;
}

// Constant-time token comparison. Hashing normalizes length so
// crypto.timingSafeEqual (which requires equal-length buffers) never throws,
// and avoids the short-circuit timing oracle of the plain `!==` operator.
function icalTokenMatches(stored, provided) {
  const a = crypto.createHash('sha256').update(String(stored ?? '')).digest();
  const b = crypto.createHash('sha256').update(String(provided ?? '')).digest();
  return crypto.timingSafeEqual(a, b);
}

// GET /api/cal/:leader_id.ics?key=TOKEN — personal iCal subscription feed.
// Token-authenticated (no OAuth). Counselors see only their own submissions;
// admins (cole/braden) see every submission. Cancelled + undated submissions
// are skipped.
app.get('/api/cal/:leader_id.ics', async (req, res) => {
  const { leader_id } = req.params;
  const { key } = req.query;

  if (!key) {
    return res.status(401).type('text/plain').send('Unauthorized');
  }

  try {
    const { data: leader, error: leaderErr } = await supabase
      .from('leaders')
      .select('id, name, ical_token')
      .eq('id', leader_id)
      .maybeSingle();
    if (leaderErr) throw leaderErr;
    if (!leader) {
      return res.status(404).type('text/plain').send('Not found');
    }
    if (!leader.ical_token || !icalTokenMatches(leader.ical_token, key)) {
      return res.status(401).type('text/plain').send('Unauthorized');
    }

    let query = supabase
      .from('chapel_submissions')
      .select('*, companionships(companion1_name, companion2_name)')
      .neq('status', 'cancelled')
      .not('preferred_slot_date', 'is', null)
      .order('preferred_slot_date', { ascending: true });

    if (!ICAL_ADMIN_LEADERS.has(leader_id)) {
      query = query.eq('assigned_to', leader_id);
    }

    const { data: submissions, error: subErr } = await query;
    if (subErr) throw subErr;

    const ical = buildCalendar(leader, submissions || []);

    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', `inline; filename="${leader_id}.ics"`);
    res.set('Cache-Control', 'no-cache');
    res.send(ical);
  } catch (error) {
    console.error('ical feed error:', error.message);
    res.status(500).type('text/plain').send('Internal error');
  }
});
