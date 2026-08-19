import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('/Users/bradenchurch/.openclaw/workspace/.secrets/church-scheduler.env', 'utf8');
const cfg = Object.fromEntries(env.split('\n').filter(l => l.includes('=')).map(l => {
  const k = l.split('=')[0].trim();
  return [k, l.slice(l.indexOf('=') + 1).trim()];
}));
const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_KEY);

const pdfBuf = fs.readFileSync('/tmp/lcr-sample.pdf');
const headers = {
  'X-Mock-User': '{"id":"braden","role":"admin","email":"bradenchurch@gmail.com"}',
  'Content-Type': 'application/pdf',
};

async function parsePdf() {
  const res = await fetch('http://localhost:3001/api/admin/roster/parse-pdf', {
    method: 'POST', headers, body: pdfBuf,
  });
  const text = await res.text();
  return { status: res.status, data: JSON.parse(text) };
}

async function importPreview(districts) {
  const res = await fetch('http://localhost:3001/api/admin/roster/import', {
    method: 'POST',
    headers: { 'X-Mock-User': headers['X-Mock-User'], 'Content-Type': 'application/json' },
    body: JSON.stringify({ districts }),
  });
  const text = await res.text();
  return { status: res.status, data: JSON.parse(text) };
}

console.log('=== Step 1: POST /api/admin/roster/parse-pdf ===');
const parseRes = await parsePdf();
console.log('  status:', parseRes.status);
console.log('  totals:', JSON.stringify(parseRes.data.totals));
console.log('  ward:', parseRes.data.ward_name);
if (parseRes.status !== 200) { console.error('FAIL:', JSON.stringify(parseRes.data).slice(0, 500)); process.exit(1); }

console.log('\n=== Step 2: POST /api/admin/roster/import ===');
const importRes = await importPreview(parseRes.data.districts);
console.log('  status:', importRes.status);
console.log('  body:', JSON.stringify(importRes.data));
if (importRes.status !== 200) process.exit(1);

console.log('\n=== Step 3: Verify database rows ===');
const checks = [
  { table: 'companionships', expect: parseRes.data.totals.companionships },
  { table: 'households', expect: parseRes.data.totals.families },
  { table: 'companionship_households', expect: parseRes.data.totals.families },
];
for (const c of checks) {
  const { count } = await supabase.from(c.table).select('*', { count: 'exact', head: true });
  const note = c.expect != null ? ` (expected ~${c.expect})` : '';
  const ok = c.expect != null && Math.abs(count - c.expect) <= 5 ? '✓' : '✗';
  console.log('  ' + ok + ' ' + c.table.padEnd(28) + ' ' + count + note);
}

console.log('\n=== Step 4: Sample rows from each table ===');
const { data: comps } = await supabase.from('companionships').select('id, companion1_name, companion2_name, leader_id').order('companion1_name').limit(3);
console.log('  companionships (first 3):');
comps.forEach(c => console.log('    ' + JSON.stringify(c)));

const { data: hhs } = await supabase.from('households').select('id, family_name').order('family_name').limit(3);
console.log('  households (first 3):');
hhs.forEach(h => console.log('    ' + JSON.stringify(h)));

const { data: links } = await supabase.from('companionship_households').select('*').limit(3);
console.log('  companionship_households (first 3):');
links.forEach(l => console.log('    ' + JSON.stringify(l)));

console.log('\n=== Step 5: Leaders preserved ===');
const { data: leaders } = await supabase.from('leaders').select('id, role, name').order('id');
leaders.forEach(l => console.log('  ' + l.id.padEnd(10) + ' ' + (l.role || '').padEnd(10) + ' ' + l.name));

console.log('\n=== Step 6: Companion counts per leader ===');
const { data: byLeader } = await supabase.from('companionships').select('leader_id');
const counts = {};
byLeader.forEach(r => { counts[r.leader_id] = (counts[r.leader_id] || 0) + 1; });
for (const [lid, n] of Object.entries(counts).sort()) console.log('  ' + lid.padEnd(10) + ' → ' + n + ' companionships');

console.log('\n=== Step 7: District 1 sample (matches seed Behymer/Tower?) ===');
const { data: d1 } = await supabase.from('companionships').select('id, companion1_name, companion2_name').ilike('companion1_name', 'Behymer%');
console.log('  ' + JSON.stringify(d1));
