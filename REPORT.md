# Leader Admin Access + iCal Feed — Report

PR: https://github.com/bradenchurch/church-scheduler/pull/30

Branch: `fix/leader-admin-access-ical` · Worktree: `~/.openclaw/workspace/church-scheduler-tasks/cs-leader-fixes/`

## Summary

Fixed two issues Braden hit on the live `/leader` page:

1. **Admin access** — admins got "insufficient permissions" on `/leader`. Root cause was
   deeper than a missing `leaderId`: the `leaders.role` column was referenced by the auth
   middleware but its DDL was never committed, so role resolution always failed and `role`
   resolved to `null` (which `ProtectedRoute` turns into "Access Denied").
2. **Legacy Google OAuth** — replaced the Google Calendar connection path with a 1-click
   **iCal Subscription Feed** box.

## What changed

### `server/index.js`
- `GET /api/bookings/:leaderId` and `POST /api/slots/:leaderId` now use `requireSession`
  (the MOCK_AUTH-aware middleware) instead of the local `requireAuth`, so admins can access
  any leader and MOCK_AUTH smoke tests exercise the admin path.
- Added `GET /api/leader/:leaderId/ical-token` (admin-or-owner) to return a specific leader's
  iCal token for the subscription URL.

### `src/pages/Leader.jsx`
- Admins get a **Leader selector** dropdown (Cole Chollet / Kawika Tupuola / Sean Bryan),
  defaulting to Cole. Non-admin leaders stay pinned to their own dashboard.
- Removed Google OAuth UI; added an **iCal Subscription Feed** box with a "Copy iCal
  Subscription Link" button and paste instructions for Apple / Google calendar.

### `schema.sql`
- Added `leaders.role` column (idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS`) and
  backfill: `braden` = admin, `cole`/`kawika`/`sean` = leader.

## Verification

| Check | Result |
| --- | --- |
| `npm run build` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors (3 pre-existing warnings) |
| `node --check server/index.js` | ✅ valid |
| MOCK_AUTH `GET /api/bookings/cole` (admin) | ✅ 200 |
| MOCK_AUTH `GET /api/slots/cole` (admin) | ✅ 200 |
| MOCK_AUTH `GET /api/leader/cole/ical-token` (admin) | ✅ 200 (token returned) |
| MOCK_AUTH non-admin leader → wrong leader | ✅ 403 |
| MOCK_AUTH missing `X-Mock-User` | ✅ 401 |

Smoke script: `scripts/smoke-leader-mock.sh` (sources `~/.openclaw/workspace/.secrets/church-scheduler*.env`).

## DB migration applied (shared Supabase `public` schema)

- `ALTER TABLE leaders ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'leader'`
- Backfilled: `braden` → `admin`, `cole`/`kawika`/`sean` → `leader`.
- Rotated iCal tokens from `church-scheduler-ical-tokens.env` were written to
  `leaders.ical_token` (previously NULL for all four leaders — the `/api/cal/:id.ics` feeds
  were non-functional without them).

## Notes / follow-ups

- **Human follow-up still pending:** the "communicate new iCal subscription URLs to each
  leader privately + re-subscribe" step from the rotation notes in
  `church-scheduler-ical-tokens.env` has **not** been done. The URLs now resolve, but leaders
  still need to be given their new `.ics` links.
- No force-push, no `--admin` merge, no auto-merge — PR opened for Braden to review/merge.
