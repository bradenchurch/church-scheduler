# Admin Dashboard Analytics — Report

Branch: `feat/admin-dashboard-analytics` · Worktree: `~/.openclaw/workspace/church-scheduler-tasks/cs-admin-dashboard/`

## Summary

Built the Analytics & "Who Hasn't Scheduled?" action-list page at `/admin/dashboard` for the
Custom Calendly for Elders Quorum feature set.

## What was built

### 1. API endpoints (`server/index.js`)

**`GET /api/admin/analytics`** — gated by `requireSession` + `requireRole('leader')`
(admits admin + leader, rejects companions with 403; unauthenticated → 401). Returns:

- `total_companionships`, `booked_count`, `completed_count`, `pending_count`
- `ward_completion_rate` (%) — completed / total, rounded to 1 decimal
- `open_slots_count` — unbooked future-dated availability windows + unbooked recurring slots
- `district_breakdown[]` — one entry per presidency member with assigned companionships
  (`leader_id`, `leader_name`, `total`, `booked`, `completed`, `pending`, `completion_rate`)
- `companionships_status[]` — every companionship with `id`, `elder1_name`, `elder2_name`,
  `leader_name`, `leader_id`, `status` (`pending` | `booked` | `completed`), `booking_id`,
  `booking_date`, `booking_time`, `unique_booking_url`, `slug`

Per-companionship status is derived from its **most recent non-cancelled booking** (no booking →
`pending`; a `completed` booking → `completed`; otherwise `booked`).

**`POST /api/bookings/:id/complete`** — marks a booking `completed`. Gated: admin, or the leader
who owns the companionship (mirrors the existing `PUT /api/bookings/:id/status` scoping).

### 2. Dashboard UI (`src/pages/AdminDashboard.jsx`)

- **Top metric cards** — Ward Completion Rate, Open Slot Capacity vs remaining unscheduled,
  Overall Ward Status ("X / 60 completed / scheduled").
- **District breakdown** — 3 cards (Cole → amber, Kawika → sage, Sean → rose) with a progress
  bar (scheduled = booked + completed) and a `completion_rate` percentage.
- **Action list** — tabs `Unscheduled | Scheduled | Completed | All` with live counts; card list
  showing companionship names + leader + status badge. Unscheduled rows get a **Text Invite**
  (`sms:?body=…` pre-filled with the unique booking link) and a **Copy Link** fallback. Scheduled
  rows get a **Mark Complete** button wired to `POST /api/bookings/:id/complete`.

### 3. Routing & navigation

- `/admin/dashboard` registered in `src/App.jsx` under `ProtectedRoute requireRole="leader"`.
- "Analytics" link added to `src/components/Nav.jsx` (admin + leader block).
- "Analytics Dashboard" card added to `src/pages/Admin.jsx`.

### 4. Deep-link support (`src/pages/Book.jsx`)

`/book?companionship=<id>` now auto-selects the companionship so the "Text Invite" / "Copy Link"
URL lands a companion directly on their interviewer's available times (previously the Book page
only supported last-name search).

## Verification

| Check | Result |
| --- | --- |
| `npm run build` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors (3 pre-existing warnings only: `AuthContext` fast-refresh, unused `_e`/`err`) |
| `node --check server/index.js` | ✅ valid |
| MOCK_AUTH smoke test `/api/admin/analytics` | ✅ 401 unauthenticated, 403 companion, 200 leader/admin with real data (60 companionships; districts Cole 19 / Kawika 19 / Sean 22) |
| `POST /api/bookings/:id/complete` smoke test | ✅ 404 for unknown id; ownership gate intact |
| Headless Chrome screenshot | ✅ `screenshots/admin-dashboard.png` (1280×1400, rendered with design tokens) |

## Notes / decisions

- **Schema drift handled:** the target Supabase DB does not yet have `bookings.window_id`
  (schema.sql declares it via `ALTER TABLE … ADD COLUMN IF NOT EXISTS`). The analytics endpoint
  degrades gracefully — it first selects `window_id`, and falls back to a `window_id`-less select
  if the column is missing (same best-effort pattern already used for `availability_windows`).
- **`ward_completion_rate`** = completed / total (true "done" interviews). The UI shows scheduled
  (booked + completed) separately via the "Overall Ward Status" card and district bars.
- **District leaders** are resolved from `companionships.leader_id`, so the secretary (`braden`,
  who has no companionships) correctly drops out of the district breakdown.
- No force-push, no `--admin` merge, no auto-merge — PR opened for Braden to review/merge.
