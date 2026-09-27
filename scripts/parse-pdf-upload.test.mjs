// Regression: POST /api/admin/roster/parse-pdf must accept a normal LCR PDF
// (and a few MB of headroom) instead of Express's 100kb JSON body limit.
//
// The admin client posts the raw PDF. It used to force Content-Type
// application/json, so express.json() returned 413 before the PDF parser ran.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 3457;
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN = {
  'X-Mock-User': JSON.stringify({
    id: 'braden',
    role: 'admin',
    email: 'bradenchurch@gmail.com',
  }),
};

const here = path.dirname(fileURLToPath(import.meta.url));
const pdfCandidates = [
  process.env.LCR_PDF,
  '/tmp/lcr-sample.pdf',
  path.resolve(here, '../uploads/ministering-assignments.pdf'),
].filter(Boolean);

function findSamplePdf() {
  return pdfCandidates.find((p) => fs.existsSync(p)) || null;
}

async function waitForServer(child) {
  const started = Date.now();
  let log = '';
  child.stdout.on('data', (chunk) => {
    log += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    log += chunk.toString();
  });
  while (Date.now() - started < 20000) {
    if (log.includes('listening at')) return;
    if (child.exitCode != null) {
      throw new Error(`server exited early (${child.exitCode}): ${log.slice(-500)}`);
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`server did not start: ${log.slice(-500)}`);
}

async function postPdf(body, contentType) {
  const res = await fetch(`${BASE}/api/admin/roster/parse-pdf`, {
    method: 'POST',
    headers: { ...ADMIN, 'Content-Type': contentType },
    body,
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  return { status: res.status, data };
}

let child;

test.before(async () => {
  child = spawn(process.execPath, ['server/index.js'], {
    cwd: path.resolve(here, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      MOCK_AUTH: 'true',
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServer(child);
});

test.after(() => {
  child?.kill('SIGTERM');
});

test('a >100kb body labeled application/json is not rejected with 413', async () => {
  const body = Buffer.alloc(200 * 1024, 0x20);
  body.write('%PDF-1.4 not a real document');
  const res = await postPdf(body, 'application/json');
  assert.notEqual(res.status, 413, JSON.stringify(res.data));
  assert.ok(res.status === 400 || res.status === 500 || res.status === 200);
});

test('a 3MB PDF-typed body is not rejected with 413', async () => {
  const body = Buffer.alloc(3 * 1024 * 1024, 0x20);
  body.write('%PDF-1.4 not a real document');
  const res = await postPdf(body, 'application/pdf');
  assert.notEqual(res.status, 413, JSON.stringify(res.data));
});

test('the Long Valley LCR export parses to a preview', async (t) => {
  const pdfPath = findSamplePdf();
  if (!pdfPath) {
    t.skip('sample LCR PDF not present');
    return;
  }
  const body = fs.readFileSync(pdfPath);
  assert.ok(body.length > 100 * 1024, 'fixture should be larger than the old 100kb JSON limit');

  for (const contentType of ['application/pdf', 'application/json']) {
    const res = await postPdf(body, contentType);
    assert.equal(res.status, 200, `${contentType} -> ${JSON.stringify(res.data).slice(0, 300)}`);
    assert.equal(res.data.ward_name, 'Long Valley 2nd Ward');
    assert.equal(res.data.totals.districts, 3);
    assert.equal(res.data.totals.companionships, 60);
    assert.equal(res.data.totals.families, 129);
    assert.ok(Array.isArray(res.data.districts));
  }
});
