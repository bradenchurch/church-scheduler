import {
  classify,
  collapseMerges,
  dedupeExact,
  formatTime12,
  isUuid,
  timeKey,
  validateWindowInput,
  WEEKDAY_LONG,
  weekdayIndex,
} from '../shared/availability.js';

const FULL_COLUMNS = 'id, leader_id, window_date, start_time, end_time, slot_duration_minutes, buffer_minutes, series_id, created_at';
const NO_SERIES_COLUMNS = 'id, leader_id, window_date, start_time, end_time, slot_duration_minutes, buffer_minutes, created_at';

const replayMemory = new Map();
const leaderChains = new Map();
const REPLAY_TTL_MS = 30 * 60 * 1000;

function isMissingColumn(error, column) {
  if (!error) return false;
  const message = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`;
  return error.code === '42703' || error.code === 'PGRST204' || message.toLowerCase().includes(column.toLowerCase());
}

function isNoConflictTarget(error) {
  if (!error) return false;
  const message = `${error.message || ''}`;
  return error.code === '42P10' || /on conflict|42P10/i.test(message);
}

function isExclusionViolation(error) {
  return error?.code === '23P01' || /23P01|exclusion/i.test(error?.message || '');
}

function isUniqueViolation(error) {
  return error?.code === '23505' || /23505|duplicate key/i.test(error?.message || '');
}

function isMissingFunction(error) {
  if (!error) return false;
  const message = `${error.message || ''} ${error.details || ''}`;
  return error.code === 'PGRST202' || error.code === '42883' || /could not find the function/i.test(message);
}

function withLeaderLock(leaderId, fn) {
  const prev = leaderChains.get(leaderId) || Promise.resolve();
  const run = prev.catch(() => {}).then(fn);
  leaderChains.set(leaderId, run.finally(() => {
    if (leaderChains.get(leaderId) === run) leaderChains.delete(leaderId);
  }));
  return run;
}

export function resetAvailabilityMemory() {
  replayMemory.clear();
  leaderChains.clear();
}

function rememberReplay(leaderId, seriesId, body) {
  if (!seriesId) return;
  replayMemory.set(`${leaderId}:${seriesId}`, { at: Date.now(), body });
}

function recallReplay(leaderId, seriesId) {
  const key = `${leaderId}:${seriesId}`;
  const hit = replayMemory.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > REPLAY_TTL_MS) {
    replayMemory.delete(key);
    return null;
  }
  return hit.body;
}

function plainCount(n, noun) {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

function bookedMessage(bookings) {
  const n = bookings.length;
  const times = [...new Set(bookings.map((b) => formatTime12(b.slot_time)).filter(Boolean))];
  const when = times.length ? ` at ${times.join(', ')}` : '';
  return `${n} visit${n === 1 ? ' is' : 's are'} booked${when}. Move or cancel them first.`;
}

export function createAvailabilityService(supabaseAdmin) {
  let caps = null;

  async function getCaps() {
    if (caps) return caps;
    const probe = await supabaseAdmin.from('availability_windows').select('series_id').limit(0);
    caps = { seriesId: !probe.error, unique: null };
    return caps;
  }

  function columnsFor(current) {
    return current.seriesId ? FULL_COLUMNS : NO_SERIES_COLUMNS;
  }

  async function listWindows(leaderId, { from, to } = {}) {
    const current = await getCaps();
    let query = supabaseAdmin
      .from('availability_windows')
      .select(columnsFor(current))
      .eq('leader_id', leaderId)
      .order('window_date')
      .order('start_time');
    if (from) query = query.gte('window_date', from);
    if (to) query = query.lte('window_date', to);
    const { data, error } = await query;
    if (error && current.seriesId && isMissingColumn(error, 'series_id')) {
      caps = { ...current, seriesId: false };
      return listWindows(leaderId, { from, to });
    }
    if (error) throw error;
    return (data || []).map((row) => ({ ...row, series_id: row.series_id || null }));
  }

  async function activeBookings(windowIds) {
    const map = new Map();
    if (!windowIds.length) return map;
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('id, window_id, slot_time, status')
      .in('window_id', windowIds)
      .in('status', ['booked', 'pending']);
    if (error) throw error;
    for (const booking of data || []) {
      const list = map.get(booking.window_id) || [];
      list.push(booking);
      map.set(booking.window_id, list);
    }
    return map;
  }

  async function insertWindows(rows) {
    const current = await getCaps();
    const payload = rows.map((row) => {
      const copy = { ...row };
      if (!current.seriesId) delete copy.series_id;
      return copy;
    });
    if (!payload.length) return { data: [], error: null };

    if (current.unique === false) {
      return supabaseAdmin.from('availability_windows').insert(payload).select(columnsFor(current));
    }

    const attempt = await supabaseAdmin
      .from('availability_windows')
      .upsert(payload, {
        onConflict: 'leader_id,window_date,start_time,end_time',
        ignoreDuplicates: true,
      })
      .select(columnsFor(current));

    if (attempt.error && isNoConflictTarget(attempt.error)) {
      caps = { ...current, unique: false };
      return supabaseAdmin.from('availability_windows').insert(payload).select(columnsFor({ seriesId: current.seriesId }));
    }
    if (!attempt.error) caps = { ...current, unique: true };
    return attempt;
  }

  async function replaceWindows({ leaderId, deleteIds, rows }) {
    if (deleteIds.length && typeof supabaseAdmin.rpc === 'function') {
      const rpc = await supabaseAdmin.rpc('availability_replace_windows', {
        p_leader_id: leaderId,
        p_delete_ids: deleteIds,
        p_rows: rows.map((row) => ({
          window_date: row.window_date,
          start_time: row.start_time,
          end_time: row.end_time,
          slot_duration_minutes: row.slot_duration_minutes,
          buffer_minutes: row.buffer_minutes,
          series_id: row.series_id || null,
        })),
      });
      if (!rpc.error) return { data: Array.isArray(rpc.data) ? rpc.data : [], error: null };
      if (!isMissingFunction(rpc.error)) return { data: null, error: rpc.error };
    }

    const inserted = rows.length ? await insertWindows(rows) : { data: [], error: null };
    if (inserted.error) return inserted;
    if (deleteIds.length) {
      const { error } = await supabaseAdmin
        .from('availability_windows')
        .delete()
        .in('id', deleteIds)
        .eq('leader_id', leaderId);
      if (error) return { data: null, error };
    }
    return { data: inserted.data || [], error: null };
  }

  async function findSeriesRows(leaderId, seriesId) {
    const current = await getCaps();
    if (!current.seriesId || !seriesId) return [];
    const { data, error } = await supabaseAdmin
      .from('availability_windows')
      .select(columnsFor(current))
      .eq('leader_id', leaderId)
      .eq('series_id', seriesId);
    if (error) {
      if (isMissingColumn(error, 'series_id')) {
        caps = { ...current, seriesId: false };
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async function saveBatch({ leaderId, body }) {
    return withLeaderLock(leaderId, () => (
      body?.undo
        ? restoreDeleted({ leaderId, windows: body.windows })
        : saveBatchLocked({ leaderId, body })
    ));
  }

  async function saveBatchLocked({ leaderId, body }) {
    const seriesId = isUuid(body?.series_id) ? body.series_id : null;
    const onOverlap = ['skip', 'merge', 'replace'].includes(body?.on_overlap) ? body.on_overlap : 'skip';
    const windows = body?.windows;

    if (!Array.isArray(windows) || windows.length === 0) {
      return { status: 400, body: { error: 'windows must be a non-empty array' } };
    }

    if (seriesId) {
      const stored = await findSeriesRows(leaderId, seriesId);
      if (stored.length) {
        return {
          status: 201,
          body: {
            created: stored,
            skipped_existing: [],
            conflicts: [],
            series_id: seriesId,
            replayed: true,
          },
        };
      }
      const remembered = recallReplay(leaderId, seriesId);
      if (remembered) {
        return { status: 201, body: { ...remembered, replayed: true } };
      }
    }

    const rows = [];
    for (let i = 0; i < windows.length; i += 1) {
      const parsed = validateWindowInput(windows[i]);
      if (parsed.error) {
        return { status: 400, body: { error: `windows[${i}]: ${parsed.error}` } };
      }
      rows.push(parsed.value);
    }
    const deduped = dedupeExact(rows);
    const internal = classify(deduped, []);
    if (internal.internalOverlap.length) {
      const day = WEEKDAY_LONG[weekdayIndex(internal.internalOverlap[0][0].window_date)];
      return {
        status: 400,
        body: { error: 'internal_overlap', message: `${day} times overlap. Fix before saving.` },
      };
    }

    const dates = deduped.map((row) => row.window_date).sort();
    const existing = await listWindows(leaderId, { from: dates[0], to: dates[dates.length - 1] });
    return applyClassified({ leaderId, seriesId, onOverlap, deduped, existing, allowRetry: true });
  }

  async function applyClassified({ leaderId, seriesId, onOverlap, deduped, existing, allowRetry }) {
    const plan = classify(deduped, existing);
    const bookingMap = await activeBookings(existing.map((row) => row.id).filter(Boolean));
    const toDelete = new Set();
    const toInsert = plan.create.map((row) => ({ ...row, leader_id: leaderId, series_id: seriesId }));
    const conflicts = [];

    const mergeItems = [];
    for (const item of plan.overlap) {
      const bookings = item.existing.flatMap((row) => bookingMap.get(row.id) || []);
      if (onOverlap === 'skip') {
        conflicts.push({
          window: item.row,
          reason: 'skipped',
          message: `${item.row.window_date} overlaps an existing window and was skipped.`,
          existing: item.existing,
        });
        continue;
      }
      if (bookings.length) {
        conflicts.push({
          window: item.row,
          reason: 'booked',
          message: `${bookings.length} visit${bookings.length === 1 ? ' is' : 's are'} booked in that window`,
          existing: item.existing,
        });
        continue;
      }
      if (onOverlap === 'merge') {
        mergeItems.push(item);
        continue;
      }
      for (const row of item.existing) toDelete.add(row.id);
      toInsert.push({ ...item.row, leader_id: leaderId, series_id: seriesId });
    }

    for (const group of collapseMerges(mergeItems)) {
      const bookings = group.existing.flatMap((row) => bookingMap.get(row.id) || []);
      if (bookings.length) {
        conflicts.push({
          window: { window_date: group.window_date, start_time: group.start_time, end_time: group.end_time },
          reason: 'booked',
          message: `${bookings.length} visit${bookings.length === 1 ? ' is' : 's are'} booked in that window`,
          existing: group.existing,
        });
        continue;
      }
      const slot = group.slot_duration_minutes;
      const buffer = group.buffer_minutes;
      const mismatch = [...group.rows, ...group.existing].some(
        (row) => Number(row.slot_duration_minutes) !== slot || Number(row.buffer_minutes || 0) !== buffer,
      );
      if (mismatch) {
        conflicts.push({
          window: { window_date: group.window_date, start_time: group.start_time, end_time: group.end_time },
          reason: 'merge_mismatch',
          message: 'Merge is only available when the visit length and buffer match.',
          existing: group.existing,
        });
        continue;
      }
      for (const row of group.existing) if (row.id) toDelete.add(row.id);
      toInsert.push({
        window_date: group.window_date,
        start_time: group.start_time,
        end_time: group.end_time,
        slot_duration_minutes: slot,
        buffer_minutes: buffer,
        leader_id: leaderId,
        series_id: seriesId,
      });
    }

    let created = [];
    if (toInsert.length || toDelete.size) {
      const inserted = toDelete.size
        ? await replaceWindows({ leaderId, deleteIds: [...toDelete], rows: toInsert })
        : await insertWindows(toInsert);
      if (inserted.error && (isExclusionViolation(inserted.error) || isUniqueViolation(inserted.error))) {
        if (!allowRetry) {
          return {
            status: 409,
            body: { error: 'conflict', message: 'Your windows changed. Preview updated.' },
          };
        }
        const fresh = await listWindows(leaderId, {
          from: deduped[0] && [...deduped].sort((a, b) => a.window_date.localeCompare(b.window_date))[0].window_date,
          to: [...deduped].sort((a, b) => a.window_date.localeCompare(b.window_date)).at(-1).window_date,
        });
        return applyClassified({ leaderId, seriesId, onOverlap, deduped, existing: fresh, allowRetry: false });
      }
      if (inserted.error) throw inserted.error;
      created = inserted.data || [];
    }

    const response = {
      created,
      skipped_existing: plan.exact.map((item) => item.row),
      conflicts,
      series_id: seriesId,
      replayed: false,
    };
    rememberReplay(leaderId, seriesId, response);
    return { status: 201, body: response };
  }

  async function saveOne({ leaderId, body }) {
    const seriesId = isUuid(body?.series_id) ? body.series_id : null;
    return saveBatch({
      leaderId,
      body: {
        series_id: seriesId,
        on_overlap: body?.on_overlap || 'skip',
        windows: [body],
      },
    });
  }

  async function patchWindow({ id, user, body }) {
    const { data: current, error: fetchErr } = await supabaseAdmin
      .from('availability_windows')
      .select(NO_SERIES_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!current) return { status: 404, body: { error: 'not_found' } };
    if (user.role !== 'admin' && current.leader_id !== user.leader_id) {
      return { status: 403, body: { error: 'Forbidden' } };
    }

    const parsed = validateWindowInput({ ...current, ...body });
    if (parsed.error) return { status: 400, body: { error: parsed.error } };
    const next = parsed.value;

    const sameDay = await listWindows(current.leader_id, { from: next.window_date, to: next.window_date });
    const others = sameDay.filter((row) => row.id !== id);
    const plan = classify([next], others);
    if (plan.overlap.length) {
      const hit = plan.overlap[0].existing[0];
      return {
        status: 409,
        body: {
          error: 'overlap',
          message: `That overlaps your ${formatTime12(hit.start_time)}–${formatTime12(hit.end_time)} window.`,
        },
      };
    }

    const bookings = await activeBookings([id]);
    const visits = bookings.get(id) || [];
    const outside = visits.filter((booking) => {
      const start = timeKey(booking.slot_time || current.start_time);
      const endMin = minutesFrom(start) + Number(next.slot_duration_minutes);
      const windowEnd = minutesFrom(next.end_time);
      return start < next.start_time || endMin > windowEnd;
    });
    if (outside.length) {
      return { status: 409, body: { error: 'booked', message: bookedMessage(outside) } };
    }

    const patch = {
      window_date: next.window_date,
      start_time: next.start_time,
      end_time: next.end_time,
      slot_duration_minutes: next.slot_duration_minutes,
      buffer_minutes: next.buffer_minutes,
    };
    const { data, error } = await supabaseAdmin
      .from('availability_windows')
      .update(patch)
      .eq('id', id)
      .select(NO_SERIES_COLUMNS)
      .maybeSingle();
    if (error && isExclusionViolation(error)) {
      return { status: 409, body: { error: 'conflict', message: 'Your windows changed. Preview updated.' } };
    }
    if (error) throw error;
    return { status: 200, body: { window: data } };
  }

  async function deleteOne({ id, user }) {
    const currentCaps = await getCaps();
    const { data: current, error: fetchErr } = await supabaseAdmin
      .from('availability_windows')
      .select(columnsFor(currentCaps))
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!current) return { status: 404, body: { error: 'not_found' } };
    if (user.role !== 'admin' && current.leader_id !== user.leader_id) {
      return { status: 403, body: { error: 'Forbidden' } };
    }
    return withLeaderLock(current.leader_id, async () => {
      const held = await activeBookings([id]);
      const stillBooked = held.get(id) || [];
      if (stillBooked.length) {
        return {
          status: 409,
          body: {
            error: 'booked',
            message: `${plainCount(stillBooked.length, 'visit')} ${stillBooked.length === 1 ? 'is' : 'are'} booked in that window. Cancel the visit before deleting this window.`,
          },
        };
      }
      const { error } = await supabaseAdmin.from('availability_windows').delete().eq('id', id).eq('leader_id', current.leader_id);
      if (error) throw error;
      return { status: 200, body: { deleted: [current] } };
    });
  }

  async function loadOwnedRows(leaderId, ids) {
    const clean = [...new Set((ids || []).filter((id) => isUuid(id)))];
    if (!clean.length) return [];
    const { data, error } = await supabaseAdmin
      .from('availability_windows')
      .select(columnsFor(await getCaps()))
      .in('id', clean)
      .eq('leader_id', leaderId);
    if (error) throw error;
    return data || [];
  }

  async function deleteMany({ leaderId, user, seriesId, from, to, ids }) {
    if (user.role !== 'admin' && user.leader_id !== leaderId) {
      return { status: 403, body: { error: 'Forbidden' } };
    }
    return withLeaderLock(leaderId, () => deleteManyLocked({ leaderId, seriesId, from, to, ids }));
  }

  async function deleteManyLocked({ leaderId, seriesId, from, to, ids }) {
    const collected = new Map();
    const hasIds = Array.isArray(ids) && ids.length > 0;
    if (!seriesId && !hasIds && !(from && to)) {
      return { status: 400, body: { error: 'series_id, from and to, or ids required' } };
    }
    if (hasIds && !ids.some((id) => isUuid(id)) && !seriesId && !(from && to)) {
      return { status: 400, body: { error: 'ids must be uuids' } };
    }
    if (seriesId) {
      for (const row of await findSeriesRows(leaderId, seriesId)) collected.set(row.id, row);
      if (!collected.size && isUuid(seriesId)) {
        const remembered = recallReplay(leaderId, seriesId);
        const rememberedIds = (remembered?.created || []).map((row) => row.id).filter(Boolean);
        for (const row of await loadOwnedRows(leaderId, rememberedIds)) collected.set(row.id, row);
      }
    }
    if (hasIds) {
      for (const row of await loadOwnedRows(leaderId, ids)) collected.set(row.id, row);
    }
    if (!collected.size && !seriesId && !hasIds && from && to) {
      for (const row of await listWindows(leaderId, { from, to })) collected.set(row.id, row);
    }
    const rows = [...collected.values()];

    const bookings = await activeBookings(rows.map((row) => row.id));
    const kept = [];
    const deletable = [];
    for (const row of rows) {
      const visits = bookings.get(row.id) || [];
      if (visits.length) {
        kept.push({
          id: row.id,
          window_date: row.window_date,
          reason: 'booked',
          message: `${plainCount(visits.length, 'visit')} booked here, so this window was kept.`,
        });
      } else {
        deletable.push(row);
      }
    }
    if (deletable.length) {
      const { error } = await supabaseAdmin.from('availability_windows').delete().in('id', deletable.map((row) => row.id)).eq('leader_id', leaderId);
      if (error) throw error;
    }
    return { status: 200, body: { deleted: deletable, kept } };
  }

  async function restoreDeleted({ leaderId, windows }) {
    if (!Array.isArray(windows) || !windows.length) {
      return { status: 400, body: { error: 'windows required' } };
    }
    const restored = [];
    const current = await getCaps();
    for (const input of windows) {
      if (!isUuid(input?.id)) {
        return { status: 400, body: { error: 'undo ids must be uuids' } };
      }
      if (input.leader_id && input.leader_id !== leaderId) {
        return { status: 403, body: { error: 'Forbidden' } };
      }
      const parsed = validateWindowInput(input);
      if (parsed.error) return { status: 400, body: { error: parsed.error } };
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('availability_windows')
        .select('id, leader_id')
        .eq('id', input.id)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing && existing.leader_id !== leaderId) {
        return { status: 403, body: { error: 'Forbidden' } };
      }
      if (existing) {
        restored.push(existing);
        continue;
      }
      const row = {
        id: input.id,
        leader_id: leaderId,
        ...parsed.value,
      };
      if (current.seriesId && isUuid(input.series_id)) row.series_id = input.series_id;
      const inserted = await insertWindows([row]);
      if (inserted.error && (isExclusionViolation(inserted.error) || isUniqueViolation(inserted.error))) {
        return { status: 409, body: { error: 'conflict', message: 'That time now overlaps another window, so it was not restored.' } };
      }
      if (inserted.error) throw inserted.error;
      restored.push((inserted.data || [])[0] || row);
    }
    if (!restored.length) {
      return { status: 409, body: { error: 'undo_expired', message: 'Undo expired. Nothing was restored.' } };
    }
    return { status: 201, body: { created: restored, restored: true } };
  }

  async function listWithBookings(leaderId) {
    const windows = await listWindows(leaderId);
    const bookings = await activeBookings(windows.map((row) => row.id));
    return windows.map((row) => ({
      ...row,
      series_id: row.series_id || null,
      buffer_minutes: Number(row.buffer_minutes || 0),
      booked_count: (bookings.get(row.id) || []).length,
      booked_times: (bookings.get(row.id) || []).map((b) => timeKey(b.slot_time)).filter(Boolean),
    }));
  }

  return {
    getCaps,
    listWindows,
    listWithBookings,
    saveBatch,
    saveOne,
    patchWindow,
    deleteOne,
    deleteMany,
    activeBookings,
  };
}

function minutesFrom(value) {
  const [h, m] = timeKey(value).split(':').map(Number);
  return h * 60 + (m || 0);
}

function owns(user, leaderId) {
  return user?.role === 'admin' || user?.leader_id === leaderId;
}

export function registerAvailabilityRoutes(app, { supabaseAdmin, requireSession }) {
  const service = createAvailabilityService(supabaseAdmin);

  app.get('/api/availability/:leaderId/windows', requireSession, async (req, res) => {
    if (!owns(req.user, req.params.leaderId)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const windows = await service.listWithBookings(req.params.leaderId);
      const caps = await service.getCaps();
      res.json({ windows, schema: { series_id: caps.seriesId, unique_window: caps.unique === true } });
    } catch {
      res.status(500).json({ error: 'Could not load availability' });
    }
  });

  app.post('/api/availability/:leaderId/windows', requireSession, async (req, res) => {
    if (!owns(req.user, req.params.leaderId)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const result = await service.saveOne({ leaderId: req.params.leaderId, body: req.body || {} });
      if (result.status >= 400) {
        return res.status(result.status).json({
          error: result.body.message || result.body.error,
          ...result.body,
        });
      }
      const created = result.body.created?.[0];
      if (created?.id) return res.status(201).json(created);
      if (result.body.conflicts?.length) {
        return res.status(409).json({
          error: 'conflict',
          message: result.body.conflicts[0].message || 'That time overlaps a window you already have.',
        });
      }
      const skipped = result.body.skipped_existing?.[0];
      if (skipped) {
        const rows = await service.listWindows(req.params.leaderId, {
          from: skipped.window_date,
          to: skipped.window_date,
        });
        const match = rows.find(
          (row) => timeKey(row.start_time) === skipped.start_time && timeKey(row.end_time) === skipped.end_time,
        );
        if (match) return res.status(200).json(match);
      }
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error('[availability] save one:', error.message);
      res.status(500).json({ error: 'Could not save' });
    }
  });

  app.post('/api/availability/:leaderId/windows/batch', requireSession, async (req, res) => {
    if (!owns(req.user, req.params.leaderId)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const result = await service.saveBatch({ leaderId: req.params.leaderId, body: req.body || {} });
      res.status(result.status).json(result.body);
    } catch (error) {
      console.error('[availability] save batch:', error.message);
      res.status(500).json({ error: 'Could not save' });
    }
  });

  app.patch('/api/availability/windows/:id', requireSession, async (req, res) => {
    try {
      const result = await service.patchWindow({ id: req.params.id, user: req.user, body: req.body || {} });
      res.status(result.status).json(result.body);
    } catch (error) {
      console.error('[availability] patch:', error.message);
      res.status(500).json({ error: 'Could not save' });
    }
  });

  app.delete('/api/availability/windows/:id', requireSession, async (req, res) => {
    try {
      const result = await service.deleteOne({ id: req.params.id, user: req.user });
      res.status(result.status).json(result.body);
    } catch (error) {
      console.error('[availability] delete:', error.message);
      res.status(500).json({ error: 'Could not delete' });
    }
  });

  app.delete('/api/availability/:leaderId/windows', requireSession, async (req, res) => {
    try {
      const ids = typeof req.query.ids === 'string'
        ? req.query.ids.split(',').map((id) => id.trim()).filter(Boolean)
        : [];
      const result = await service.deleteMany({
        leaderId: req.params.leaderId,
        user: req.user,
        seriesId: req.query.series_id || null,
        from: req.query.from || null,
        to: req.query.to || null,
        ids,
      });
      res.status(result.status).json(result.body);
    } catch (error) {
      console.error('[availability] delete many:', error.message);
      res.status(500).json({ error: 'Could not delete' });
    }
  });

  return service;
}

export async function hiddenLegacyLeaderIds(supabaseAdmin) {
  const { data, error } = await supabaseAdmin
    .from('config')
    .select('value')
    .eq('key', 'hidden_legacy_slot_leaders')
    .maybeSingle();
  if (error) return [];
  return Array.isArray(data?.value) ? data.value : [];
}

export async function setLegacyLeaderHidden(supabaseAdmin, leaderId, hidden) {
  const current = new Set(await hiddenLegacyLeaderIds(supabaseAdmin));
  if (hidden) current.add(leaderId);
  else current.delete(leaderId);
  const value = [...current];
  const { error } = await supabaseAdmin
    .from('config')
    .upsert({ key: 'hidden_legacy_slot_leaders', value }, { onConflict: 'key' });
  if (error) throw error;
  return value;
}
