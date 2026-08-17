# Mobile-First UI/UX Optimization Pass — Report

**Branch:** `feat/mobile-ui-ux-optimization`
**Scope:** Presidency members (Cole, Kawika, Sean, Braden) and companionships use
phones for 90%+ of interactions. This pass makes the entire app thumb-friendly,
auto-zoom-free, and single-column on small viewports.

## Changes

### 1. Global head & touch rules
- `index.html` — viewport now `width=device-width, initial-scale=1, maximum-scale=1,
  user-scalable=no`; title corrected to `EQ Scheduler`.
- `src/index.css` — added:
  - `input, select, textarea { font-size: 16px !important }` so iOS Safari never
    auto-zooms on focus (`!important` intentionally beats `.text-sm` utilities).
  - `-webkit-tap-highlight-color: transparent` on `body` and `*` (no grey tap flash).

### 2. Availability Calendar (`src/pages/AdminAvailability.jsx`)
- **Sticky bottom action bar** (`sm:hidden fixed bottom-0 … bg-white/95 backdrop-blur
  border-t`): the "Publish N windows" button is always under the thumb on mobile. The
  inline submit is now `hidden sm:block`; page container gets `pb-28 sm:pb-6` so content
  isn't hidden behind the bar.
- **Thumb-friendly targets**: all buttons/date shortcuts/time presets/slot-duration pills
  bumped `min-h-[44px]` → `min-h-[48px]`. Date shortcuts and time presets stack full-width
  on mobile (`flex-col sm:flex-row`, `w-full sm:w-auto`). Slot-duration pills tile via
  `flex-1 min-w-[64px]`.
- **Compact mobile month grid**: day cells `min-h-[48px] sm:min-h-[56px]` so numbers and
  selection indicators don't wrap awkwardly on 375px screens.

### 3. Admin Dashboard (`src/pages/AdminDashboard.jsx`)
- Metrics/district cards already stack via `grid-cols-1 sm:grid-cols-3`.
- **Scrollable filter pills**: `Unscheduled | Scheduled | Completed | All` now live in a
  horizontal `overflow-x-auto` track on mobile (`sm:flex-wrap sm:overflow-visible`), each
  `whitespace-nowrap flex-shrink-0 min-h-[48px]`.
- **Thumb-friendly action buttons**: "Text Invite" (`sms:`) / "Copy Link" / "Mark Complete"
  are now full-width `min-h-[48px]` on mobile and inline on desktop; badge aligns
  `self-start` so it doesn't stretch.

### 4. Leader (`src/pages/Leader.jsx`)
- Leader selector is full-width on mobile (`w-full` label/select, `flex-col sm:flex-row`
  header).
- "Copy iCal Subscription Link" is now a full-width, `min-h-[48px]` prominent button on
  mobile (still inline on desktop), with the existing instant "Copied" feedback.

### 5. Chapel & Booking (`src/pages/Chapel.jsx`, `src/pages/Book.jsx`,
   `src/components/SlotPicker.jsx`, `src/components/CompanionPicker.jsx`)
- Slot-picker buttons are full-width and `min-h-[48px]`.
- "Add to Google Calendar" and "Download .ics" are full-width `min-h-[48px]` on the
  booking confirmation.
- SlotPicker date pills bumped to `min-w-[56px] min-h-[48px]`; time select `min-h-[48px]`.
- Chapel step controls and CompanionPicker inputs/results bumped to `min-h-[48px]`.

## Verification

| Check | Result |
| --- | --- |
| `npm run build` | ✅ 0 errors (pre-existing chunk-size warning only) |
| `npm run lint` (oxlint) | ✅ 0 errors (3 pre-existing warnings, unchanged) |
| AuthContext unchanged | ✅ restored after screenshot harness |

Screenshots (375×812 @2x, headless Chrome) captured to `screenshots/`:
- `mobile-availability.png` — sticky Publish bar + stacked date shortcuts
- `mobile-dashboard.png` — stacked metric/district cards
- `mobile-dashboard-actions.png` — scrollable filter pills + full-width Text Invite
- `mobile-leader.png` — full-width selector + prominent Copy iCal
- `mobile-booking.png` — full-width slot buttons
- `mobile-booking-booked.png` — full-width Add-to-Google / Download .ics

## Notes / follow-ups
- No force-push, no `--admin` merge, no auto-merge — PR opened for Braden to review/merge.
- Screenshots were produced with a temporary mock-AuthContext + mock-API harness (not
  committed); production code is untouched by the harness.
- The `min-h-[44px]` → `min-h-[48px]` bump was scoped to the named pages/components;
  remaining 44px targets elsewhere (e.g. Nav) are left as-is to keep the diff focused.
