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
import { getRoster, formatAddress, splitCompanions } from './roster.js';
import { requireRole, requireCompanionFor } from './middleware/auth.js';

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

// GET /api/companions?ward=long-valley-2nd-ward — public: all companionships
// grouped by district, with companionship pair info.
app.get('/api/companions', async (req, res) => {
  const ward = String(req.query.ward || 'long-valley-2nd-ward').trim();
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
          presidency_member: { ...presidency, id: presidencyLeaderId },
          companionships: comps.map((comp) => ({
            id: comp.id,
            assigned_to: leaderById.get(comp.id) || null,
            ...splitCompanions(comp.companions),
          })),
        };
      });

    res.json({ ward, districts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/families?companion_name=...&companionship_id=... — public: the
// families a companionship ministers to, plus its assigned presidency member.
app.get('/api/families', async (req, res) => {
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

// POST /api/chapel/submit — anonymous chapel-side companion visit submission.
// Body: { companionship_id, companion_name, families_visited?, visit_notes?,
//         preferred_slot_date?, preferred_slot_time? }
// Validates the companionship exists, looks up its assigned leader, and inserts
// a chapel_submissions row routed to that presidency member's queue.
app.post('/api/chapel/submit', async (req, res) => {
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

    res.json({ ward, totals, by_district, households });
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

app.get('/api/availability/:leaderId', async (req, res) => {
  const { leaderId } = req.params;

  try {
    const [leaderRes, slotsRes] = await Promise.all([
      supabase.from('leaders').select('id, name, email, phone').eq('id', leaderId).maybeSingle(),
      supabase.from('slots').select('id, day_of_week, start_time, duration_minutes').eq('leader_id', leaderId).order('day_of_week').order('start_time'),
    ]);

    if (leaderRes.error) throw leaderRes.error;
    if (slotsRes.error) throw slotsRes.error;
    if (!leaderRes.data) {
      return res.status(404).json({ error: 'leader_not_found' });
    }

    res.json({
      leader_id: leaderRes.data.id,
      name: leaderRes.data.name,
      email: leaderRes.data.email,
      phone: leaderRes.data.phone || '',
      slots: slotsRes.data || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bookings/all
app.get('/api/bookings/all', requireRole('leader'), async (req, res) => {

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, companionships!inner(*, leaders(id, name, email, phone)), slots(*)');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bookings/:leaderId
app.get('/api/bookings/:leaderId', requireAuth, async (req, res) => {
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
  const { companionship_id, slot_id, scheduled_date } = req.body;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{ companionship_id, slot_id, scheduled_date, status: 'booked' }])
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
app.post('/api/slots/:leaderId', requireAuth, async (req, res) => {
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

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});

export default app;
// POST /api/companionships (Admin)
app.post('/api/companionships', requireAuth, requireAdmin, async (req, res) => {
  const { leader_id, companion1_name, companion2_name } = req.body;
  try {
    const { data, error } = await supabase.from('companionships').insert([{ leader_id, companion1_name, companion2_name }]).select();
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
