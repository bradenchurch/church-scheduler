# EQ Presidency Scheduler — Deployment Guide

## What's in this folder

Eleven files, eleven of which you'll copy into the Apps Script editor:

| File | Purpose |
|------|---------|
| `Code.gs` | Entry point, menu, doGet dispatcher, server-side API for HTML pages |
| `Config.gs` | Sheet names, leader roster seed, URL builders, interviewer codes (D1/D2/D3) |
| `Sheets.gs` | CRUD wrappers (read/write to all four tabs) |
| `BookingSearch.html` | Name-search landing page (companionship enters last name) |
| `BookingPage.html` | Slot picker (after companionship is identified) |
| `LeaderAvailability.html` | Leader-facing availability entry UI |
| `Dashboard.html` | Presidency "who hasn't booked" modal |
| `Dashboard.gs` | Server helpers that render dashboard HTML |
| `Mail.gs` | Booking confirmation + 24h reminder emails (reminders to leader only) |
| `Calendar.gs` | One-way calendar event push |
| `ReminderTrigger.gs` | Daily 8 AM reminder trigger |
| `README.md` | This file |

The 11 files above (everything except this README) become the Apps Script project.

---

## Architecture in 60 seconds

```
               +-----------------+
               | EQ Presidency   |
               | Scheduler (Web) |
               +--------+--------+
                        |
       Branching by ?action + ?i param
                        |
     +------------------+------------------+
     |                  |                  |
+-------------+   +-------------+   +-------------+
| Cole Chollet|   |Kawika Tupuola|  | Sean Bryan  |
| ?action=    |   | ?action=     |  | ?action=    |
| leader&i=D1 |   | leader&i=D2  |  | leader&i=D3 |
+-------------+   +-------------+   +-------------+
        ^                  ^                  ^
        |                  |                  |
     Plain link (emailed / text by Braden — no QR)

+------------------------------------+
| ?action=book  (1 universal QR)   |
| search by last name → auto-routes |
| to assigned interviewer's slots   |
+------------------------------------+
                 ^
                 |
         1 universal QR code
    (print, pin, or text to any companion)
```

- **Companionships**: **1 universal QR code** (`?action=book`). Scan, type last name, auto-route to assigned interviewer's available slots. No need to know district.
- **Presidency members**: **3 plain text links** (one per district, `?action=leader&i=D1|D2|D3`). Braden sends each URL via text/email/print. They enter their own availability through that link. No QR.
- **Calendar event** lands on the leader's calendar with the companionship name in the title and both members as attendees.

### Why 1 universal QR works
Each companionship has `AssignedLeaderId` baked into the sheet. The search function looks across all 243 companionships; when the user picks their match, the system only shows slots from their assigned interviewer. The routing is invisible to the user — they just type their last name and see times.

---

## One-time setup (do these in order)

### Step 1 — Create the Apps Script project
1. Open https://script.google.com → **New project**
2. Name it "EQ Presidency Scheduler"
3. Click **Project Settings** → Script Properties → note the project ID (for later)
4. Open each `.gs` and `.html` file above, copy-paste into a same-named file in Apps Script

### Step 2 — Create the bound Google Sheet
1. In the Apps Script editor, click **Files > + > Script** and add a "Spreadsheet-bound" container OR
2. Just open Google Sheets, create a new sheet, name it "EQ Presidency Scheduler"
3. Open the sheet's **Extensions > Apps Script** — this will replace your standalone project. **Easier alternative:** keep the standalone project and grab the sheet ID, set it in `Config.gs` `SpreadsheetApp.openById(...)`. See Notes below.

### Step 3 — Run bootstrap
1. Back in Apps Script editor, select function `bootstrap` → Run
2. This creates the four tabs (Leaders, Companionships, Availability, Bookings) with headers
3. Seeds the 3 leadership rows from `Config.gs` `LEADERS_SEED`

### Step 4 — Fill in leader emails
1. Open the sheet → **Leaders** tab
2. Fill in each leader's Gmail address (e.g., `cole.chollet@gmail.com`)
3. Update `RoleTitle` if my seed is wrong (I assumed Cole=1st Counselor, Kawika=2nd, Sean=President — confirm)

### Step 5 — Seed the companionship roster (the 95 rows from the PDF)
1. Open `Code.gs` → `seedSampleCompanionships()` function
2. For V1 launch, easiest path: Braden pastes the PDF's structured roster into a CSV, then a one-shot script reads the CSV into the sheet. **I did not build this loader** — it requires the structured PDF parse.
3. Or, do it manually: Copy the companionship pairs from the PDF into the **Companionships** tab. ~95 rows.

### Step 6 — Configure leader "Send mail as" aliases
For reminders to come FROM each leader's Gmail (not from script's default):

1. Each leader opens their Gmail → **Settings ⚙️ > See all settings > Accounts and Import**
2. Under **"Send mail as"** → **Add another email address**
3. Add the script's service account address (look in Apps Script → Project Settings → Service Account — there's typically a `xxx@appspot.gserviceaccount.com` to add)
4. Each leader will receive a verification email and must click the link
5. Once verified, return to the sheet and set each leader's `SendAs Configured?` to TRUE

If this step is skipped, reminders still send but from the script's default sender with `[On behalf of NAME]` prefix. Functional, but less personal.

### Step 7 — Deploy as Web App
1. In Apps Script: **Deploy > New deployment**
2. Type: **Web app**
3. Execute as: **Me (bradenchurch@gmail.com)**
4. Who has access: **Anyone** (yes, anyone — the URL itself carries the auth)
5. Click **Deploy** → copy the Web App URL

### Step 8 — Send each presidency member their personal availability link
1. Open the sheet
2. Menu: **📅 EQ Scheduler > 👥 Show Leadership Availability Links (3)**
3. A sidebar opens with 3 URLs (one per district/interviewer)
4. Send each URL to the corresponding presidency member (text, email, or print on a small card). **No QR code needed** — they'll bookmark or save the link and use it when they're ready to enter their availability for the quarter.

### Step 9 — Generate the universal companion QR code
1. Menu: **📅 EQ Scheduler > 📱 Show Companion QR Code (1 universal)**
2. Sidebar shows the single QR code (companion types their last name → auto-routes to assigned interviewer)
3. Print and post in EQ classroom, ward bulletin, or text individually to companionships
4. Companionships scan → type last name → pick a slot

### Step 10 — Install the reminder trigger
1. Menu: **📅 EQ Scheduler > ⏰ Install Reminder Trigger**
2. Confirm it shows up under **Triggers** (clock icon)

### Optional: deep-link to a specific companionship
1. Menu: **📅 EQ Scheduler > 🔗 Show All Booking URLs**
2. Sidebar shows direct deep-links to each companionship (skip search)
3. Useful for emailing a specific companionship rather than relying on the QR code

---

## Notes & gotchas

### Why I'm suggesting a non-bound spreadsheet
The Apps Script editor's "Run > bootstrap" assumes the script is bound to a sheet. If you want a freestanding project, add this to `Sheets.gs`:

```js
const SPREADSHEET_ID = 'your-sheet-id-here';  // from the sheet URL
function getSpreadsheet_() { return SpreadsheetApp.openById(SPREADSHEET_ID); }
```

…and replace every `SpreadsheetApp.getActiveSpreadsheet()` with `getSpreadsheet_()`.

### Quarter rollover
`Config.gs → getCurrentQuarter()` returns hardcoded `2026-Q3` for V1. To start a new quarter:
1. Run `installReminderTrigger` once (it's idempotent)
2. Update `getCurrentQuarter()` to return the new value
3. Sheet data can stay — the `Quarter` column filters it

### Housekeeping
- The script logs to Stackdriver. Open Apps Script → **Executions** to inspect
- All triggers visible under the **Triggers** clock icon
- To revoke the Web App: Deploy > Manage deployments > Archive

---

## What's NOT in V1 (intentional)

I left these out — flag if any should be in V1:

- **Rescheduling** — companionships can't cancel and rebook themselves. Admin has to do it via the sheet. Common V1.1 add.
- **Companion email pre-fill** — booking page doesn't capture emails; relies on what's already in the sheet. Add a column-populate step before V2.
- **Bulk quarterly invite email** — at quarter start, you can manually email all companionships their URL.
- **Vacation blackout dates for leaders** — leader availability page is fully manual; they can ignore vacation weeks.
- **Multi-org reuse (RS, bishopric)** — would need a "role" layer in the data model. Add as separate sheet later.

---

## Files in this folder

```
church-scheduler-app/
├── README.md                  ← you are here
├── Code.gs
├── Config.gs
├── Sheets.gs
├── BookingPage.html
├── LeaderAvailability.html
├── Dashboard.html
├── Dashboard.gs
├── Mail.gs
├── Calendar.gs
└── ReminderTrigger.gs
```

All files are self-contained. No external dependencies beyond the standard Apps Script runtime.

---

## Quick test path

If you want to validate end-to-end before deploying for real:

1. Run `bootstrap` + `seedSampleCompanionships` (1 click each)
2. Add one slot to leader L-001's availability via the Web App URL `?action=leader&leaderId=L-001` after deploy
3. Open the booking URL for one of the 4 sample companionships (sidebar shows them)
4. Click a slot
5. Verify: availability row → Booked, companionship row → Booked, calendar event on Cole's calendar, email in the sample companions' inboxes

If all 5 of those happen in one click, deploy is healthy.
