// Migration for the ministering iCal feed subscriptions (task: cs-ical-feeds).
//
// Adds the two columns the /ical/*.ics endpoints depend on (idempotent):
//   1. leaders.uuid        — public feed identifier (unguessable secret in the
//                            subscription URL, no auth on the feed endpoint)
//   2. bookings.slot_time  — exact wall-clock start of the booked appointment,
//                            so feeds can render a precise DTSTART/DTEND
//
// Usage (set DATABASE_URL from your Supabase connection string):
//   DATABASE_URL="postgresql://..." node scripts/ical-feed-migrations.js
//
// Also syncs the live availability_windows table with schema.sql (the
// buffer_minutes column was added to schema.sql Aug 2026 but never applied to
// the live DB — without it the publish-window endpoints 500 on every insert
// because the client always sends buffer_minutes).
//
// Safe to re-run: every statement is idempotent (ADD COLUMN IF NOT EXISTS /
// conditional UPDATE). Adds columns only — no data is dropped or rewritten
// beyond backfilling the two new columns.
import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL env var is required.');
  process.exit(1);
}

const statements = [
  `ALTER TABLE leaders ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();`,
  `UPDATE leaders SET uuid = gen_random_uuid() WHERE uuid IS NULL;`,
  `ALTER TABLE leaders ALTER COLUMN uuid SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE leaders ALTER COLUMN uuid SET NOT NULL;`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_time TIME;`,
  `ALTER TABLE availability_windows ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER NOT NULL DEFAULT 0;`,
  `UPDATE bookings b SET slot_time = w.start_time
     FROM availability_windows w
    WHERE b.window_id = w.id AND b.slot_time IS NULL;`,
  `UPDATE bookings b SET slot_time = s.start_time
     FROM slots s
    WHERE b.slot_id = s.id AND b.slot_time IS NULL;`,
];

const client = new Client({ connectionString: DATABASE_URL });

try {
  await client.connect();
  for (const sql of statements) {
    await client.query(sql);
    console.log(`OK   ${sql.replace(/\s+/g, ' ').trim().slice(0, 100)}`);
  }
  const { rows } = await client.query(
    'SELECT id, name, uuid FROM leaders ORDER BY id',
  );
  console.log('\nLeaders → uuid coverage:');
  for (const r of rows) console.log(`  ${r.id.padEnd(8)} ${r.uuid || '(null!)'}`);

  const { rows: b } = await client.query(
    `SELECT count(*)::int AS total,
            count(slot_time)::int AS with_slot_time
       FROM bookings`,
  );
  console.log(`\nBookings: ${b[0].with_slot_time}/${b[0].total} have slot_time`);
  console.log('\nMigration complete.');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
