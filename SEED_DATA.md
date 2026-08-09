# Seed Data Loader — Next Step

This is a placeholder for the loader script that will populate the **Companionships** sheet from the ministering list PDF (Long Valley 2nd Ward, Washington Utah Long Valley Stake).

## What's needed

The PDF has this structure per companionship:

```
=== Companionship: <Elder1Name> & <Elder2Name> ===
[district designation from header]
- <Household1Name>
- <Household2Name>
- ...
```

About 95 of these across the 3 districts.

## Loader design (when we build it)

Two options:

### Option A: Apps Script menu action
- Braden pastes the PDF text content into an input box
- Parser extracts: companionship pairs (2 names), household assignments, district mapping
- Writes to **Companionships** sheet (row per companionship; household names get dropped in V1)

### Option B: Server-side PDF parser
- Add a "Re-seed from PDF" menu item
- Braden uploads the PDF or points to the URL
- Apps Script reads the PDF text, parses, populates sheet

**Recommended for V1:** Option A (paste-text), because PDF parsing is unreliable from Apps Script server-side. Push the parse-work to a Node script I run locally first.

## What's needed from Braden before this loader exists

1. **Email addresses** for each companionship member (V1 assumes they exist in the sheet as `Elder1Email` and `Elder2Email`)
2. **Confirmation** of role titles for Cole/Kawika/Sean:
   - Cole Chollet: 1st Counselor (D1)
   - Kawika Tupuola: 2nd Counselor (D2)
   - Sean Bryan: President (D3)
   - Or, the right hierarchy for the Long Valley Ward (district leaders vs presidency)
3. **Email preferences** — Should emails be sent even if a companionship doesn't have emails in the sheet? (Current code skips email if no address.)

## Quarter boundary

What defines the boundary between Q3 and Q4? Looking at the PDF (date stamped 12 Jul 2026), this is the **current quarter's** roster. So Q3 2026 = Jul-Sep roughly. V1 hardcodes the quarter label; we can derive from date later if you tell me the boundary scheme.

---

## What I delivered in this folder

- **ARCHITECTURE.md** — V1 architecture & spec
- **church-scheduler-app/** — 10 Apps Script files + README
- **SEED_DATA.md** (this file) — Loader placeholder

What I did NOT deliver (yet):

1. **Loader script** for the 95 actual companionship rows from the PDF. Reason: required email addresses from Braden (the scheduling system needs them for invitations/reminders).
2. **QR-card Google Doc template** for the 3 leaders. Reason: needs the deployed Web App URL, which can only come after Braden deploys the script.
3. **End-to-end test** of the running app. Reason: requires deployment on Braden's Google account.

I'll deliver all three when Braden is ready to (1) supply emails, (2) deploy the Web App.
