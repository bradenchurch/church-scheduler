import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const MIGRATION = new URL('../supabase/migrations/20261008000000_availability_windows_integrity.sql', import.meta.url);

function psqlPrefix() {
  try {
    execFileSync('psql', ['-d', 'postgres', '-c', 'select 1'], { encoding: 'utf8', stdio: 'pipe' });
    return ['psql'];
  } catch {
    return ['sudo', '-u', 'postgres', 'psql'];
  }
}

const PSQL = psqlPrefix();

function psql(database, sql, { tuples = true } = {}) {
  const args = ['-d', database, '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'];
  if (tuples) args.push('-t', '-A');
  args.push('-c', sql);
  return execFileSync(PSQL[0], [...PSQL.slice(1), ...args], { encoding: 'utf8' }).trim();
}

function psqlFile(database, file) {
  execFileSync(PSQL[0], [...PSQL.slice(1), '-d', database, '-v', 'ON_ERROR_STOP=1', '-f', file], { encoding: 'utf8' });
}

test('migration rejects copies and overlaps, allows touching windows, and makes ON CONFLICT a no-op', () => {
  const database = `avail_mig_${process.pid}`;
  psql('postgres', `DROP DATABASE IF EXISTS ${database}`, { tuples: false });
  psql('postgres', `CREATE DATABASE ${database}`, { tuples: false });
  try {
    psql(database, `
      create table public.leaders (id text primary key);
      insert into public.leaders values ('cole');
      create table public.availability_windows (
        id uuid primary key default gen_random_uuid(),
        leader_id text not null references public.leaders(id),
        window_date date not null,
        start_time time not null,
        end_time time not null,
        slot_duration_minutes integer not null default 30,
        buffer_minutes integer not null default 0,
        created_at timestamptz not null default now(),
        check (end_time > start_time)
      );
      create table public.bookings (
        id uuid primary key default gen_random_uuid(),
        window_id uuid references public.availability_windows(id)
      );
      create table public.oauth_tokens (user_id uuid primary key);
      insert into public.availability_windows (leader_id, window_date, start_time, end_time, created_at)
      values
        ('cole', '2026-10-08', '19:00', '21:00', '2026-10-01'),
        ('cole', '2026-10-08', '19:00', '21:00', '2026-10-02');
    `);

    const dupes = psql(database, `
      select count(*) from (
        select leader_id, window_date, start_time, end_time
        from public.availability_windows
        group by leader_id, window_date, start_time, end_time
        having count(*) > 1
      ) d;
    `);
    assert.equal(dupes, '1');

    psql(database, `
      begin;
      with ranked as (
        select id, first_value(id) over w as keep_id, row_number() over w as rn
        from public.availability_windows
        window w as (partition by leader_id, window_date, start_time, end_time order by created_at, id)
      )
      update public.bookings b set window_id = r.keep_id
      from ranked r where b.window_id = r.id and r.rn > 1;
      with ranked as (
        select id, row_number() over (partition by leader_id, window_date, start_time, end_time order by created_at, id) as rn
        from public.availability_windows
      )
      delete from public.availability_windows w using ranked r where w.id = r.id and r.rn > 1;
      commit;
    `);
    assert.equal(psql(database, 'select count(*) from public.availability_windows'), '1');

    psql('postgres', `
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      end $$;
    `, { tuples: false });

    psqlFile(database, MIGRATION.pathname);

    let copyCode = '';
    try {
      psql(database, `
        insert into public.availability_windows (leader_id, window_date, start_time, end_time)
        values ('cole', '2026-10-08', '19:00', '21:00');
      `);
    } catch (error) {
      copyCode = `${error.stderr || error.message}`;
    }
    assert.match(copyCode, /23505/);

    let overlapCode = '';
    try {
      psql(database, `
        insert into public.availability_windows (leader_id, window_date, start_time, end_time)
        values ('cole', '2026-10-08', '19:30', '20:30');
      `);
    } catch (error) {
      overlapCode = `${error.stderr || error.message}`;
    }
    assert.match(overlapCode, /23P01/);

    psql(database, `
      insert into public.availability_windows (leader_id, window_date, start_time, end_time)
      values ('cole', '2026-10-08', '21:00', '22:00');
    `);
    assert.equal(psql(database, 'select count(*) from public.availability_windows'), '2');

    const conflict = psql(database, `
      insert into public.availability_windows (leader_id, window_date, start_time, end_time)
      values ('cole', '2026-10-08', '19:00', '21:00')
      on conflict (leader_id, window_date, start_time, end_time) do nothing;
    `, { tuples: false });
    assert.match(conflict, /INSERT 0 0/);

    let bufferCode = '';
    try {
      psql(database, `
        insert into public.availability_windows (leader_id, window_date, start_time, end_time, buffer_minutes)
        values ('cole', '2026-10-09', '19:00', '21:00', 7);
      `);
    } catch (error) {
      bufferCode = `${error.stderr || error.message}`;
    }
    assert.match(bufferCode, /23514/);

    let rolledBack = '';
    try {
      psql(database, `
        select public.availability_replace_windows(
          'cole',
          (select coalesce(array_agg(id), '{}') from public.availability_windows where window_date = '2026-10-08'),
          '[{"window_date":"2026-10-08","start_time":"18:00","end_time":"22:00","slot_duration_minutes":30,"buffer_minutes":7}]'::jsonb
        );
      `);
    } catch (error) {
      rolledBack = `${error.stderr || error.message}`;
    }
    assert.match(rolledBack, /23514/);
    assert.equal(psql(database, "select count(*) from public.availability_windows where window_date = '2026-10-08'"), '2');

    psql(database, `
      select public.availability_replace_windows(
        'cole',
        (select coalesce(array_agg(id), '{}') from public.availability_windows where window_date = '2026-10-08'),
        '[{"window_date":"2026-10-08","start_time":"18:00","end_time":"22:00","slot_duration_minutes":30,"buffer_minutes":0}]'::jsonb
      );
    `);
    assert.equal(psql(database, "select count(*) from public.availability_windows where window_date = '2026-10-08'"), '1');
    assert.equal(
      psql(database, "select to_char(start_time, 'HH24:MI') || ' ' || to_char(end_time, 'HH24:MI') from public.availability_windows where window_date = '2026-10-08'"),
      '18:00 22:00',
    );
    assert.match(
      psql(database, "select proconfig::text from pg_proc where proname = 'availability_replace_windows'"),
      /search_path=/,
    );
    assert.equal(
      psql(database, "select has_function_privilege('anon', 'public.availability_replace_windows(text, uuid[], jsonb)', 'execute')"),
      'f',
    );
    assert.equal(
      psql(database, "select has_function_privilege('authenticated', 'public.availability_replace_windows(text, uuid[], jsonb)', 'execute')"),
      'f',
    );
  } finally {
    psql('postgres', `DROP DATABASE IF EXISTS ${database}`, { tuples: false });
  }
});
