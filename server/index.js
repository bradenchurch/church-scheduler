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

// GET /api/availability/:leaderId?date=
app.get('/api/availability/:leaderId', async (req, res) => {
  const { leaderId } = req.params;
  const { date } = req.query; // optional date filter

  try {
    // Get all slots for leader
    let slotsQuery = supabase.from('slots').select('*').eq('leader_id', leaderId);

    // Get all bookings for leader to find taken slots
    let bookingsQuery = supabase.from('bookings')
      .select('slot_id, scheduled_date')
      .in('status', ['pending', 'booked'])
      .not('slot_id', 'is', null);

    // Join not fully supported without relation on non-fk, so we filter in app
    // For a real app, maybe a more complex join. Here we just fetch slots and taken bookings.

    const [slotsRes, bookingsRes] = await Promise.all([slotsQuery, bookingsQuery]);

    if (slotsRes.error) throw slotsRes.error;
    if (bookingsRes.error) throw bookingsRes.error;

    // Filter out slots that are already booked for the given date (if date provided)
    // Actually, "availability" usually returns all slots with an indicator, or just available ones.
    // The requirement is simple: GET /api/availability/:leaderId
    // Let's just return slots. The client can filter if needed, or we filter out if date matches.
    let availableSlots = slotsRes.data;
    if (date) {
      const takenSlotIds = bookingsRes.data
        .filter(b => b.scheduled_date === date)
        .map(b => b.slot_id);
      availableSlots = availableSlots.filter(s => !takenSlotIds.includes(s.id));
    }

    res.json(availableSlots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bookings/all
app.get('/api/bookings/all', async (req, res) => {

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, companionships!inner(*, leaders(*)), slots(*)');
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
      .select('*, companionships!inner(*, leaders(*)), slots(*)')
      .eq('companionships.leader_id', leaderId);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bookings
app.post('/api/bookings', async (req, res) => {
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
    const base = process.env.PUBLIC_BASE_URL || 'https://church-scheduler.vercel.app';
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
    const base = process.env.PUBLIC_BASE_URL || 'https://church-scheduler.vercel.app';
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
app.get('/api/leaders', async (req, res) => {
  try {
    const { data, error } = await supabase.from('leaders').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
