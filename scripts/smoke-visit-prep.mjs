// Smoke test: public visit-prep endpoint + iCal booking VEVENT URL line
// (feat/visit-prep-view). Flow: publish a cole window → companionship books a
// sub-slot with notes → GET /api/visit/:id asserts the JSON contract → leader
// .ics asserts URL: line points at /visit/<bookingId> while the window VEVENT
// keeps its /book URL → cancel the booking and assert the endpoint 404s →
// cleanup leaves the DB as found.
import fs from 'fs';

const env = fs.readFileSync(process.env.HOME + '/.openclaw/workspace/.secrets/church-scheduler.env', 'utf8');
const get = (k) => env.split('\n').find((l) => l.startsWith(k + '='))?.split('=').slice(1).join('=');
const SUPABASE_URL = get('SUPABASE_URL');
const SERVICE_KEY = get('SUPABASE_SERVICE_KEY');
const REST = { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' };

const BASE = process.env.BASE || 'http://localhost:3109';
const COMP_ID = process.argv[2] || '03272b93-3656-4b8f-8313-8ddd9d70e48e'; // cole comp w/ 3 households
const COLE_UUID = process.argv[3] || 'bdc93e62-b526-4dd2-823f-aec37379efcc';
const ADMIN_H = { 'X-Mock-User': JSON.stringify({ id: '00000000-0000-0000-0000-000000000001', email: 'braden@example.com', role: 'admin', leader_id: 'braden' }), 'Content-Type': 'application/json' };
const COMP_EMAIL = 'smoke-visit-prep@example.com';
const COMP_H = { 'X-Mock-User': JSON.stringify({ id: '00000000-0000-0000-0000-000000000009', email: COMP_EMAIL, role: 'companion' }), 'Content-Type': 'application/json' };

const json = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return t; } };
let failures = 0;
const check = (cond, msg) => { if (cond) console.log('  ok —', msg); else { failures++; console.error('  FAIL —', msg); } };
const unfold = (body) => body.replace(/\r?\n /g, '');

// --- read prior companion1_email so cleanup can restore it ---
const compRes = await fetch(`${SUPABASE_URL}/rest/v1/companionships?id=eq.${COMP_ID}&select=companion1_email`, { headers: REST });
const [compRow] = await compRes.json();
const PRIOR_EMAIL = compRow?.companion1_email ?? null;
const bookingIds = [];

try {
  console.log('0) precondition — record prior email', JSON.stringify(PRIOR_EMAIL));

  console.log('1) set test companion email + publish cole window (+12d, 14:00–15:00, 30-min slots)');
  let r = await fetch(`${SUPABASE_URL}/rest/v1/companionships?id=eq.${COMP_ID}`, { method: 'PATCH', headers: REST, body: JSON.stringify({ companion1_email: COMP_EMAIL }) });
  check(r.ok, 'companion email set for mock companion auth');

  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + 12 * 864e5));
  r = await fetch(`${BASE}/api/availability/cole/windows`, { method: 'POST', headers: ADMIN_H, body: JSON.stringify({ window_date: dateStr, start_time: '14:00', end_time: '15:00', slot_duration_minutes: 30, buffer_minutes: 0 }) });
  const win = await json(r);
  check(r.ok && win.id, `window published (${r.status})`);
  const WINDOW_ID = win.id;

  console.log('2) companionship books the 14:30 sub-slot with notes');
  r = await fetch(`${BASE}/api/bookings`, { method: 'POST', headers: COMP_H, body: JSON.stringify({ companionship_id: COMP_ID, window_id: WINDOW_ID, scheduled_date: dateStr, slot_time: '14:30', notes: 'Smoke test visit — please ignore.' }) });
  const bk = await json(r);
  check(r.ok && bk.id, `booking created (${r.status})`);
  bookingIds.push(bk.id);
  const BOOKING_ID = bk.id;

  console.log('3) GET /api/visit/:id — JSON contract');
  r = await fetch(`${BASE}/api/visit/${BOOKING_ID}`);
  const visit = await json(r);
  check(r.ok, `endpoint reachable (${r.status})`);
  check(visit?.booking?.id === BOOKING_ID, 'booking.id echoes');
  check(String(visit?.booking?.date) === dateStr, `booking.date ${visit?.booking?.date}`);
  check(visit?.booking?.time === '14:30', `booking.time ${visit?.booking?.time}`);
  check(visit?.booking?.duration_minutes === 30, `booking.duration_minutes ${visit?.booking?.duration_minutes}`);
  check(visit?.booking?.status === 'booked', `booking.status ${visit?.booking?.status}`);
  check(visit?.booking?.notes === 'Smoke test visit — please ignore.', 'booking.notes surfaced');
  check(visit?.companionship?.id === COMP_ID, 'companionship.id echoes');
  check(Array.isArray(visit?.companionship?.companions) && visit.companionship.companions.length === 2, `companions count ${visit?.companionship?.companions?.length}`);
  const wantHouseholds = ['Dunyon', 'Everitt', 'Thompson'];
  check(JSON.stringify(visit?.companionship?.households) === JSON.stringify(wantHouseholds), `households sorted+distinct ${JSON.stringify(visit?.companionship?.households)}`);
  check(visit?.leader?.id === 'cole' && visit?.leader?.name === 'Cole Chollet', `leader ${JSON.stringify(visit?.leader?.name)}`);
  check(visit?.leader?.calling === 'Elders Quorum President', `leader.calling ${visit?.leader?.calling}`);
  const leaked = ['phone', 'address', 'email', 'head_', 'companion1_email'];
  const flat = JSON.stringify(visit).toLowerCase();
  check(!leaked.some((k) => flat.includes(k)), 'no PII beyond the contract');

  console.log('4) leader .ics — booking VEVENT now carries URL: /visit/:id; window VEVENT keeps /book URL');
  const feedRes = await fetch(`${BASE}/ical/leader/${COLE_UUID}.ics`);
  const feed = await feedRes.text();
  check(feedRes.ok && feed.includes('BEGIN:VCALENDAR'), 'feed served');
  const u = unfold(feed);
  // ICAL_BASE_URL falls back to the prod URL when PUBLISH_BASE_URL is unset
  // locally — either host is acceptable; the path + booking id are what matter.
  const visitUrlMatch = new RegExp(`URL:https?://[^/]+/visit/${BOOKING_ID}`);
  const bookUrlMatch = new RegExp(`URL:https?://[^/]+/book\\?leader=cole&window=${WINDOW_ID}`);
  check(visitUrlMatch.test(u), 'booking VEVENT URL → /visit/<bookingId>');
  check(bookUrlMatch.test(u), 'window VEVENT still URLs to /book');
  fs.writeFileSync('/tmp/visit-prep-leader-feed.ics', feed);

  console.log('5) cancelled booking → 404');
  r = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${BOOKING_ID}`, { method: 'PATCH', headers: REST, body: JSON.stringify({ status: 'cancelled' }) });
  check(r.ok, 'booking cancelled via REST');
  r = await fetch(`${BASE}/api/visit/${BOOKING_ID}`);
  check(r.status === 404 && (await json(r))?.error === 'not_found', `cancelled booking 404s (${r.status})`);

  console.log('6) garbage id → 404; missing window keeps booking viewable is N/A here');
  r = await fetch(`${BASE}/api/visit/00000000-0000-0000-0000-000000000000`);
  check(r.status === 404, `unknown booking 404s (${r.status})`);

  console.log('--- cleaning up test data ---');
  for (const id of bookingIds) {
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, { method: 'DELETE', headers: REST });
  }
  await fetch(`${SUPABASE_URL}/rest/v1/availability_windows?id=eq.${WINDOW_ID}`, { method: 'DELETE', headers: REST });
  const restoreEmail = PRIOR_EMAIL === null ? { companion1_email: null } : { companion1_email: PRIOR_EMAIL };
  await fetch(`${SUPABASE_URL}/rest/v1/companionships?id=eq.${COMP_ID}`, { method: 'PATCH', headers: REST, body: JSON.stringify(restoreEmail) });
  const postCleanup = await fetch(`${BASE}/api/visit/${BOOKING_ID}`);
  check(postCleanup.status === 404, 'post-cleanup booking is gone (404)');
  console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
} catch (err) {
  console.error('smoke error:', err.message);
  for (const id of bookingIds) {
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, { method: 'DELETE', headers: REST }).catch(() => {});
  }
  process.exit(1);
}
