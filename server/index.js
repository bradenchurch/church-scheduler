import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'public-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes

// GET /api/companionships?search=
app.get('/api/companionships', async (req, res) => {
  const { search } = req.query;

  // MOCK DATA for POC since no real DB URL provided
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    let mockData = [
      { id: '1', leader_id: 'cole', companion1_name: 'Smith', companion2_name: 'Jones', leaders: { name: 'Cole' } },
      { id: '2', leader_id: 'kawika', companion1_name: 'Davis', companion2_name: 'Miller', leaders: { name: 'Kawika' } },
      { id: '3', leader_id: 'sean', companion1_name: 'Wilson', companion2_name: 'Moore', leaders: { name: 'Sean' } }
    ];
    if (search) {
      mockData = mockData.filter(d =>
        d.companion1_name.toLowerCase().includes(search.toLowerCase()) ||
        d.companion2_name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return res.json(mockData);
  }

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

  // MOCK DATA for POC
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    return res.json([
      { id: '1', leader_id: leaderId, day_of_week: 0, start_time: '18:00', duration_minutes: 30 },
      { id: '2', leader_id: leaderId, day_of_week: 3, start_time: '19:30', duration_minutes: 30 }
    ]);
  }

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
  // MOCK DATA for POC
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    return res.json([
      { id: 'b1', companionship_id: '1', slot_id: '1', scheduled_date: '2026-08-10', status: 'completed' },
      { id: 'b2', companionship_id: '2', slot_id: '2', scheduled_date: '2026-08-11', status: 'booked' },
      { id: 'b3', companionship_id: '3', slot_id: '3', scheduled_date: '2026-08-12', status: 'pending' }
    ]);
  }

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
app.get('/api/bookings/:leaderId', async (req, res) => {
  const { leaderId } = req.params;

  // MOCK DATA for POC
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    return res.json([
      { id: 'b1', companionship_id: '1', slot_id: '1', scheduled_date: '2026-08-10', status: 'booked', companionships: { companion1_name: 'Smith', companion2_name: 'Jones', leader_id: leaderId }, slots: { start_time: '18:00' } }
    ]);
  }

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

  // MOCK DATA for POC
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    return res.status(201).json({ id: 'mock-id', companionship_id, slot_id, scheduled_date, status: 'booked' });
  }

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
app.put('/api/bookings/:id/cancel', async (req, res) => {
  const { id } = req.params;

  // MOCK DATA for POC
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    return res.json({ id, status: 'cancelled' });
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
app.put('/api/bookings/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // MOCK DATA for POC
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    return res.json({ id, status });
  }

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

  // MOCK DATA for POC
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    return res.json([
      { id: '1', leader_id: leaderId, day_of_week: 0, start_time: '18:00', duration_minutes: 30 },
      { id: '2', leader_id: leaderId, day_of_week: 3, start_time: '19:30', duration_minutes: 30 }
    ]);
  }

  try {
    const { data, error } = await supabase.from('slots').select('*').eq('leader_id', leaderId);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/slots/:leaderId
app.post('/api/slots/:leaderId', async (req, res) => {
  const { leaderId } = req.params;
  const { day_of_week, start_time, duration_minutes } = req.body;

  // MOCK DATA for POC
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    return res.status(201).json({ id: Date.now().toString(), leader_id: leaderId, day_of_week, start_time, duration_minutes: duration_minutes || 30 });
  }

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
app.delete('/api/slots/:id', async (req, res) => {
  const { id } = req.params;

  // MOCK DATA for POC
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    return res.status(204).send();
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
app.post('/api/companionships', async (req, res) => {
  const { leader_id, companion1_name, companion2_name } = req.body;
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    return res.status(201).json({ id: Date.now().toString(), leader_id, companion1_name, companion2_name });
  }
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
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://example.supabase.co') {
    return res.json([{id: 'cole', name: 'Cole'}, {id: 'kawika', name: 'Kawika'}, {id: 'sean', name: 'Sean'}]);
  }
  try {
    const { data, error } = await supabase.from('leaders').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
