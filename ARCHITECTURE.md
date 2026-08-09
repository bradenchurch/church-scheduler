# EQ Presidency Scheduler — V1 Architecture

**Goal:** Eliminate scheduling back-and-forth for quarterly Elders Quorum Presidency ↔ Companionship interviews.

**Stack:** 100% Google ecosystem (Apps Script + Sheets + Calendar + Gmail)

**Source data model:** EQ Ministering List (ministering.churchofjesuschrist.org)
- Ward: **Long Valley 2nd Ward** (Washington Utah Long Valley Stake)
- Unit: Ward 2302934 / Stake 2334356
- 3 districts × ~30 companionships = **~95 total companionships** (median 2-3 households each)
- Presidency mapping: Cole Chollet (D1), Kawika Tupuola (D2), Sean Bryan (D3)

---

## Roles

| Role | Who | What they do |
|------|-----|--------------|
| **Admin** | EQ Presidency (Braden initially) | Sets up quarter, seeds roster, owns the Sheet, configures reminders |
| **Interviewer** | The 3 Presidency members (Cole / Kawika / Sean) | Scan their district's QR, enter their own available 30-min slots, receive reminders |
| **Companionship** | 2-person pair (~243 across 3 districts, 2-3 households each) | Scan their district's QR, type their last name, pick a slot |

**Critical constraints** (Braden-confirmed in this conversation):
1. **1 universal companion QR code** (`?action=book`). Companionships scan it, type their last name, and the system auto-routes them to their assigned interviewer's slots. No district-scoped QR codes — Braden collapsed this for simpler distribution.
2. **Leadership gets 3 plain text links** (one per interviewer). Braden sends each presidency member their `?action=leader&i=D#` URL via text/email/print. They bookmark it and use it to enter their availability.
3. **Search-by-last-name** at the universal landing page; routes to assigned interviewer based on `AssignedLeaderId` in the sheet.
4. **Each interviewer manages their own availability** through their link. Braden does NOT coordinate slots centrally.
5. **Capacity = 1 per slot** (each companionship is interviewed individually, not as a pair-of-pairs).
6. **Pre-assigned interviewer** (no selection on booking page).

---

## Sheets (source of truth)

**Tab 1: `Leaders`**
| LeaderId | Name | Email | RoleTitle | District | Calendar ID | SendAs Configured? |
|----------|------|-------|-----------|----------|-------------|---------------------|
| L-001 | Cole Chollet | … | 1st Counselor | 1 | primary | FALSE |
| L-002 | Kawika Tupuola | … | 2nd Counselor | 2 | primary | FALSE |
| L-003 | Sean Bryan | … | President | 3 | primary | FALSE |

(Mapping inferred — Braden should confirm role titles.)

**Tab 2: `Companionships`** (~95 rows)
| CompanionshipId | Elder1Name | Elder2Name | Elder1Email | Elder2Email | AssignedLeaderId | Quarter | Status | BookedAt | BookingId |
|-----------------|------------|------------|-------------|-------------|------------------|---------|--------|----------|-----------|
| C-001 | Behymer, Austin | Tower, Bridger | … | … | L-001 | 2026-Q3 | Pending | — | — |
| C-002 | Evans, Luke | Mann, Ryan | … | … | L-001 | 2026-Q3 | Pending | — | — |
| … | … | … | … | … | … | … | … | … | … |

Status: `Pending` → `Booked` → `Completed`

**Tab 3: `Availability`**
| SlotId | LeaderId | Start | End | Quarter | Status | BookingId |
|--------|----------|-------|-----|---------|--------|-----------|
| S-001 | L-001 | 2026-08-04 19:00 | 2026-08-04 19:30 | 2026-Q3 | Open | — |
| … | … | … | … | … | … | … |

**Tab 4: `Bookings`** (1 row per scheduled interview)
| BookingId | CompanionshipId | SlotId | Quarter | CreatedAt | CalendarEventId | ReminderSent | ReminderSentAt |
|-----------|-----------------|--------|---------|-----------|------------------|--------------|----------------|
| B-001 | C-001 | S-042 | 2026-Q3 | 2026-07-14 12:34 | evt_abc123 | TRUE | 2026-08-03 08:00 |

**Tab 5: `Archive`** (auto-populated when quarter rolls over, optional V1.1)

---

## Flows

### A. Quarterly setup (Admin)
1. Admin runs menu **"🆕 Start New Quarter (Q3 2026)…"** (asks for quarter label)
2. Script creates fresh `Availability`, `Bookings`, refreshes `Companionships.Status` to Pending
3. Copies roster from the PDF-parse or manual paste
4. Generates ~95 unique booking URLs (one per companionship) + 3 leader availability URLs

### B. Leader submits availability
1. Leader opens their URL (QR-card on fridge or printed sheet)
2. URL: `https://script.google.com/.../exec?action=leader&leaderId=L-001`
3. Shows calendar grid: click empty 30-min slot to add, click own slot to delete
4. Persists to `Availability`; can't delete a slot that's been booked

### C. Companionship books (high-traffic)
1. URL: `https://script.google.com/.../exec?action=book&c=C-001`
2. Shows ONLY the assigned interviewer's open slots in this quarter
3. Click a slot to book → triggers atomically:
   - Update `Availability` row (Status: Booked)
   - Insert `Bookings` row
   - Create Google Calendar event on leader's calendar (one-way push, leader's default calendar)
   - Send invitation email to BOTH elders
   - Update `Companionships.Status` → Booked, set BookedAt + BookingId

### D. Reminder emails (T-24h)
- Time-driven trigger, daily at 8:00 AM MST
- Scan `Bookings` for `Start = tomorrow` AND `ReminderSent = FALSE`
- For each: send email **from the leader's "Send mail as" alias** via `MailApp.sendEmail({from: leader.email, ...})`
- Subject: `📅 Reminder: Companionship interview tomorrow`
- Mark `ReminderSent = TRUE`, `ReminderSentAt = now()`

**Fallback if `from` alias not configured** (Leader.SendAs Configured? = FALSE in Leaders tab): use script default sender with "Sent on behalf of [Leader]" prefix.

### E. Presidency Dashboard ("who hasn't booked")
- Menu: **"📊 Open Dashboard"** → opens a modal/sidebar
- Per-district view: 3 columns showing { total companionships, # booked, # not booked, open slots available }
- Color-coded red/green
- Per-companionship detail: all Pending status, sorted by Elder1Name, click to copy their booking link

---

## Critical design points

1. **All three sheets are local to the spreadsheet** — single source of truth = the Sheet.
2. **URLs encode role** (`?action=book` for companion, `?action=leader` for leader) — no auth UI needed, no signin.
3. **Companionships are pre-assigned** (Braden's confirmation: no self-selection). Booking page hides the leader dropdown and just shows times.
4. **One-way calendar push** — leader never has to share their calendar; event lands there anonymously.
5. **Reminder from interviewer's email** — requires Gmail "Send mail as" alias setup for each of the 3 leaders. **This is the only Admin-side blocker** before V1 goes live. Without it, reminders fall back to script sender with "on behalf of" disclaimer.
6. **Quarter-resilient** — each row has Quarter column. Can pivot to view any past quarter.

---

## File layout (Apps Script project)

```
church-scheduler-app/
├── Code.gs                        # Entry, onOpen menu, triggers
├── Config.gs                      # Spreadsheet IDs, sheet names, URLs
├── Sheets.gs                      # CRUD wrappers
├── BookingPage.html               # ?action=book (companionship view)
├── LeaderAvailability.html        # ?action=leader (leader view)
├── Dashboard.html                 # Modal/sidebar "who hasn't booked"
├── Calendar.gs                    # Calendar event create, one-way push
├── Mail.gs                        # Invite + reminder emails
├── ReminderTrigger.gs             # Daily 8am logic
└── README.md                      # Deploy & use instructions
```

---

## Deployment path

1. Create new Apps Script project at script.google.com
2. Create bound Google Sheet (4 tabs above, headers in row 1)
3. Configure leader email aliases (Gmail "Send mail as")
4. Run `bootstrap()` to seed the 3 leaders + the 95 companionship rows from PDF parse
5. Deploy as Web App (Execute as: Me, Access: Anyone)
6. Generate printable QR cards (Google Doc template) for the 3 leaders' availability links
7. Generate per-companionship link roster (Google Sheet or Doc), distribute to leaders or print for companionship training

---

## Open questions for Braden (pre-deploy)

1. **Role titles** — Are Cole/Kawika/Sean the President + 2 Counselors, or are they District Leaders under a separate Presidency? (Affects reminder email "from" setup.)
2. **Quarter boundary** — does Q3 2026 = July-Sept (church fiscal), or some other custom block (Aug-Nov)?
3. **Companionship emails** — do we have ward directory access, or should the script prompt for these?
4. **Booking window** — should availability submissions close 48h before quarter end, or stay open until booked?
5. **Interview location** — virtual (Zoom/Meet), in-person (link to user's home/chapel), or both? Affects calendar event body.

---

## V1.1 candidates (NOT in V1)
- Rescheduling (cancel + rebook)
- Leader blackout dates (vacation)
- Bulk quarterly invitation email to all companions at start of quarter
- Auto-archive past quarters
- Multi-user dashboard view (RS Presidency, Bishopric as different roles)
