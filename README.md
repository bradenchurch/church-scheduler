# EQ Presidency Scheduler

A Google Apps Script + Sheets tool that eliminates the scheduling back-and-forth for quarterly Elders Quorum Presidency ↔ Companionship interviews.

**Status:** V1 architecture draft — no code written yet.

**Tech:** Google Apps Script + Google Sheets + Google Calendar. 100% Google ecosystem.

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full spec.

---

## What's actually built
Nothing yet — just the spec.

## What needs to happen next
1. Create the new Apps Script project (script.google.com → New project)
2. Create the bound Google Sheet (the four tabs: Leaders, Companionships, Availability, Bookings)
3. Pull in the `Code.gs` skeleton + sheets config
4. Manually add the first quarter's data (3 leaders, ~20 companionships)
5. Deploy as Web App, generate the three leader booking links + per-companionship booking links
6. Print QR codes for the leader cards

I'll write the code in the next pass once you've red-lined the architecture.
