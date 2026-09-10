// End-to-end smoke test: ministering iCal feeds (feat/ical-feed-subscriptions).
// Flow: wipe test data → admin publishes a cole window → companion books the
// 14:15 sub-slot via the real POST /api/bookings path (slot_time persisted) →
// fetch leader + companionship feeds, assert VEVENT shapes/headers → cancel +
// rebook at a different time → feed reflects the change (refresh semantics) →
// cleanup leaves the DB exactly as found.
import fs from 'fs';

const env = fs.readFileSync(process.env.HOME + '/.openclaw/workspace/.secrets/church-scheduler.env', 'utf8');
const get = (k) => env.split('\n').find((l) => l.startsWith(k + '='))?.split('=').slice(1).join('=');
const SUPABASE_URL = get('SUPABASE_URL');
const SERVICE_KEY = get('SUPABASE_SERVICE_KEY');
const REST = { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' };

const BASE = 'http://localhost:3109';
const COLE_UUID = process.argv[2];   // leaders.uuid for cole
const COMP_ID = process.argv[3];     // companionships.id under cole
const ADMIN_H = { 'X-Mock-User': JSON.stringify({ id: '00000000-0000-0000-0000-000000000001', email: 'braden@example.com', role: 'admin', leader_id: 'braden' }), 'Content-Type': 'application/json' };
const COMP_EMAIL = 'smoke-ical-test@example.com';
const COMP_H = { 'X-Mock-User': JSON.stringify({ id: '00000000-0000-0000-0000-000000000009', email: COMP_EMAIL, role: 'companion' }), 'Content-Type': 'application/json' };

const json = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return t; } };
let failures = 0;
const check = (cond, msg) => { if (cond) console.log('  ok —', msg); else { failures++; console.error('  FAIL —', msg); } };
const vevents = (body) => (body.match(/BEGIN:VEVENT/g) || []).length;
// RFC 5545 folds long lines (>75 octets) with CRLF + space — unfold before matching.
const unfold = (body) => body.replace(/\r?\n /g, '');

// --- precondition: clear test residue (bookings cancelled + windows deleted) ---
const wipe = async () => {
  await fetch(`${SUPABASE_URL}/rest/v1/bookings?status=neq.cancelled`, { method: 'PATCH', headers: REST, body: JSON.stringify({ status: 'cancelled' }) });
  const dels = await fetch(`${SUPABASE_URL}/rest/v1/availability_windows?leader_id=eq.cole`, { method: 'DELETE', headers: REST });
  check(dels.ok, 'precondition wipe (cole windows deleted)');
  await fetch(`${SUPABASE_URL}/rest/v1/companionships?id=eq.${COMP_ID}`, { method: 'PATCH', headers: REST, body: JSON.stringify({ companion1_email: COMP_EMAIL }) });
};
await wipe();

const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + 12 * 864e5));

console.log('1) publish cole window 2026-' + dateStr.slice(5) + ' 14:00-15:00 (15-min slots)');
let r = await fetch(`${BASE}/api/availability/cole/windows`, { method: 'POST', headers: ADMIN_H, body: JSON.stringify({ window_date: dateStr, start_time: '14:00', end_time: '15:00', slot_duration_minutes: 15, buffer_minutes: 0 }) });
let win = await json(r);
check(r.ok && win.id, `publish window (${r.status})`);
const WINDOW_ID = win.id;

console.log('2) companionship books the 14:15 sub-slot');
r = await fetch(`${BASE}/api/bookings`, { method: 'POST', headers: COMP_H, body: JSON.stringify({ companionship_id: COMP_ID, window_id: WINDOW_ID, scheduled_date: dateStr, slot_time: '14:15' }) });
let bk = await json(r);
check(r.ok && bk.id, `booking created (${r.status})`);
check(bk.window_id === WINDOW_ID, 'booking anchored to window');
check(String(bk.slot_time).slice(0, 5) === '14:15', `slot_time persisted (${bk.slot_time})`);
const BOOKING_ID = bk.id;

const fetchFeed = async (path) => {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.text();
  return { status: res.status, ctype: res.headers.get('content-type'), disp: res.headers.get('content-disposition'), cache: res.headers.get('cache-control'), robots: res.headers.get('x-robots-tag'), body };
};

console.log('3) leader feed');
let f = await fetchFeed(`/ical/leader/${COLE_UUID}.ics`);
check(f.status === 200, `status ${f.status}`);
check(f.ctype.startsWith('text/calendar'), `Content-Type ${f.ctype}`);
check(f.disp.includes(`leader-${COLE_UUID}.ics`), `Content-Disposition ${f.disp}`);
check(f.cache === 'public, max-age=300', `Cache-Control ${f.cache}`);
check(f.robots === 'noindex', `X-Robots-Tag ${f.robots}`);
check(vevents(f.body) === 2, `exactly 2 VEVENTs (window + booking), got ${vevents(f.body)}`);
check(f.body.includes('BEGIN:VCALENDAR') && f.body.includes('END:VCALENDAR'), 'calendar wrapper');
check(f.body.includes('TRANSP:TRANSPARENT') && f.body.includes('TRANSP:OPAQUE'), 'TRANSP on both event types');
check(f.body.includes('— Available for ministering'), 'window SUMMARY');
check(f.body.includes('Visit with'), 'booking SUMMARY');
check(f.body.includes(`UID:win-${WINDOW_ID}@church-scheduler`) && f.body.includes(`UID:bk-${BOOKING_ID}@church-scheduler`), 'UIDs');
check(f.body.includes(`DTSTART:${dateStr.replace(/-/g, '')}T141500`), 'booking DTSTART = 14:15');
check(f.body.includes(`DTEND:${dateStr.replace(/-/g, '')}T143000`), 'booking DTEND = 14:30 (15-min slot)');
check(unfold(f.body).includes(`/book?leader=cole&window=${WINDOW_ID}`), 'window URL back to booking page');
check(new RegExp(`URL:[^\r\n]*/visit/${BOOKING_ID}\\b`).test(unfold(f.body)), 'booking URL line points to /visit/<booking_id>');

console.log('4) companionship feed');
f = await fetchFeed(`/ical/companionship/${COMP_ID}.ics`);
check(f.status === 200 && vevents(f.body) === 2, `status ${f.status}, ${vevents(f.body)} VEVENTs`);
check(f.body.includes('TRANSP:TRANSPARENT') && f.body.includes('TRANSP:OPAQUE'), 'both event types present');
check(f.body.includes('Companionship: '), 'booking DESCRIPTION names the companionship');
check(new RegExp(`URL:[^\r\n]*/visit/${BOOKING_ID}\\b`).test(unfold(f.body)), 'companionship feed booking URL points to /visit/<booking_id>');

fs.writeFileSync('/tmp/feed.ics', (await (await fetch(`${BASE}/ical/leader/${COLE_UUID}.ics`)).text()));

console.log('5) refresh semantics — rebook 14:45, feed must update');
await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${BOOKING_ID}`, { method: 'PATCH', headers: REST, body: JSON.stringify({ status: 'cancelled' }) });
r = await fetch(`${BASE}/api/bookings`, { method: 'POST', headers: COMP_H, body: JSON.stringify({ companionship_id: COMP_ID, window_id: WINDOW_ID, scheduled_date: dateStr, slot_time: '14:45' }) });
bk = await json(r);
check(r.ok && bk.id, `rebooked 14:45 (${r.status})`);
f = await fetchFeed(`/ical/leader/${COLE_UUID}.ics`);
check(vevents(f.body) === 2, 'still 2 VEVENTs (old one cancelled)');
check(!f.body.includes('T141500') && f.body.includes('T144500'), 'feed no longer shows 14:15, now shows 14:45');

console.log('6) unknown uuids 404 cleanly');
f = await fetchFeed('/ical/leader/00000000-0000-0000-0000-000000000000.ics');
check(f.status === 404, `unknown leader uuid → ${f.status}`);
f = await fetchFeed('/ical/leader/not-a-uuid.ics');
check(f.status === 404, `malformed uuid → ${f.status}`);
f = await fetchFeed('/ical/leader/00000000-0000-0000-0000-000000000000.ics?key=x');
check(f.status === 404, `unknown comp-style uuid → ${f.status}`);

console.log('7) cleanup — restore DB to empty state');
await fetch(`${SUPABASE_URL}/rest/v1/bookings?status=neq.cancelled`, { method: 'PATCH', headers: REST, body: JSON.stringify({ status: 'cancelled' }) });
await fetch(`${SUPABASE_URL}/rest/v1/availability_windows?leader_id=eq.cole`, { method: 'DELETE', headers: REST });
await fetch(`${SUPABASE_URL}/rest/v1/companionships?id=eq.${COMP_ID}`, { method: 'PATCH', headers: REST, body: JSON.stringify({ companion1_email: null }) });
f = await fetchFeed(`/ical/leader/${COLE_UUID}.ics`);
check(f.status === 200 && vevents(f.body) === 0, `cleanup: leader feed empty (${vevents(f.body)} events)`);

console.log(failures ? `\nSMOKE: FAILED (${failures})` : '\nSMOKE: PASSED');
process.exit(failures ? 1 : 0);
