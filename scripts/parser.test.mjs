import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseLcrPdf } from '../server/lcr-parser.js';

test('LCR Parser - Full PDF sample integration', async (t) => {
  if (!fs.existsSync('/tmp/lcr-sample.pdf')) {
    t.skip('/tmp/lcr-sample.pdf not found in environment');
    return;
  }

  const buffer = fs.readFileSync('/tmp/lcr-sample.pdf');
  const result = await parseLcrPdf(buffer, 'lcr-sample.pdf');

  assert.equal(result.ward_name, 'Long Valley 2nd Ward');
  assert.equal(result.totals.districts, 3);
  assert.equal(result.totals.companionships, 60);
  assert.equal(result.totals.families, 129);

  // Confirm District supervisors are captured
  assert.equal(result.districts[0].leader, 'Chollet, Cole');
  assert.equal(result.districts[1].leader, 'Tupuola, Kawika');
  assert.equal(result.districts[2].leader, 'Bryan, Sean');

  // Confirm solo companion warnings are surfaced
  const soloWarnings = result.warnings.filter((w) => w.code === 'single_companion');
  assert.equal(soloWarnings.length, 6);
  assert.ok(soloWarnings.some((w) => w.message.includes('Durrant, David Arthur')));
  assert.ok(soloWarnings.some((w) => w.message.includes('Rigby, Stetson')));
  assert.ok(soloWarnings.some((w) => w.message.includes('Crichton, Brian')));
});
