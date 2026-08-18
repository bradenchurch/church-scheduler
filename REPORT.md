# Admin Management Suite — Report

**Branch:** `feat/admin-management-tools`
**Scope:** Five administrative & lifecycle features for Elders Quorum management:
presidency welcome links, CSV export, printable QR flyer, single-add companionship,
and CSV roster import.

## Changes

### 1. Presidency Welcome Links (`server/index.js` + `src/pages/Admin.jsx`)
- New endpoint `GET /api/admin/welcome-links` — gated `requireSession` +
  `requireRole('admin')`. Returns one entry per interviewer (Cole Chollet / Kawika
  Tupuola / Sean Bryan) with name, role title, district, email, a deep-link
  `availability_url` (`/admin/availability`), a pre-written `sms_text`, and an
  `sms:` href. Names/emails resolve from the `leaders` table (static fallback if
  the DB is down).
- `Admin.jsx` gains a "Presidency Welcome Links" card at the top of the portal with
  **Send Text** (`sms:`) and **Copy Text** (clipboard) actions per leader, plus a
  **Printable flyer** link.

### 2. CSV Export (`server/index.js` + `src/pages/AdminDashboard.jsx`)
- New endpoint `GET /api/admin/export.csv` — gated `requireSession` +
  `requireRole('leader')` (admins + presidency, matching the analytics page).
  Streams a UTF-8 (BOM-prefixed) `text/csv` download of
  `District, Leader, Companion 1, Companion 2, Status, Scheduled Date, Scheduled Time`.
- Extracted the analytics aggregation into a shared `computeRosterStatuses()`
  helper so the dashboard and the CSV export stay in lock-step (the
  `/api/admin/analytics` route was refactored to call it — no behavior change).
- `AdminDashboard.jsx` gains an **Export CSV** button in the header that downloads
  `interview-progress.csv` via a new `downloadCsv()` helper in `src/lib/api.js`.

### 3. Printable Bulletin QR Flyer (`src/pages/AdminFlyer.jsx` + `src/index.css`)
- New `AdminFlyer` page at route `/admin/flyer` (registered in `App.jsx`,
  admin-gated). Renders the ward name, a large QR code (from `/api/qr/generate`,
  targeting `/q/long-valley-2nd-ward`), and the 3-step instructions
  (1. Scan QR · 2. Select companionship · 3. Pick a time slot).
- **Print Flyer** button calls `window.print()`; a `@media print` block in
  `src/index.css` hides the app header/nav + `.no-print` chrome and lets the
  `.flyer-sheet` fill the page.

### 4. Single Add Companionship (`src/pages/AdminRoster.jsx` + `server/index.js`)
- `POST /api/companionships` now accepts optional `companion1_email` /
  `companion2_email` (previously name-only).
- `AdminRoster.jsx` gains an **Add Companionship** modal (companion names, an
  interviewer dropdown fed by `/api/leaders`, and optional emails) that POSTs to
  `/api/companionships` and refreshes the roster.

### 5. CSV Roster Import (`server/index.js` + `src/pages/AdminRoster.jsx`)
- New endpoint `POST /api/admin/import-roster` — gated `requireSession` +
  `requireRole('admin')`. Accepts the CSV as `{ csv: "…" }` JSON or a raw
  `text/csv` body. Includes a minimal RFC-4180 parser (quoted fields, CRLF/LF,
  blank-line skip) and flexible header detection (Companion 1/2, Elder 1/2,
  Assigned Leader / District, emails) with a positional fallback.
- **Upsert preserves history:** rows are matched by email (highest priority) then
  by an order/format-insensitive name-pair token; matches are updated **in place**
  (id preserved, so `bookings` FK rows survive) and non-matches are inserted.
  Missing emails in the CSV never wipe existing contact info. Returns
  `{ added, updated, total }`.
- `AdminRoster.jsx` gains an **Import CSV** modal with drag-and-drop (or click to
  browse) and an instant results summary.

## Verification

| Check | Result |
| --- | --- |
| `npm run build` | ✅ 0 errors (pre-existing chunk-size warning only) |
| `npm run lint` (oxlint) | ✅ 0 errors (3 pre-existing warnings, unchanged) |
| `scripts/smoke-admin-tools.sh` | ✅ 12/12 checks pass (see below) |

Smoke test (`MOCK_AUTH=true` + real Supabase) results:
- `GET /api/admin/welcome-links` — 401 (no auth), 403 (leader), 200 + 3 leaders (admin).
- `GET /api/admin/export.csv` — 401 (no auth), 403 (companion), 200 + CSV header (admin).
- `POST /api/admin/import-roster` — 401, 403 (leader), 400 (empty), 400 (header-only),
  200 `{ added: 0, updated: 1, total: 1 }` (idempotent name-only update of a seeded row).
- `GET /api/admin/analytics` — 200 (regression guard for the shared-helper refactor).

## Notes / follow-ups
- No force-push, no `--admin` merge, no auto-merge — PR opened for Braden to review/merge.
- `computeRosterStatuses()` is now the single source of truth for per-companionship
  status; the analytics route was refactored onto it and re-verified against the live DB.
- District numbers are derived from the known leader mapping (cole→1, kawika→2,
  sean→3); unassigned companionships export an empty District cell.
- The import matcher uses last-name-independent tokenization (handles "First Last"
  vs "Last, First" and reordered companions), but duplicate full names in a roster
  would still match to the first existing row — a future enhancement could key
  purely on emails when the Church export provides them.
