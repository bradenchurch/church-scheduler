import { addDaysISO, todayInTimeZone } from '../shared/availability.js';
import { hiddenLegacyLeaderIds } from './availability.js';

export const PUBLIC_SLOT_COLUMNS = 'id, leader_id, day_of_week, start_time, duration_minutes';
export const PUBLIC_AVAILABILITY_SLOT_COLUMNS = 'id, day_of_week, start_time, duration_minutes';
export const PUBLIC_WINDOW_COLUMNS = 'id, leader_id, window_date, start_time, end_time, slot_duration_minutes';
export const PUBLIC_COMPANIONSHIP_COLUMNS = 'id, leader_id, companion1_name, companion2_name, leaders(name)';

function pick(row, keys) {
  const out = {};
  for (const key of keys) {
    if (row && Object.prototype.hasOwnProperty.call(row, key)) out[key] = row[key];
  }
  return out;
}

export function publicSlot(row, { includeLeaderId = true } = {}) {
  const keys = includeLeaderId
    ? ['id', 'leader_id', 'day_of_week', 'start_time', 'duration_minutes']
    : ['id', 'day_of_week', 'start_time', 'duration_minutes'];
  return pick(row, keys);
}

export function publicWindow(row) {
  return pick(row, ['id', 'leader_id', 'window_date', 'start_time', 'end_time', 'slot_duration_minutes']);
}

export function publicAvailabilityBody(leader, slots, windows) {
  return {
    leader_id: leader.id,
    name: leader.name,
    slots: (slots || []).map((row) => publicSlot(row, { includeLeaderId: false })),
    windows: (windows || []).map(publicWindow),
  };
}

export function publicCompanionship(row) {
  const leader = row?.leaders && typeof row.leaders === 'object' && !Array.isArray(row.leaders)
    ? { name: row.leaders.name }
    : null;
  return {
    id: row.id,
    leader_id: row.leader_id ?? null,
    companion1_name: row.companion1_name ?? null,
    companion2_name: row.companion2_name ?? null,
    leaders: leader,
  };
}

export function callerAssignedToLeader(email, companionships) {
  const needle = String(email || '').trim().toLowerCase();
  if (!needle) return false;
  return (companionships || []).some((row) =>
    [row.companion1_email, row.companion2_email].some(
      (value) => value && String(value).trim().toLowerCase() === needle,
    ),
  );
}

export function leaderContactBody(leader) {
  return {
    name: leader.name || '',
    email: leader.email || '',
    phone: leader.phone || '',
  };
}

export function registerPublicReadRoutes(app, { supabaseAdmin, requireSession }) {
  app.get('/api/companionships', async (req, res) => {
    const { search } = req.query;
    try {
      let query = supabaseAdmin.from('companionships').select(PUBLIC_COMPANIONSHIP_COLUMNS);
      if (search) {
        query = query.or(`companion1_name.ilike.%${search}%,companion2_name.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      res.json((data || []).map(publicCompanionship));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/availability/:leaderId/contact', requireSession, async (req, res) => {
    const { leaderId } = req.params;
    try {
      const { data: comps, error: compErr } = await supabaseAdmin
        .from('companionships')
        .select('id, leader_id, companion1_email, companion2_email')
        .eq('leader_id', leaderId);
      if (compErr) throw compErr;
      if (!callerAssignedToLeader(req.user?.email, comps)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { data: leader, error: leaderErr } = await supabaseAdmin
        .from('leaders')
        .select('id, name, email, phone')
        .eq('id', leaderId)
        .maybeSingle();
      if (leaderErr) throw leaderErr;
      if (!leader) return res.status(404).json({ error: 'leader_not_found' });
      res.json(leaderContactBody(leader));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/availability/:leaderId', async (req, res) => {
    const { leaderId } = req.params;
    try {
      const todayStr = todayInTimeZone('America/Denver');
      const laterStr = addDaysISO(todayStr, 90);

      const [leaderRes, slotsRes] = await Promise.all([
        supabaseAdmin.from('leaders').select('id, name').eq('id', leaderId).maybeSingle(),
        supabaseAdmin
          .from('slots')
          .select(PUBLIC_AVAILABILITY_SLOT_COLUMNS)
          .eq('leader_id', leaderId)
          .order('day_of_week')
          .order('start_time'),
      ]);

      if (leaderRes.error) throw leaderRes.error;
      if (slotsRes.error) throw slotsRes.error;
      if (!leaderRes.data) return res.status(404).json({ error: 'leader_not_found' });

      const hiddenLeaders = await hiddenLegacyLeaderIds(supabaseAdmin);
      const visibleSlots = hiddenLeaders.includes(leaderId) ? [] : (slotsRes.data || []);

      let windows = [];
      try {
        const windowsRes = await supabaseAdmin
          .from('availability_windows')
          .select(PUBLIC_WINDOW_COLUMNS)
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

      res.json(publicAvailabilityBody(leaderRes.data, visibleSlots, windows));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/slots/:leaderId', async (req, res) => {
    const { leaderId } = req.params;
    try {
      const { data, error } = await supabaseAdmin
        .from('slots')
        .select(PUBLIC_SLOT_COLUMNS)
        .eq('leader_id', leaderId);
      if (error) throw error;
      res.json((data || []).map((row) => publicSlot(row)));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
