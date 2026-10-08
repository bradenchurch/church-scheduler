begin;

-- Supabase keeps btree_gist in the extensions schema. Create that schema on a
-- vanilla Postgres so this file also applies locally. `set local search_path`
-- lets the GiST text operator class resolve during the exclusion constraint.
create schema if not exists extensions;
set local search_path = public, extensions;

-- Needed so a GiST index can mix text equality with range overlap.
create extension if not exists btree_gist with schema extensions;

alter table public.availability_windows
  add column if not exists series_id uuid;

comment on column public.availability_windows.series_id is
  'Set once per save (pattern or single add). Used for idempotent retries, highlight-after-save, delete series, and undo.';

-- Exact-duplicate guard and ON CONFLICT arbiter.
alter table public.availability_windows
  add constraint availability_windows_unique_window
  unique (leader_id, window_date, start_time, end_time);

-- No overlapping windows for one leader on one date. '[)' lets 7-8 and 8-9 touch.
alter table public.availability_windows
  add constraint availability_windows_no_overlap
  exclude using gist (
    leader_id with =,
    tsrange(window_date + start_time, window_date + end_time, '[)') with &&
  );

-- schema.sql declares this, but it never landed live (column was added by ALTER).
alter table public.availability_windows
  add constraint availability_windows_buffer_minutes_check
  check (buffer_minutes in (0, 5, 10));

create index if not exists idx_availability_windows_series
  on public.availability_windows (series_id) where series_id is not null;

-- Confirmations look the token up by the presidency member, not the Google
-- account email stored on the row. The server omits this column until it exists.
alter table public.oauth_tokens
  add column if not exists leader_id text;

comment on column public.oauth_tokens.leader_id is
  'leaders.id of the member who connected Google. Filled from the OAuth callback so a personal Gmail still receives confirmations.';

-- One transaction for a merge: drop the old rows, then insert the combined span.
-- A failed insert rolls the deletes back, so a conflict cannot drop time.
create or replace function public.availability_replace_windows(
  p_leader_id text,
  p_delete_ids uuid[],
  p_rows jsonb
) returns jsonb
language plpgsql
as $$
declare
  inserted jsonb;
begin
  if p_leader_id is null or length(p_leader_id) = 0 then
    raise exception 'leader required' using errcode = '22023';
  end if;

  delete from public.availability_windows
  where leader_id = p_leader_id
    and id = any(coalesce(p_delete_ids, '{}'::uuid[]));

  with incoming as (
    select *
    from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as r(
      window_date date,
      start_time time,
      end_time time,
      slot_duration_minutes int,
      buffer_minutes int,
      series_id uuid
    )
  ),
  written as (
    insert into public.availability_windows (
      leader_id, window_date, start_time, end_time, slot_duration_minutes, buffer_minutes, series_id
    )
    select
      p_leader_id,
      window_date,
      start_time,
      end_time,
      slot_duration_minutes,
      coalesce(buffer_minutes, 0),
      series_id
    from incoming
    returning id, leader_id, window_date, start_time, end_time, slot_duration_minutes, buffer_minutes, series_id, created_at
  )
  select coalesce(jsonb_agg(to_jsonb(written)), '[]'::jsonb) into inserted from written;

  return inserted;
end;
$$;

revoke all on function public.availability_replace_windows(text, uuid[], jsonb) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.availability_replace_windows(text, uuid[], jsonb) to service_role;
  end if;
end $$;

commit;
