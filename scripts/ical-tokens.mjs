// One-off migration for the iCal subscription feed (task: cs-ical-feeds).
//
// Adds `leaders.ical_token` (idempotent) and generates a token for any leader
// missing one. Token format: crypto.randomBytes(24).toString('base64url').
//
// Usage (set DATABASE_URL from your Supabase connection string):
//   DATABASE_URL="postgresql://..." node scripts/ical-tokens.mjs
//
// Re-running is safe: leaders that already have a token are left untouched.
import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL env var is required.');
  process.exit(1);
}

// The four leaders who get a personal calendar feed.
const LEADER_IDS = ['cole', 'kawika', 'sean', 'braden'];

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // 1. Add the column (idempotent).
  await client.query('ALTER TABLE leaders ADD COLUMN IF NOT EXISTS ical_token TEXT;');
  console.log('OK   ALTER TABLE leaders ADD COLUMN IF NOT EXISTS ical_token TEXT;');

  // 2. Populate a token for any leader missing one.
  for (const id of LEADER_IDS) {
    const token = crypto.randomBytes(24).toString('base64url');
    const res = await client.query(
      'UPDATE leaders SET ical_token = $1 WHERE id = $2 AND ical_token IS NULL RETURNING id',
      [token, id],
    );
    if (res.rowCount > 0) {
      console.log(`OK   generated ical_token for leader '${id}'`);
    } else {
      console.log(`SKIP leader '${id}' already has ical_token`);
    }
  }

  // 3. Report final coverage (no token values echoed here).
  const { rows } = await client.query('SELECT id, name, ical_token FROM leaders ORDER BY id');
  console.log('\nLeader → ical_token coverage:');
  for (const r of rows) {
    console.log(`  ${r.id}\t${r.name}\t${r.ical_token ? 'SET' : 'MISSING'}`);
  }

  await client.end();
}

main().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
