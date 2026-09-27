import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import {
  CHILD_TABLES,
  buildQueue,
  addPartner,
  setIntentionalSolo,
  assignHousehold,
  registerNeedsAssignmentRoutes,
} from '../server/needs-assignment.js';

const LEADERS = {
  1: 'cole',
  2: 'kawika',
  3: 'sean',
};
const WARD = 'long-valley-2nd-ward';

const PROD_SOLOS = [
  ['185bf633-82f8-4eca-932a-df98a03b909f', 'cole', 'Durrant, David Arthur'],
  ['e1304f36-5522-4b68-ac81-5edfcc64851e', 'cole', 'Sanders, Brennan'],
  ['8def7a77-c231-4ae8-9841-acf8ec22c1d1', 'kawika', 'Crichton, Brian'],
  ['0d48bffb-1653-4377-9daa-5ff86ae4cffb', 'kawika', 'Rigby, Stetson'],
  ['10bbaba5-00ab-40d2-8fd4-b93b1f4bdabf', 'sean', 'Mann, Ryan'],
  ['cb9a123f-f769-4957-9bd6-1a803786e136', 'sean', 'Sorensen, Hyrum'],
];

const PROD_UNLINKED = [
  ['9c194d07-9184-4c02-8351-73a3eda25318', 'Cahoon', 'Matt', 'Cahoon', 'cross_district', 1],
  ['041cbe74-5fe2-812b-db28-b9bb54997bc7', 'Bangerter', 'Torsten', 'Bangerter', 'single', 2],
  ['def4dcdf-de94-ba90-8148-782afcb9182e', 'Bayles', 'Jared', 'Bayles', 'single', 2],
  ['1f248fdc-cfb1-9157-ce8b-01fd3d085b43', 'Collins', 'Cashe', 'Collins', 'cross_district', 2],
  ['3dd868f3-5d17-d02b-7e38-e90a3d7994d7', 'Connole', 'Brayden', 'Connole', 'family', 2],
  ['14fcb729-7b29-0d0f-a7d2-57250359dae6', 'Engemann', 'Cole', 'Engemann', 'family', 2],
  ['e12c28e3-8941-4c65-3826-de76a5682579', 'Gallacci', 'Justine', 'Gallacci', 'single', 2],
  ['fba76880-9fe0-b5fc-c699-5264a4e4dce7', 'Hadlock', 'Sydni', 'Hadlock', 'family', 2],
  ['ee3f891b-e345-6da6-bfbe-b877f3497d59', 'Hales', 'Benjamin Sidney', 'Hales', 'family', 2],
  ['b054d5a9-8be2-1437-3b3f-b17c61da56c0', 'Slade', 'Logan Timothy', 'Slade', 'family', 2],
  ['f04e79be-cf19-dbed-86de-bf5befe48b00', 'West', 'Milli', 'West', 'single', 2],
  ['bb528df4-adac-0dfd-946f-176fc9a753c3', 'Bell', 'Jordan', 'Bell', 'cross_district', 3],
  ['c972d586-f463-443c-1e42-40f078ca0f30', 'Benson', 'Nicklas', 'Benson', 'family', 3],
  ['5d1938f8-3002-8661-9a98-21f2496984d0', 'Brown', 'Jason', 'Brown', 'family', 3],
  ['e3623c5a-9e6e-479f-34a9-9837c404e8d2', 'Cahoon', 'Matt', 'Cahoon', 'family', 3],
  ['6a0b1ef3-8877-689d-332a-21734f0260a7', 'Christiansen', 'Treyson Russell', 'Christiansen', 'family', 3],
  ['7ff75233-28ff-004b-a3de-7b4000b485e1', 'Durrant', 'David Arthur', 'Durrant', 'family', 3],
  ['9fd43650-ee63-98be-e72f-b55cbacc24ec', 'Warner', 'Tyler', 'Warner', 'family', 3],
  ['78e63355-5a53-4e19-23f9-c232b2cfa677', 'Wynne', 'Colton', 'Wynne', 'family', 3],
];

function hh(id, family, first, last, category, district, extra = {}) {
  return {
    id,
    ward_slug: WARD,
    family_name: family,
    head_first_name: first,
    head_last_name: last,
    category,
    district_number: district,
    active: true,
    ...extra,
  };
}

function prodState() {
  return {
    leaders: [
      { id: 'cole', name: 'Cole Chollet', position: 'president' },
      { id: 'kawika', name: 'Kawika Tupuola', position: 'counselor' },
      { id: 'sean', name: 'Sean Bryan', position: 'counselor' },
      { id: 'braden', name: 'Braden Church', position: 'secretary' },
    ],
    companionships: [
      ...PROD_SOLOS.map(([id, leader_id, companion1_name]) => ({
        id,
        leader_id,
        companion1_name,
        companion2_name: null,
        companion1_email: null,
        companion2_email: null,
        intentional_solo: false,
      })),
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        leader_id: 'cole',
        companion1_name: 'Paired, One',
        companion2_name: 'Paired, Two',
        intentional_solo: false,
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        leader_id: 'sean',
        companion1_name: 'Intentional, Solo',
        companion2_name: null,
        intentional_solo: true,
      },
    ],
    households: [
      ...PROD_UNLINKED.map((row) => hh(...row)),
      hh('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Linked', 'Already', 'Linked', 'family', 1),
      hh('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Inactive', 'No', 'Show', 'family', 1, { active: false }),
      hh('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'OtherWard', 'Out', 'OfWard', 'family', 1, {
        ward_slug: 'other-ward',
      }),
    ],
    links: [
      {
        companionship_id: '185bf633-82f8-4eca-932a-df98a03b909f',
        household_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      },
    ],
  };
}

function createMemoryDb(seed) {
  const db = {
    companionships: structuredClone(seed.companionships || []),
    households: structuredClone(seed.households || []),
    companionship_households: structuredClone(seed.links || seed.companionship_households || []),
    bookings: structuredClone(seed.bookings || []),
    qr_requests: structuredClone(seed.qr_requests || []),
    chapel_submissions: structuredClone(seed.chapel_submissions || []),
    leaders: structuredClone(seed.leaders || []),
  };

  function from(table) {
    const rows = db[table];
    if (!rows) throw new Error(`unknown table ${table}`);
    const filters = [];
    let op = 'select';
    let payload = null;
    let conflict = [];

    function exec() {
      const match = (row) => filters.every(([col, val]) => row[col] === val);
      if (op === 'select') {
        return { data: rows.filter(match).map((row) => ({ ...row })), error: null };
      }
      if (op === 'update') {
        for (const row of rows) {
          if (match(row)) Object.assign(row, payload);
        }
        return { data: null, error: null };
      }
      if (op === 'insert') {
        const inserted = [];
        for (const row of payload) {
          const copy = { ...row };
          rows.push(copy);
          inserted.push({ ...copy });
        }
        return { data: inserted, error: null };
      }
      if (op === 'upsert') {
        const idx = rows.findIndex((row) => conflict.every((col) => row[col] === payload[col]));
        if (idx >= 0) Object.assign(rows[idx], payload);
        else rows.push({ ...payload });
        return { data: null, error: null };
      }
      if (op === 'delete') {
        const removed = rows.filter(match);
        for (let i = rows.length - 1; i >= 0; i -= 1) {
          if (match(rows[i])) rows.splice(i, 1);
        }
        if (table === 'companionships') {
          const ids = new Set(removed.map((row) => row.id));
          for (const child of [...CHILD_TABLES, 'companionship_households']) {
            const list = db[child];
            for (let i = list.length - 1; i >= 0; i -= 1) {
              if (ids.has(list[i].companionship_id)) list.splice(i, 1);
            }
          }
        }
        return { data: null, error: null };
      }
      return { data: null, error: { message: `bad op ${op}` } };
    }

    const builder = {
      select() {
        return builder;
      },
      eq(col, val) {
        filters.push([col, val]);
        return builder;
      },
      update(patch) {
        op = 'update';
        payload = patch;
        return builder;
      },
      insert(rowsToInsert) {
        op = 'insert';
        payload = rowsToInsert;
        return builder;
      },
      upsert(row, options) {
        op = 'upsert';
        payload = row;
        conflict = String(options?.onConflict || '')
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean);
        return builder;
      },
      delete() {
        op = 'delete';
        return builder;
      },
      then(onFulfilled, onRejected) {
        return new Promise((resolve, reject) => {
          try {
            resolve(exec());
          } catch (err) {
            reject(err);
          }
        }).then(onFulfilled, onRejected);
      },
    };
    return builder;
  }

  return { from, db };
}

function queueOf(state) {
  return buildQueue(state, { leaderByDistrict: LEADERS, wardSlug: WARD });
}

test('queue matches the post-import leftovers and hides rows that are already settled', () => {
  const queue = queueOf(prodState());
  assert.deepEqual(queue.counts, {
    needs_companion: 6,
    needs_companionship: 19,
    intentional_solo: 1,
  });
  assert.deepEqual(
    queue.needs_companion.map((row) => row.companion1_name),
    [
      'Durrant, David Arthur',
      'Sanders, Brennan',
      'Crichton, Brian',
      'Rigby, Stetson',
      'Mann, Ryan',
      'Sorensen, Hyrum',
    ],
  );
  assert.equal(queue.needs_companion[0].district_number, 1);
  assert.equal(queue.needs_companion[0].leader_name, 'Cole Chollet');
  assert.equal(queue.needs_companion[0].household_count, 1);
  assert.equal(queue.needs_companion[2].district_number, 2);
  assert.equal(queue.needs_companion[2].leader_name, 'Kawika Tupuola');
  assert.deepEqual(
    queue.needs_companionship.map((row) => `${row.district_number}:${row.family_name}`),
    [
      '1:Cahoon',
      '2:Bangerter',
      '2:Bayles',
      '2:Collins',
      '2:Connole',
      '2:Engemann',
      '2:Gallacci',
      '2:Hadlock',
      '2:Hales',
      '2:Slade',
      '2:West',
      '3:Bell',
      '3:Benson',
      '3:Brown',
      '3:Cahoon',
      '3:Christiansen',
      '3:Durrant',
      '3:Warner',
      '3:Wynne',
    ],
  );
  assert.equal(queue.needs_companionship[1].category, 'single');
  assert.equal(queue.needs_companionship[1].leader_id, 'kawika');
  assert.equal(queue.intentional_solos[0].companion1_name, 'Intentional, Solo');
  assert.equal(
    queue.needs_companion.some((row) => row.companion1_name === 'Paired, One'),
    false,
  );
  assert.equal(
    queue.needs_companionship.some((row) => row.family_name === 'Linked'),
    false,
  );
});

test('blank companion2 still counts as needing a partner', () => {
  const state = prodState();
  state.companionships.push({
    id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    leader_id: 'cole',
    companion1_name: 'Whitespace, Solo',
    companion2_name: '   ',
    intentional_solo: false,
  });
  const queue = queueOf(state);
  assert.equal(queue.counts.needs_companion, 7);
  assert.ok(queue.needs_companion.some((row) => row.companion1_name === 'Whitespace, Solo'));
});

test('adding a partner keeps the companionship id and a dry run writes nothing', async () => {
  const memory = createMemoryDb(prodState());
  const kept = '185bf633-82f8-4eca-932a-df98a03b909f';
  const before = structuredClone(memory.db.companionships);

  const preview = await addPartner(memory, {
    companionshipId: kept,
    companion2Name: 'Example, Partner',
    companion2Email: 'partner@example.com',
    dryRun: true,
  });
  assert.equal(preview.dry_run, true);
  assert.equal(preview.companionship_id, kept);
  assert.equal(preview.absorbed_companionship_id, null);
  assert.deepEqual(memory.db.companionships, before);

  const saved = await addPartner(memory, {
    companionshipId: kept,
    companion2Name: 'Example, Partner',
    companion2Email: 'partner@example.com',
  });
  assert.equal(saved.dry_run, false);
  assert.equal(saved.companionship_id, kept);
  const row = memory.db.companionships.find((c) => c.id === kept);
  assert.equal(row.companion2_name, 'Example, Partner');
  assert.equal(row.companion2_email, 'partner@example.com');
  assert.equal(row.intentional_solo, false);
  assert.equal(memory.db.companionships.length, before.length);

  const queue = queueOf({ ...memory.db, links: memory.db.companionship_households });
  assert.equal(
    queue.needs_companion.some((item) => item.id === kept),
    false,
  );
});

test('pairing two solos keeps one id and moves bookings, visits, and families', async () => {
  const kept = '185bf633-82f8-4eca-932a-df98a03b909f';
  const absorbed = 'e1304f36-5522-4b68-ac81-5edfcc64851e';
  const sharedHousehold = '9c194d07-9184-4c02-8351-73a3eda25318';
  const movedHousehold = '041cbe74-5fe2-812b-db28-b9bb54997bc7';
  const state = prodState();
  state.links.push(
    { companionship_id: kept, household_id: sharedHousehold },
    { companionship_id: absorbed, household_id: sharedHousehold },
    { companionship_id: absorbed, household_id: movedHousehold },
  );
  const absorbedRow = state.companionships.find((c) => c.id === absorbed);
  absorbedRow.companion1_email = 'gbsand28@gmail.com';
  const memory = createMemoryDb({
    ...state,
    bookings: [{ id: '11111111-1111-4111-8111-111111111111', companionship_id: absorbed, status: 'booked' }],
    qr_requests: [{ id: '22222222-2222-4222-8222-222222222222', companionship_id: absorbed }],
    chapel_submissions: [{ id: '33333333-3333-4333-8333-333333333333', companionship_id: absorbed }],
  });

  const saved = await addPartner(memory, {
    companionshipId: kept,
    absorbCompanionshipId: absorbed,
  });
  assert.equal(saved.companionship_id, kept);
  assert.equal(saved.absorbed_companionship_id, absorbed);
  assert.equal(saved.companion2_name, 'Sanders, Brennan');

  assert.equal(memory.db.companionships.some((c) => c.id === absorbed), false);
  const row = memory.db.companionships.find((c) => c.id === kept);
  assert.equal(row.companion2_name, 'Sanders, Brennan');
  assert.equal(row.companion2_email, 'gbsand28@gmail.com');

  assert.equal(memory.db.bookings[0].companionship_id, kept);
  assert.equal(memory.db.qr_requests[0].companionship_id, kept);
  assert.equal(memory.db.chapel_submissions[0].companionship_id, kept);

  const shared = memory.db.companionship_households.filter((l) => l.household_id === sharedHousehold);
  assert.deepEqual(shared.map((l) => l.companionship_id), [kept]);
  const moved = memory.db.companionship_households.filter((l) => l.household_id === movedHousehold);
  assert.deepEqual(moved.map((l) => l.companionship_id), [kept]);
});

test('intentional solo leaves the queue and can return without a new companionship id', async () => {
  const memory = createMemoryDb(prodState());
  const id = 'cb9a123f-f769-4957-9bd6-1a803786e136';
  const marked = await setIntentionalSolo(memory, { companionshipId: id, intentional: true });
  assert.equal(marked.companionship_id, id);
  assert.equal(marked.intentional_solo, true);
  let queue = queueOf({ ...memory.db, links: memory.db.companionship_households });
  assert.equal(queue.needs_companion.some((row) => row.id === id), false);
  assert.equal(queue.intentional_solos.some((row) => row.id === id), true);

  await setIntentionalSolo(memory, { companionshipId: id, intentional: false });
  queue = queueOf({ ...memory.db, links: memory.db.companionship_households });
  assert.equal(queue.needs_companion.some((row) => row.id === id), true);
  assert.equal(memory.db.companionships.filter((c) => c.id === id).length, 1);
});

test('assigning a household links an existing companionship id', async () => {
  const memory = createMemoryDb(prodState());
  const householdId = '3dd868f3-5d17-d02b-7e38-e90a3d7994d7';
  const companionshipId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const beforeIds = memory.db.companionships.map((c) => c.id);

  const preview = await assignHousehold(
    memory,
    { householdId, companionshipId, dryRun: true },
    { leaderByDistrict: LEADERS },
  );
  assert.equal(preview.dry_run, true);
  assert.equal(preview.created, false);
  assert.equal(memory.db.companionship_households.some((l) => l.household_id === householdId), false);

  const saved = await assignHousehold(
    memory,
    { householdId, companionshipId },
    { leaderByDistrict: LEADERS },
  );
  assert.equal(saved.companionship_id, companionshipId);
  assert.equal(saved.created, false);
  assert.deepEqual(
    memory.db.companionships.map((c) => c.id),
    beforeIds,
  );
  assert.ok(
    memory.db.companionship_households.some(
      (l) => l.household_id === householdId && l.companionship_id === companionshipId,
    ),
  );

  await assert.rejects(
    () => assignHousehold(memory, { householdId, companionshipId }, { leaderByDistrict: LEADERS }),
    (err) => err.status === 409,
  );
});

test('creating a companionship for an unlinked household stores the new row and the link', async () => {
  const memory = createMemoryDb(prodState());
  const householdId = 'f04e79be-cf19-dbed-86de-bf5befe48b00';
  const before = memory.db.companionships.length;
  const saved = await assignHousehold(
    memory,
    {
      householdId,
      create: { companion1_name: 'New, Companion', companion2_name: 'New, Partner' },
    },
    { leaderByDistrict: LEADERS },
  );
  assert.equal(saved.created, true);
  assert.equal(memory.db.companionships.length, before + 1);
  const created = memory.db.companionships.find((c) => c.id === saved.companionship_id);
  assert.equal(created.companion1_name, 'New, Companion');
  assert.equal(created.companion2_name, 'New, Partner');
  assert.equal(created.leader_id, 'kawika');
  assert.ok(
    memory.db.companionship_households.some(
      (l) => l.household_id === householdId && l.companionship_id === saved.companionship_id,
    ),
  );
});

test('partner and assign requests reject unsafe input before writing', async () => {
  const memory = createMemoryDb(prodState());
  const before = structuredClone(memory.db);
  await assert.rejects(
    () => addPartner(memory, { companionshipId: 'not-a-uuid', companion2Name: 'X' }),
    (err) => err.status === 400,
  );
  await assert.rejects(
    () =>
      addPartner(memory, {
        companionshipId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        companion2Name: 'Someone, Else',
      }),
    (err) => err.status === 409,
  );
  await assert.rejects(
    () =>
      addPartner(memory, {
        companionshipId: '185bf633-82f8-4eca-932a-df98a03b909f',
        absorbCompanionshipId: '185bf633-82f8-4eca-932a-df98a03b909f',
      }),
    (err) => err.status === 400,
  );
  await assert.rejects(
    () =>
      assignHousehold(
        memory,
        { householdId: '3dd868f3-5d17-d02b-7e38-e90a3d7994d7', create: { companion1_name: '' } },
        { leaderByDistrict: LEADERS },
      ),
    (err) => err.status === 400,
  );
  assert.deepEqual(memory.db, before);
});

function mount(memory) {
  const app = express();
  app.use(express.json());
  const requireSession = (req, res, next) => {
    const raw = req.headers['x-user'];
    if (!raw) return res.status(401).json({ error: 'Missing authorization' });
    req.user = JSON.parse(raw);
    return next();
  };
  const requireRole = (role) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Missing authorization' });
    if (req.user.role === 'admin' || req.user.role === role) return next();
    return res.status(403).json({ error: `Requires role '${role}'` });
  };
  registerNeedsAssignmentRoutes(app, {
    supabaseAdmin: memory,
    requireSession,
    requireRole,
    leaderByDistrict: LEADERS,
    wardSlug: WARD,
  });
  return app;
}

async function call(app, method, url, { user, body } = {}) {
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}${url}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(user ? { 'x-user': JSON.stringify(user) } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('needs-assignment routes are admin-only and serve the live queue', async () => {
  const memory = createMemoryDb(prodState());
  const app = mount(memory);
  const admin = { role: 'admin', email: 'bradenchurch@gmail.com' };
  const leader = { role: 'leader', email: 'cole.chollet1@gmail.com' };

  const anon = await call(app, 'GET', '/api/admin/needs-assignment');
  assert.equal(anon.status, 401);

  const forbidden = await call(app, 'GET', '/api/admin/needs-assignment', { user: leader });
  assert.equal(forbidden.status, 403);

  const ok = await call(app, 'GET', '/api/admin/needs-assignment', { user: admin });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.counts.needs_companion, 6);
  assert.equal(ok.data.counts.needs_companionship, 19);

  const deniedWrite = await call(
    app,
    'POST',
    '/api/admin/needs-assignment/households/3dd868f3-5d17-d02b-7e38-e90a3d7994d7/assign',
    { user: leader, body: { companionship_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } },
  );
  assert.equal(deniedWrite.status, 403);
  assert.equal(
    memory.db.companionship_households.some((l) => l.household_id === '3dd868f3-5d17-d02b-7e38-e90a3d7994d7'),
    false,
  );

  const write = await call(
    app,
    'POST',
    '/api/admin/needs-assignment/companionships/10bbaba5-00ab-40d2-8fd4-b93b1f4bdabf/intentional-solo',
    { user: admin, body: { intentional_solo: true } },
  );
  assert.equal(write.status, 200);
  assert.equal(write.data.intentional_solo, true);

  const after = await call(app, 'GET', '/api/admin/needs-assignment', { user: admin });
  assert.equal(after.data.counts.needs_companion, 5);
  assert.equal(after.data.counts.intentional_solo, 2);
});

export { createMemoryDb, prodState, LEADERS, WARD };

test('the page and schema do not reset the roster', () => {
  const page = fs.readFileSync(new URL('../src/pages/AdminNeedsAssignment.jsx', import.meta.url), 'utf8');
  const nav = fs.readFileSync(new URL('../src/components/Nav.jsx', import.meta.url), 'utf8');
  const schema = fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  const server = fs.readFileSync(new URL('../server/index.js', import.meta.url), 'utf8');
  assert.match(page, /\/api\/admin\/needs-assignment/);
  assert.doesNotMatch(page, /deleteRoster|\/api\/admin\/roster|Reset Roster/);
  assert.match(nav, /Needs assignment/);
  assert.match(nav, /\/admin\/needs-assignment/);
  assert.match(schema, /intentional_solo/);
  assert.match(server, /registerNeedsAssignmentRoutes\(/);
  assert.doesNotMatch(
    fs.readFileSync(new URL('../server/needs-assignment.js', import.meta.url), 'utf8'),
    /writeEmptyRoster|\/api\/admin\/roster/,
  );
});
