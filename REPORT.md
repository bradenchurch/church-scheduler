# Slot Duration Selector — Report

PR: https://github.com/bradenchurch/church-scheduler/pull/29

Branch: `feat/slot-duration-selector` · Worktree: `~/.openclaw/workspace/church-scheduler-tasks/cs-slot-duration/`

## Summary

Added a per-window **slot duration** selector (15 / 20 / 30 / 45 / 60 minutes) so presidency
members can control how their published availability windows are split into bookable increments.
A window published with 15-minute slots (e.g. 8:00–9:00 AM) is now bookable at 8:00, 8:15,
8:30, and 8:45 — instead of always being hardcoded to 30-minute steps.

## What changed

### 1. Schema (`schema.sql`)
- `availability_windows` gains `slot_duration_minutes INTEGER NOT NULL DEFAULT 30` with a
  `CHECK (… IN (15, 20, 30, 45, 60))` constraint.
- Added an idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS` so existing DBs are brought
  forward (matching the repo's established migration pattern).

### 2. Backend (`server/index.js`)
- `POST /api/availability/:leaderId/windows`: accepts `slot_duration_minutes`; defaults to 30
  when omitted, validates it is one of `[15, 20, 30, 45, 60]` (else 400), and persists it.
- `GET /api/availability/:leaderId`: `windows[]` now includes `slot_duration_minutes`.
- `GET /api/availability/:leaderId/windows`: rows now include `slot_duration_minutes`.

### 3. Availability UI (`src/pages/AdminAvailability.jsx`)
- "Add a window" form gains a **Slot duration** pill selector (`15m`, `20m`, `30m (default)`,
  `45m`, `60m`).
- Window list items now show the duration, e.g. `8:00 AM – 10:00 AM (15m slots)`.

### 4. Booking expansion (`src/components/SlotPicker.jsx` & `src/pages/Book.jsx`)
- `expandWindowTimes(start, end, slotDuration = 30)` now steps by `slotDuration` minutes
  (with a guard falling back to 30 for a non-positive value).
- Both the chapel-side `SlotPicker` and the `Book` page pass each window's
  `slot_duration_minutes` when expanding times; `Book` also sets the booked event duration
  from the window's slot duration for the calendar links.

## Verification

| Check | Result |
| --- | --- |
| `npm run build` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors (3 pre-existing warnings only) |
| `node --check server/index.js` | ✅ valid |
| DB migration (`ALTER … ADD COLUMN IF NOT EXISTS`) | ✅ applied to shared Supabase `public` schema |
| MOCK_AUTH smoke test — `GET /api/availability/cole/windows` | ✅ returns windows incl. `slot_duration_minutes` |
| MOCK_AUTH smoke test — `POST …/windows` 15m | ✅ persisted `slot_duration_minutes: 15` |
| MOCK_AUTH smoke test — `POST …/windows` 25m (invalid) | ✅ 400 `slot_duration_minutes must be one of 15, 20, 30, 45, 60` |
| MOCK_AUTH smoke test — `POST …/windows` omitted | ✅ defaulted to `slot_duration_minutes: 30` |
| `GET /api/availability/cole` | ✅ windows include `slot_duration_minutes` |

## Notes / decisions

- **Default preserved:** omitting the field (and any pre-existing rows) resolves to 30 minutes,
  so existing behavior is unchanged for windows created before this feature.
- **Test data cleaned up:** the two smoke-test windows inserted for `cole` were deleted after
  verification so no junk rows remain in production.
- No force-push, no `--admin` merge, no auto-merge — PR opened for Braden to review/merge.
