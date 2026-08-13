// One-off migration runner for church-scheduler OAuth + notifications tables.
//
// Usage (set DATABASE_URL from your Supabase connection string):
//   DATABASE_URL="postgresql://..." node scripts/migrate.js
//
// The migrations below are idempotent and were already applied to production
// (2026-08-13). Re-running is safe.
import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL env var is required.');
  process.exit(1);
}

const statements = [
  // OAuth tokens (adapted: references auth.users instead of profiles, which does not exist in this project)
  `create table if not exists oauth_tokens (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade unique,
    email text,
    provider text not null default 'google',
    access_token text not null,
    refresh_token text,
    expires_at timestamptz,
    scopes text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );`,

  // Confirmation log for calendar + email delivery results
  `create table if not exists confirmation_log (
    id uuid primary key default uuid_generate_v4(),
    booking_id uuid references bookings(id) on delete cascade,
    channel text not null check (channel in ('calendar','email')),
    status text not null check (status in ('sent','failed')),
    recipient text not null,
    error text,
    sent_at timestamptz not null default now()
  );`,

  // Elder email addresses (do not exist anywhere in the current schema)
  `alter table companionships
    add column if not exists companion1_email text,
    add column if not exists companion2_email text;`,

  // Secure the token + log tables: deny anon access, allow service role only.
  `alter table oauth_tokens enable row level security;`,
  `alter table confirmation_log enable row level security;`,
];

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log('OK   ', sql.trim().split('\n')[0].slice(0, 72));
    } catch (err) {
      console.error('FAIL ', sql.trim().split('\n')[0].slice(0, 72));
      console.error('      ', err.message);
    }
  }

  await client.end();
}

main().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
