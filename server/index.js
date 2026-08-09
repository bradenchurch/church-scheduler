import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'public-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    res.status(201).json(data[0]);
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
