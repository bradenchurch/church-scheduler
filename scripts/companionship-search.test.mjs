import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {
  COMPANIONSHIP_SEARCH_MAX,
  companionshipSearchTerms,
  registerPublicReadRoutes,
} from '../server/publicReads.js';

const COLE_EMAIL = 'cole.chollet1@gmail.com';
const INJECTION = 'x,companion1_email.ilike.*gmail*';

function createFakeSupabase(seed) {
  const calls = [];
  function from(table) {
    const api = {
      select(columns) {
        calls.push({ table, method: 'select', columns });
        return api;
      },
      eq(column, value) {
        calls.push({ table, method: 'eq', column, value });
        return api;
      },
      gte() { return api; },
      lte() { return api; },
      or(filters) {
        calls.push({ table, method: 'or', filters });
        return api;
      },
      ilike(column, pattern) {
        calls.push({ table, method: 'ilike', column, pattern });
        return api;
      },
      filter(column, operator, value) {
        calls.push({ table, method: 'filter', column, operator, value });
        return api;
      },
      order() { return api; },
      maybeSingle() { return Promise.resolve({ data: null, error: null }); },
      then(resolve, reject) {
        return Promise.resolve({ data: seed[table] || [], error: null }).then(resolve, reject);
      },
    };
    return api;
  }
  return { from, calls };
}

async function startApp(seed) {
  const db = createFakeSupabase(seed);
  const app = express();
  app.use(express.json());
  registerPublicReadRoutes(app, {
    supabaseAdmin: db,
    requireSession: (_req, _res, next) => next(),
  });
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

function seed() {
  return {
    companionships: [
      {
        id: 'ada',
        leader_id: 'cole',
        companion1_name: 'Ada Walker',
        companion2_name: 'Ben Walker',
        companion1_email: 'ada@gmail.com',
        companion2_email: 'ben@gmail.com',
        leaders: { name: 'Cole Chollet', email: COLE_EMAIL },
      },
      {
        id: 'zoe',
        leader_id: 'kawika',
        companion1_name: 'Zoe Ng',
        companion2_name: 'Quinn Berg',
        companion1_email: COLE_EMAIL,
        companion2_email: 'quinn@gmail.com',
        leaders: { name: 'Kawika' },
      },
      {
        id: 'max',
        leader_id: 'sean',
        companion1_name: 'Max Ng',
        companion2_name: 'Otto Berg',
        companion1_email: 'max@gmail.com',
        leaders: { name: 'Sean' },
      },
      {
        id: 'literal-email',
        leader_id: 'cole',
        companion1_name: COLE_EMAIL,
        companion2_name: 'Pat Lee',
        companion1_email: 'pat@example.com',
        leaders: { name: 'Pat Leader' },
      },
      {
        id: 'literal-wild',
        leader_id: 'cole',
        companion1_name: 'a%',
        companion2_name: 'Kim',
        companion1_email: 'kim@gmail.com',
        leaders: { name: 'Kim Leader' },
      },
    ],
  };
}

async function search(base, term) {
  const url = term == null
    ? `${base}/api/companionships`
    : `${base}/api/companionships?search=${encodeURIComponent(term)}`;
  const res = await fetch(url);
  assert.equal(res.status, 200);
  return res.json();
}

function ids(rows) {
  return rows.map((row) => row.id);
}

function assertNoFilterSyntax(calls) {
  assert.ok(calls.length > 0);
  for (const call of calls) {
    assert.equal(call.method, 'select');
    assert.equal(call.columns, 'id, leader_id, companion1_name, companion2_name, leaders(name)');
    assert.doesNotMatch(call.columns, /email|phone|\*/i);
  }
}

test('search terms split Last, First and drop syntax-only input', () => {
  assert.deepEqual(companionshipSearchTerms('Walker, Ada'), ['walker', 'ada']);
  assert.deepEqual(companionshipSearchTerms('  Lee,Pat  '), ['lee', 'pat']);
  assert.deepEqual(companionshipSearchTerms('***'), []);
  assert.deepEqual(companionshipSearchTerms('%%%'), []);
  assert.deepEqual(companionshipSearchTerms(',,,'), []);
  assert.deepEqual(companionshipSearchTerms('   '), []);
  assert.deepEqual(companionshipSearchTerms(undefined), []);
  const capped = companionshipSearchTerms(`${'x'.repeat(COMPANIONSHIP_SEARCH_MAX)}Walker`);
  assert.equal(capped.length, 1);
  assert.equal(capped[0].includes('walker'), false);
});

test('companionship search matches names only and ignores filter syntax', async () => {
  const { db, base, close } = await startApp(seed());
  try {
    const all = await search(base);
    assert.deepEqual(ids(all).sort(), ['ada', 'literal-email', 'literal-wild', 'max', 'zoe']);

    const byLast = await search(base, 'Walker');
    assert.deepEqual(ids(byLast), ['ada']);

    const lastFirst = await search(base, 'Walker, Ada');
    assert.deepEqual(ids(lastFirst), ['ada']);

    const lastFirstTight = await search(base, 'Lee,Pat');
    assert.deepEqual(ids(lastFirstTight), ['literal-email']);

    const email = await search(base, COLE_EMAIL);
    assert.deepEqual(ids(email), ['literal-email']);

    const injection = await search(base, INJECTION);
    assert.deepEqual(ids(injection), []);

    const wildcard = await search(base, 'a%');
    assert.deepEqual(ids(wildcard), ['literal-wild']);

    const leaderOnly = await search(base, 'Kawika');
    assert.deepEqual(ids(leaderOnly), []);

    const syntaxOnly = await search(base, '*,.%');
    assert.deepEqual(ids(syntaxOnly).sort(), ids(all).sort());

    const overflow = await search(base, `${'x'.repeat(COMPANIONSHIP_SEARCH_MAX)}Walker`);
    assert.deepEqual(ids(overflow), []);

    assertNoFilterSyntax(db.calls);
    for (const row of [...all, ...byLast, ...email, ...injection, ...wildcard]) {
      assert.equal(Object.hasOwn(row, 'companion1_email'), false);
      assert.equal(Object.hasOwn(row, 'companion2_email'), false);
    }
  } finally {
    await close();
  }
});
