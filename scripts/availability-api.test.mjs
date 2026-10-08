import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { expandPattern } from '../shared/availability.js';
import { createAvailabilityService, resetAvailabilityMemory } from '../server/availability.js';

function createFakeDb(options = {}) {
  const { seriesColumn = false, unique = false, exclusion = false } = options;
  const tables = { availability_windows: [], bookings: [] };

  function from(table) {
    const state = { op: 'select', filters: [], payload: null, upsert: null, single: false, columns: '*' };
    const api = {
      select(cols) { state.columns = cols || '*'; return api; },
      insert(payload) { state.op = 'insert'; state.payload = payload; return api; },
      upsert(payload, opts) { state.op = 'upsert'; state.payload = payload; state.upsert = opts; return api; },
      update(payload) { state.op = 'update'; state.payload = payload; return api; },
      delete() { state.op = 'delete'; return api; },
      eq(col, val) { state.filters.push((row) => row[col] === val); return api; },
      in(col, vals) { state.filters.push((row) => vals.includes(row[col])); return api; },
      gte(col, val) { state.filters.push((row) => String(row[col]).slice(0, 10) >= String(val)); return api; },
      lte(col, val) { state.filters.push((row) => String(row[col]).slice(0, 10) <= String(val)); return api; },
      order() { return api; },
      limit() { return api; },
      maybeSingle() { state.single = true; return exec(); },
      then(resolve, reject) { return exec().then(resolve, reject); },
    };

    const matches = (row) => state.filters.every((fn) => fn(row));
    const rows = () => tables[table];

    async function exec() {
      if (state.op === 'select' && String(state.columns).includes('series_id') && !seriesColumn) {
        return { data: null, error: { code: 'PGRST204', message: "Could not find the 'series_id' column" } };
      }
      if (state.op === 'select') {
        const found = rows().filter(matches);
        return { data: state.single ? (found[0] || null) : found, error: null };
      }
      if (state.op === 'upsert' && !unique) {
        return { data: null, error: { code: '42P10', message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification' } };
      }
      if (state.op === 'insert' && options.throwOnInsert > 0) {
        options.throwOnInsert -= 1;
        throw new Error('forced lock failure');
      }
      if (state.op === 'insert' || state.op === 'upsert') {
        const stored = [];
        for (const raw of state.payload) {
          const row = { id: raw.id || randomUUID(), buffer_minutes: 0, ...raw };
          if (!seriesColumn) delete row.series_id;
          const same = rows().find((existing) =>
            existing.leader_id === row.leader_id
            && String(existing.window_date).slice(0, 10) === row.window_date
            && String(existing.start_time).slice(0, 5) === String(row.start_time).slice(0, 5)
            && String(existing.end_time).slice(0, 5) === String(row.end_time).slice(0, 5));
          if (same) {
            if (state.op === 'upsert' && state.upsert?.ignoreDuplicates) continue;
            if (unique) return { data: null, error: { code: '23505', message: 'duplicate key' } };
          }
          const overlap = rows().find((existing) =>
            existing.id !== row.id
            && existing.leader_id === row.leader_id
            && String(existing.window_date).slice(0, 10) === row.window_date
            && row.start_time < String(existing.end_time).slice(0, 5)
            && String(existing.start_time).slice(0, 5) < row.end_time);
          if (overlap && exclusion) {
            return { data: null, error: { code: '23P01', message: 'conflicting key value violates exclusion constraint' } };
          }
          rows().push(row);
          stored.push(row);
        }
        return { data: stored, error: null };
      }
      if (state.op === 'delete') {
        const removed = [];
        const list = rows();
        for (let i = list.length - 1; i >= 0; i -= 1) {
          if (matches(list[i])) removed.push(list.splice(i, 1)[0]);
        }
        return { data: removed, error: null };
      }
      if (state.op === 'update') {
        const updated = [];
        for (const row of rows()) {
          if (!matches(row)) continue;
          Object.assign(row, state.payload);
          updated.push(row);
        }
        return { data: state.single ? (updated[0] || null) : updated, error: null };
      }
      return { data: null, error: { message: 'unsupported' } };
    }
    return api;
  }

  async function rpc(name, args) {
    if (name !== 'availability_replace_windows') {
      return { data: null, error: { code: 'PGRST202', message: 'Could not find the function' } };
    }
    const snapshot = tables.availability_windows.map((row) => ({ ...row }));
    const deleteIds = new Set(args.p_delete_ids || []);
    tables.availability_windows = tables.availability_windows.filter(
      (row) => !(row.leader_id === args.p_leader_id && deleteIds.has(row.id)),
    );
    const stored = [];
    try {
      for (const raw of args.p_rows || []) {
        const row = {
          id: randomUUID(),
          leader_id: args.p_leader_id,
          window_date: raw.window_date,
          start_time: String(raw.start_time).slice(0, 5),
          end_time: String(raw.end_time).slice(0, 5),
          slot_duration_minutes: raw.slot_duration_minutes,
          buffer_minutes: raw.buffer_minutes ?? 0,
          series_id: raw.series_id || null,
        };
        if (![0, 5, 10].includes(Number(row.buffer_minutes))) {
          const error = new Error('check');
          error.code = '23514';
          throw error;
        }
        if (!seriesColumn) delete row.series_id;
        const overlap = tables.availability_windows.find((existing) =>
          existing.leader_id === row.leader_id
          && String(existing.window_date).slice(0, 10) === row.window_date
          && row.start_time < String(existing.end_time).slice(0, 5)
          && String(existing.start_time).slice(0, 5) < row.end_time);
        if (overlap && exclusion) {
          const error = new Error('exclusion');
          error.code = '23P01';
          throw error;
        }
        tables.availability_windows.push(row);
        stored.push(row);
      }
    } catch (error) {
      tables.availability_windows = snapshot;
      return { data: null, error: { code: error.code, message: error.message } };
    }
    return { data: stored, error: null };
  }

  return options.rpc ? { from, tables, rpc } : { from, tables };
}

function serviceFor(options) {
  resetAvailabilityMemory();
  const db = createFakeDb(options);
  return { db, service: createAvailabilityService(db) };
}

const coleRows = () => expandPattern({
  ranges: [{ weekdays: [1, 2, 3, 4, 5], start: '19:00', end: '21:00' }],
  slot: 15,
  from: '2026-10-08',
  to: '2026-11-20',
});

test('double-tap with one series id inserts once and replays', async () => {
  const { db, service } = serviceFor({ seriesColumn: false, unique: false });
  const seriesId = randomUUID();
  const body = { series_id: seriesId, on_overlap: 'skip', windows: coleRows() };
  const [first, second] = await Promise.all([
    service.saveBatch({ leaderId: 'cole', body }),
    service.saveBatch({ leaderId: 'cole', body }),
  ]);
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal(db.tables.availability_windows.length, 32);
  const replayed = [first, second].filter((result) => result.body.replayed);
  const fresh = [first, second].filter((result) => !result.body.replayed);
  assert.equal(replayed.length, 1);
  assert.equal(fresh.length, 1);
  assert.equal(fresh[0].body.created.length, 32);
  assert.equal(replayed[0].body.created.length, 32);
});

test('saving the same pattern again inserts nothing', async () => {
  const { db, service } = serviceFor({ seriesColumn: false, unique: false });
  const first = await service.saveBatch({
    leaderId: 'cole',
    body: { series_id: randomUUID(), on_overlap: 'skip', windows: coleRows() },
  });
  assert.equal(first.body.created.length, 32);
  const second = await service.saveBatch({
    leaderId: 'cole',
    body: { series_id: randomUUID(), on_overlap: 'skip', windows: coleRows() },
  });
  assert.equal(second.body.created.length, 0);
  assert.equal(second.body.skipped_existing.length, 32);
  assert.equal(db.tables.availability_windows.length, 32);
});

test('series id stored in the database replays after the memory is cleared', async () => {
  const { service } = serviceFor({ seriesColumn: true, unique: true });
  const seriesId = randomUUID();
  const first = await service.saveBatch({
    leaderId: 'kawika',
    body: {
      series_id: seriesId,
      windows: expandPattern({
        ranges: [
          { weekdays: [0], start: '13:00', end: '15:00' },
          { weekdays: [3], start: '19:00', end: '21:00' },
        ],
        slot: 30,
        from: '2026-10-11',
        to: '2026-12-20',
      }),
    },
  });
  assert.equal(first.body.created.length, 21);
  resetAvailabilityMemory();
  const replay = await service.saveBatch({
    leaderId: 'kawika',
    body: { series_id: seriesId, windows: [{ window_date: '2026-10-11', start_time: '13:00', end_time: '15:00' }] },
  });
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.created.length, 21);
});

test('skip, merge, and replace follow the overlap choice and refuse booked windows', async () => {
  const { db, service } = serviceFor({ seriesColumn: true, unique: true });
  await service.saveBatch({
    leaderId: 'kawika',
    body: {
      series_id: randomUUID(),
      windows: [{ window_date: '2026-10-11', start_time: '13:00', end_time: '15:00', slot_duration_minutes: 30, buffer_minutes: 0 }],
    },
  });
  const existingId = db.tables.availability_windows[0].id;
  db.tables.bookings.push({ id: randomUUID(), window_id: existingId, slot_time: '13:30', status: 'booked' });

  const skipped = await service.saveBatch({
    leaderId: 'kawika',
    body: {
      series_id: randomUUID(),
      on_overlap: 'skip',
      windows: [{ window_date: '2026-10-11', start_time: '14:00', end_time: '16:00', slot_duration_minutes: 30, buffer_minutes: 0 }],
    },
  });
  assert.equal(skipped.body.created.length, 0);
  assert.equal(skipped.body.conflicts[0].reason, 'skipped');
  assert.equal(db.tables.availability_windows.length, 1);

  const replaced = await service.saveBatch({
    leaderId: 'kawika',
    body: {
      series_id: randomUUID(),
      on_overlap: 'replace',
      windows: [{ window_date: '2026-10-11', start_time: '14:00', end_time: '16:00', slot_duration_minutes: 30, buffer_minutes: 0 }],
    },
  });
  assert.equal(replaced.body.conflicts[0].reason, 'booked');
  assert.equal(db.tables.availability_windows[0].start_time, '13:00');

  db.tables.bookings.length = 0;
  const merged = await service.saveBatch({
    leaderId: 'kawika',
    body: {
      series_id: randomUUID(),
      on_overlap: 'merge',
      windows: [{ window_date: '2026-10-11', start_time: '14:00', end_time: '16:00', slot_duration_minutes: 30, buffer_minutes: 0 }],
    },
  });
  assert.equal(merged.body.created.length, 1);
  assert.equal(merged.body.created[0].start_time, '13:00');
  assert.equal(merged.body.created[0].end_time, '16:00');
  assert.equal(db.tables.availability_windows.length, 1);
});

test('delete of a booked window is blocked and undo restores an unbooked delete', async () => {
  const { db, service } = serviceFor({ seriesColumn: false, unique: false });
  const saved = await service.saveBatch({
    leaderId: 'sean',
    body: {
      series_id: randomUUID(),
      windows: [{ window_date: '2026-10-13', start_time: '19:00', end_time: '21:00', slot_duration_minutes: 30, buffer_minutes: 0 }],
    },
  });
  const id = saved.body.created[0].id;
  db.tables.bookings.push({ id: randomUUID(), window_id: id, slot_time: '19:30', status: 'booked' });
  const blocked = await service.deleteOne({ id, user: { role: 'leader', leader_id: 'sean' } });
  assert.equal(blocked.status, 409);
  assert.match(blocked.body.message, /Cancel the visit/);
  db.tables.bookings.length = 0;
  const deleted = await service.deleteOne({ id, user: { role: 'leader', leader_id: 'sean' } });
  assert.equal(deleted.status, 200);
  assert.equal(db.tables.availability_windows.length, 0);
  const restored = await service.saveBatch({
    leaderId: 'sean',
    body: { undo: true, windows: deleted.body.deleted },
  });
  assert.equal(restored.status, 201);
  assert.equal(db.tables.availability_windows.length, 1);
  assert.equal(db.tables.availability_windows[0].id, id);
});

test('a request that overlaps itself is rejected before insert', async () => {
  const { db, service } = serviceFor();
  const result = await service.saveBatch({
    leaderId: 'cole',
    body: {
      series_id: randomUUID(),
      windows: [
        { window_date: '2026-10-11', start_time: '13:00', end_time: '15:00', slot_duration_minutes: 30, buffer_minutes: 0 },
        { window_date: '2026-10-11', start_time: '14:00', end_time: '16:00', slot_duration_minutes: 30, buffer_minutes: 0 },
      ],
    },
  });
  assert.equal(result.status, 400);
  assert.match(result.body.message, /Sunday times overlap/);
  assert.equal(db.tables.availability_windows.length, 0);
});

test('undo restores a deleted window on a second instance with empty memory', async () => {
  resetAvailabilityMemory();
  const db = createFakeDb({ seriesColumn: false, unique: false });
  const first = createAvailabilityService(db);
  const saved = await first.saveBatch({
    leaderId: 'kawika',
    body: {
      series_id: randomUUID(),
      windows: [{ window_date: '2026-10-11', start_time: '13:00', end_time: '15:00', slot_duration_minutes: 30, buffer_minutes: 0 }],
    },
  });
  const deleted = await first.deleteOne({
    id: saved.body.created[0].id,
    user: { role: 'leader', leader_id: 'kawika' },
  });
  assert.equal(db.tables.availability_windows.length, 0);
  resetAvailabilityMemory();
  const second = createAvailabilityService(db);
  const restored = await second.saveBatch({
    leaderId: 'kawika',
    body: { undo: true, windows: deleted.body.deleted },
  });
  assert.equal(restored.status, 201);
  assert.equal(restored.body.created.length, 1);
  assert.equal(db.tables.availability_windows.length, 1);
  assert.equal(db.tables.availability_windows[0].id, saved.body.created[0].id);
  assert.equal(String(db.tables.availability_windows[0].start_time).slice(0, 5), '13:00');
  assert.equal(String(db.tables.availability_windows[0].end_time).slice(0, 5), '15:00');
});

test('undo after save deletes by id on another instance before series_id exists', async () => {
  resetAvailabilityMemory();
  const db = createFakeDb({ seriesColumn: false, unique: false });
  const first = createAvailabilityService(db);
  const seriesId = randomUUID();
  const saved = await first.saveBatch({
    leaderId: 'cole',
    body: { series_id: seriesId, windows: coleRows().slice(0, 2) },
  });
  assert.equal(saved.body.created.length, 2);
  resetAvailabilityMemory();
  const second = createAvailabilityService(db);
  const undone = await second.deleteMany({
    leaderId: 'cole',
    user: { role: 'leader', leader_id: 'cole' },
    seriesId,
    ids: saved.body.created.map((row) => row.id),
  });
  assert.equal(undone.status, 200);
  assert.equal(undone.body.deleted.length, 2);
  assert.equal(db.tables.availability_windows.length, 0);
});

const kawikaWednesday = [
  { window_date: '2026-10-14', start_time: '18:00', end_time: '19:30', slot_duration_minutes: 30, buffer_minutes: 0 },
  { window_date: '2026-10-14', start_time: '20:30', end_time: '22:00', slot_duration_minutes: 30, buffer_minutes: 0 },
];

async function seedKawikaWednesday(service) {
  return service.saveBatch({
    leaderId: 'kawika',
    body: {
      series_id: randomUUID(),
      windows: [{ window_date: '2026-10-14', start_time: '19:00', end_time: '21:00', slot_duration_minutes: 30, buffer_minutes: 0 }],
    },
  });
}

test('merging two windows that both overlap one existing window keeps 6:00–10:00', async () => {
  const { db, service } = serviceFor({ seriesColumn: false, unique: false });
  await seedKawikaWednesday(service);
  const merged = await service.saveBatch({
    leaderId: 'kawika',
    body: { series_id: randomUUID(), on_overlap: 'merge', windows: kawikaWednesday },
  });
  assert.equal(merged.status, 201);
  assert.equal(merged.body.created.length, 1);
  assert.equal(merged.body.created[0].start_time, '18:00');
  assert.equal(merged.body.created[0].end_time, '22:00');
  assert.equal(db.tables.availability_windows.length, 1);
  assert.equal(String(db.tables.availability_windows[0].start_time).slice(0, 5), '18:00');
  assert.equal(String(db.tables.availability_windows[0].end_time).slice(0, 5), '22:00');
});

test('a failed merge leaves the existing window in place', async () => {
  const { db, service } = serviceFor({ seriesColumn: true, unique: true, exclusion: true });
  await seedKawikaWednesday(service);
  const merged = await service.saveBatch({
    leaderId: 'kawika',
    body: { series_id: randomUUID(), on_overlap: 'merge', windows: kawikaWednesday },
  });
  assert.equal(merged.status, 409);
  assert.equal(db.tables.availability_windows.length, 1);
  assert.equal(String(db.tables.availability_windows[0].start_time).slice(0, 5), '19:00');
  assert.equal(String(db.tables.availability_windows[0].end_time).slice(0, 5), '21:00');
});

test('a failure inside the leader lock does not crash, and the next save works', async () => {
  const unhandled = [];
  const onUnhandled = (reason) => { unhandled.push(reason); };
  process.on('unhandledRejection', onUnhandled);
  try {
    resetAvailabilityMemory();
    const options = { seriesColumn: false, unique: false, throwOnInsert: 1 };
    const db = createFakeDb(options);
    const service = createAvailabilityService(db);
    const window = { slot_duration_minutes: 15, buffer_minutes: 0 };
    await assert.rejects(
      () => service.saveBatch({
        leaderId: 'cole',
        body: {
          series_id: randomUUID(),
          windows: [{ ...window, window_date: '2026-10-08', start_time: '19:00', end_time: '21:00' }],
        },
      }),
      /forced lock failure/,
    );
    await new Promise((resolve) => { setImmediate(resolve); });
    assert.equal(unhandled.length, 0);
    const next = await service.saveBatch({
      leaderId: 'cole',
      body: {
        series_id: randomUUID(),
        windows: [{ ...window, window_date: '2026-10-09', start_time: '19:00', end_time: '21:00' }],
      },
    });
    assert.equal(next.status, 201);
    assert.equal(next.body.created.length, 1);
    assert.equal(db.tables.availability_windows.length, 1);
  } finally {
    process.off('unhandledRejection', onUnhandled);
  }
});

test('merge after the migration replaces the whole chain in one call', async () => {
  const { db, service } = serviceFor({ seriesColumn: true, unique: true, exclusion: true, rpc: true });
  await seedKawikaWednesday(service);
  const merged = await service.saveBatch({
    leaderId: 'kawika',
    body: { series_id: randomUUID(), on_overlap: 'merge', windows: kawikaWednesday },
  });
  assert.equal(merged.status, 201);
  assert.equal(merged.body.created.length, 1);
  assert.equal(db.tables.availability_windows.length, 1);
  assert.equal(db.tables.availability_windows[0].start_time, '18:00');
  assert.equal(db.tables.availability_windows[0].end_time, '22:00');
});
