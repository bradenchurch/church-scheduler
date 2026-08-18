# Executive Secretary Suite, Double-Booking Prevention & Rescheduling — Report

**Branch:** `feat/secretary-suite-and-reschedule`
**Scope:** Three feature groups requested by Braden:
1. Executive Secretary Suite (mobile-friendly) — co-admins by email, group-text invites,
   and an in-call "Call & Book" drawer.
2. Double-booking prevention — a prominent "already scheduled" banner on `/book` (and
   `/chapel`) backed by a server-side guard.
3. Reschedule / release slot — cancel the existing booking and reopen the picker.

## Changes

### 1. Co-Admins / Secretaries (`server/index.js` + `src/pages/Admin.jsx`)
- New endpoint `POST /api/admin/add-admin` — gated `requireSession` +
  `requireRole('admin')`. Accepts `{ email }`; if a `leaders` row already exists for
  that email it is promoted to `role='admin'` in place, otherwise a new secretary row
  is inserted (id derived from the email local-part, collision-safe, name humanized
  from the email). Returns `{ ok, leader, created }`.
- `Admin.jsx` gains an **Admins & Secretaries** card that lists every `role='admin'`
  leader (fed by the existing `/api/leaders` call) and a `+ Add Co-Admin` email form.

### 2. Double-Booking Prevention (`server/index.js` + `src/pages/Book.jsx` + `src/pages/Chapel.jsx`)
- New shared helper `findActiveBooking(companionshipId)` returns the most recent
  `booked`/`pending` booking.
- New endpoint `GET /api/companionships/:id/active-booking` (authenticated, any role)
  resolves the active booking's date, start time, duration, and assigned leader name,
  or `{ active: false }`.
- `Book.jsx` checks for an active booking on deep-link and on search selection. When
  one exists it renders an **Active Appointment** card — a sage banner
  ("Appointment Scheduled — {date} at {time} with {leader}") plus two primary actions:
  **Add to Calendar** (Google + `.ics`) and **Reschedule Appointment**.
- `Chapel.jsx` fetches the same active-booking info when a companion selects their
  name and shows a "✓ Appointment already scheduled" banner with a link to `/book`
  to reschedule.
- Server-side guard: `POST /api/bookings` now returns `409` when the companionship
  already holds an active booking, so the client banner is not the only line of defense.

### 3. Reschedule / Release Slot (`server/index.js` + `src/pages/Book.jsx`)
- New endpoint `POST /api/bookings/:id/reschedule` — gated `requireSession`. Ownership:
  admin, the assigned leader, **or the companion themself** (email match against
  `companion1_email` / `companion2_email`). Sets `status='cancelled'` and returns
  `{ ok, released, booking }`. Because bookings carry no per-slot capacity counter,
  "releasing" the slot is exactly this cancellation (analytics derive open capacity by
  excluding cancelled bookings).
- `Book.jsx` **Reschedule Appointment** button calls the endpoint, clears the active
  card, and reopens the slot picker with a "your previous appointment was released"
  note.

### 4. Group SMS & Mobile In-Call Drawer (`server/index.js` + `src/pages/AdminDashboard.jsx`)
- `computeRosterStatuses()` now enriches `companionships_status` with
  `companion1_phone` / `companion2_phone` (from the static roster via `splitCompanions`).
- **Group text invite:** the dashboard's "Text Invite" link now emits
  `sms:phone1,phone2?body=…` when both companions have numbers (falling back to a
  single phone, then to the body-only `sms:` link). Numbers are normalized for `sms:`
  URIs.
- **Call & Book drawer:** a new bottom-sheet modal on every action-list row shows
  tap-to-dial `tel:` links for each companion and the assigned leader's availability
  (recurring slots + date-specific windows). A **Book** button per slot books on
  behalf of the companionship via the new admin endpoint.
- New endpoint `POST /api/admin/bookings` — gated `requireSession` +
  `requireRole('admin')`. Mirrors `POST /api/bookings` (status `booked`,
  `handleBookingConfirmation` guarded) but skips the companion email-match gate and
  enforces the single-active-booking guard (`409`).

## Verification

| Check | Result |
| --- | --- |
| `npm run build` | ✅ 0 errors (pre-existing chunk-size warning only) |
| `npm run lint` (oxlint) | ✅ 0 errors (3 pre-existing warnings, unchanged) |
| `scripts/smoke-secretary-reschedule.sh` | ✅ 7/7 checks pass |
| `scripts/smoke-reschedule-roundtrip.sh` | ✅ active true→false around a reschedule, cleaned up |

Smoke (`MOCK_AUTH=true` + real Supabase) results:
- `GET /api/companionships/:id/active-booking` — 200 `{active:false}` (no booking), 401 (no auth).
- `POST /api/admin/add-admin` — 400 (invalid email), 403 (non-admin leader).
- `POST /api/admin/bookings` — 400 (missing body).
- `POST /api/bookings/:id/reschedule` — 404 (missing booking), 401 (no auth).
- Round-trip: create a throwaway booking (direct DB insert, so no notifications) →
  active-booking returns `active:true` with resolved `leader_name` → reschedule returns
  `{ok,released:true}` and status `cancelled` → active-booking returns `active:false` →
  row deleted.

## Notes / follow-ups
- No force-push, no `--admin` merge, no auto-merge — PR opened for Braden to review/merge.
- The reschedule endpoint intentionally allows the companion themselves to release their
  own booking (broader than the existing cancel/complete endpoints, which are
  leader/admin-scoped) since rescheduling is a self-service action.
- `sms:phone1,phone2` is a best-effort group-message URI; iOS/Android support varies by
  carrier/app, and the fallback chain (2 → 1 → body-only) covers the common cases.
- The Call & Book drawer books recurring slots to their next occurrence and
  date-specific windows to their exact date, mirroring the `/book` page logic.
