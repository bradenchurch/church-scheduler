import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { registerPublicReadRoutes } from '../server/publicReads.js';

const COLE_EMAIL = 'cole.chollet1@gmail.com';
const ADA_EMAIL = 'ada@example.com';

function piiHits(value, path = '$') {
  const hits = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => hits.push(...piiHits(item, `${path}[${index}]`)));
    return hits;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (/email|phone/i.test(key)) hits.push(`${path}.${key}`);
      hits.push(...piiHits(child, `${path}.${key}`));
    }
    return hits;
  }
  if (typeof value === 'string' && value.includes('@')) hits.push(path);
  return hits;
}

function assertNoPii(body) {
  assert.deepEqual(piiHits(body), []);
}

function createFakeSupabase(seed) {
  const selects = [];
  function from(table) {
    const state = { columns: '*', filters: [] };
    const api = {
      select(columns) {
        state.columns = columns || '*';
        selects.push({ table, columns: state.columns });
        return api;
      },
      eq(column, value) {
        state.filters.push((row) => row[column] === value);
        return api;
      },
      gte() { return api; },
      lte() { return api; },
      or() { return api; },
      order() { return api; },
      maybeSingle() { return exec(true); },
      then(resolve, reject) { return exec(false).then(resolve, reject); },
    };
    async function exec(single) {
      const rows = (seed[table] || []).filter((row) => state.filters.every((fn) => fn(row)));
      return { data: single ? (rows[0] || null) : rows, error: null };
    }
    return api;
  }
  return { from, selects };
}

function requireSession(req, res, next) {
  const raw = req.headers['x-user'];
  if (!raw) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.user = JSON.parse(raw);
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
  return next();
}

function seed() {
  return {
    leaders: [{
      id: 'cole',
      name: 'Cole Chollet',
      email: COLE_EMAIL,
      phone: '208-555-0100',
    }],
    slots: [{
      id: 'slot-1',
      leader_id: 'cole',
      day_of_week: 4,
      start_time: '19:00',
      duration_minutes: 30,
      notes: 'internal',
    }],
    availability_windows: [{
      id: 'window-1',
      leader_id: 'cole',
      window_date: '2026-10-14',
      start_time: '19:00',
      end_time: '21:00',
      slot_duration_minutes: 30,
      buffer_minutes: 0,
    }],
    companionships: [{
      id: 'comp-1',
      leader_id: 'cole',
      companion1_name: 'Ada Walker',
      companion2_name: 'Ben Walker',
      companion1_email: ADA_EMAIL,
      companion2_email: 'ben@example.com',
      companion1_phone: '208-555-0199',
      leaders: { name: 'Cole Chollet', email: COLE_EMAIL, phone: '208-555-0100' },
    }],
    config: [],
  };
}

async function startApp() {
  const db = createFakeSupabase(seed());
  const app = express();
  app.use(express.json());
  registerPublicReadRoutes(app, { supabaseAdmin: db, requireSession });
  const server = await new Promise((resolve) => {
    const handle = app.listen(0, '127.0.0.1', () => resolve(handle));
  });
  const { port } = server.address();
  return {
    db,
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  };
}

test('public availability, companionship search, and slots contain no contact data', async () => {
  const { db, base, close } = await startApp();
  try {
    const availability = await fetch(`${base}/api/availability/cole`).then((res) => res.json());
    const list = await fetch(`${base}/api/companionships`).then((res) => res.json());
    const search = await fetch(`${base}/api/companionships?search=Walker`).then((res) => res.json());
    const slots = await fetch(`${base}/api/slots/cole`).then((res) => res.json());

    assert.equal(availability.name, 'Cole Chollet');
    assert.equal(availability.slots[0].start_time, '19:00');
    assert.equal(availability.windows[0].window_date, '2026-10-14');
    assert.equal(list[0].companion1_name, 'Ada Walker');
    assert.equal(list[0].leaders.name, 'Cole Chollet');
    assert.equal(search[0].id, 'comp-1');
    assert.equal(slots[0].day_of_week, 4);

    for (const body of [availability, list, search, slots]) assertNoPii(body);

    for (const entry of db.selects) {
      assert.doesNotMatch(entry.columns, /email|phone|\*/i);
    }
  } finally {
    await close();
  }
});

test('presidency contact is only returned to the assigned signed-in companion', async () => {
  const { base, close } = await startApp();
  try {
    const anon = await fetch(`${base}/api/availability/cole/contact`);
    assert.equal(anon.status, 401);
    assertNoPii(await anon.json());

    const stranger = await fetch(`${base}/api/availability/cole/contact`, {
      headers: { 'x-user': JSON.stringify({ email: 'stranger@example.com', role: 'companion' }) },
    });
    assert.equal(stranger.status, 403);
    assertNoPii(await stranger.json());

    const assigned = await fetch(`${base}/api/availability/cole/contact`, {
      headers: { 'x-user': JSON.stringify({ email: ADA_EMAIL, role: 'companion' }) },
    });
    assert.equal(assigned.status, 200);
    const contact = await assigned.json();
    assert.equal(contact.email, COLE_EMAIL);
    assert.equal(contact.phone, '208-555-0100');
    assert.equal(contact.name, 'Cole Chollet');
  } finally {
    await close();
  }
});
