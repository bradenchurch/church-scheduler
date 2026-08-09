/**
 * EQ Presidency Scheduler — Entry point, menu, triggers, doGet dispatcher
 */

/**
 * One-time setup: create the four tabs with headers. Safe to run again.
 */
function bootstrap() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const headers = {
    [SHEET_NAMES.LEADERS]: [
      'LeaderId', 'Code', 'Name', 'Email', 'RoleTitle', 'District',
      'CalendarId', 'SendAs Configured?',
    ],
    [SHEET_NAMES.COMPANIONSHIPS]: [
      'CompanionshipId', 'Elder1Name', 'Elder2Name',
      'Elder1Email', 'Elder2Email',
      'AssignedLeaderId', 'Quarter', 'Status',
      'BookedAt', 'BookingId',
    ],
    [SHEET_NAMES.AVAILABILITY]: [
      'SlotId', 'LeaderId', 'Start', 'End',
      'Quarter', 'Status', 'BookingId',
    ],
    [SHEET_NAMES.BOOKINGS]: [
      'BookingId', 'CompanionshipId', 'SlotId', 'Quarter',
      'CreatedAt', 'CalendarEventId',
      'ReminderSent', 'ReminderSentAt',
    ],
  };

  for (const [name, cols] of Object.entries(headers)) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const firstRow = sheet.getRange(1, 1, 1, cols.length).getValues()[0];
    if (firstRow.every(v => v === '')) {
      sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }

  // Seed leaders (only if empty)
  const leadersSheet = ss.getSheetByName(SHEET_NAMES.LEADERS);
  if (leadersSheet.getLastRow() < 2) {
    LEADERS_SEED.forEach(l => {
      leadersSheet.appendRow([
        l.leaderId, l.code, l.name, l.email, l.role, l.district, l.calendarId, false,
      ]);
    });
  }

  SpreadsheetApp.getUi().alert(
    'Bootstrap complete',
    'Sheets created. Now:\n' +
    '1. Fill in leader email addresses in the Leaders tab\n' +
    '2. Run "Seed Sample Companionships" to see the structure\n' +
    '3. Run "Generate Test URLs" for test booking URLs',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Seed with a few sample companionship rows so the structure is visible.
 * Replace these with the real roster from the PDF (~243 rows total).
 */
function seedSampleCompanionships() {
  const sheet = getSheet_(SHEET_NAMES.COMPANIONSHIPS);
  const quarter = getCurrentQuarter();
  const samples = [
    { leader: 'L-D1', e1: 'Behymer, Austin', e2: 'Tower, Bridger' },
    { leader: 'L-D1', e1: 'Evans, Luke',     e2: 'Mann, Ryan'     },
    { leader: 'L-D2', e1: 'Abel, Jordan',    e2: 'Gearig, Kyle'   },
    { leader: 'L-D3', e1: 'Adair, Zach',     e2: 'Carter, Davis'  },
  ];

  // Find starting ID so we don't collide
  const existing = readRowsAsObjects_(sheet);
  let maxN = 0;
  existing.forEach(r => {
    const m = r.CompanionshipId && r.CompanionshipId.match(/^C-(\d+)$/);
    if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
  });

  samples.forEach((s, i) => {
    const cid = `C-${String(maxN + i + 1).padStart(3, '0')}`;
    sheet.appendRow([
      cid, s.e1, s.e2,
      '', '',
      s.leader, quarter, 'Pending', '', '',
    ]);
  });
}

/**
 * Add a custom menu to the spreadsheet for the admins.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📅 EQ Scheduler')
    .addItem('🆕 Bootstrap (one-time)', 'bootstrap')
    .addItem('🧪 Seed Sample Companionships', 'seedSampleCompanionships')
    .addSeparator()
    .addItem('👥 Show Leadership Availability Links (3)', 'showLeadershipLinks')
    .addItem('📱 Show Companion QR Code (1 universal)', 'showCompanionQrUrls')
    .addItem('🔗 Show All Booking URLs', 'showAllBookingUrls')
    .addItem('📊 Dashboard (who has not booked)', 'showDashboardSidebar')
    .addSeparator()
    .addItem('⏰ Install Reminder Trigger', 'installReminderTrigger')
    .addItem('🚫 Remove Reminder Trigger', 'removeReminderTrigger')
    .addToUi();
}

/**
 * Show a sidebar listing the 3 leadership availability links so the admin
 * can copy/paste them into a text, email, or print.
 */
function showLeadershipLinks() {
  const leaders = getAllLeaders();
  const html = leaders.map(l => {
    const url = leaderAvailabilityUrl(l.Code);
    return `<div style="margin-bottom: 14px; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
              <div style="font-weight: 600;">${l.Name} (${l.RoleTitle}, District ${l.District})</div>
              <div style="font-family: monospace; font-size: 11px; word-break: break-all; margin-top: 4px;">
                <a href="${url}" target="_blank">${url}</a>
              </div>
            </div>`;
  }).join('');
  const sidebar = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 12px; font-size: 13px; }
      h3 { margin-top: 0; }
      .hint { color: #888; font-size: 11px; margin-bottom: 12px; }
    </style>
    <h3>👥 Leadership Availability Links</h3>
    <div class="hint">Copy each link and send it to the corresponding presidency member directly (text, email, or printed card). No QR code needed.</div>
    ${html}
  `).setTitle('Leadership Links');
  SpreadsheetApp.getUi().showSidebar(sidebar);
}

/**
 * Show a sidebar with the 1 universal companion QR code.
 * Companions scan it, type their last name, and the system auto-routes them
 * to their assigned interviewer's available slots.
 */
function showCompanionQrUrls() {
  const url = bookingLandingUrl();
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`;
  const sidebar = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 12px; font-size: 13px; }
      h3 { margin-top: 0; }
      .hint { color: #888; font-size: 11px; margin-bottom: 12px; }
      .qr-box { text-align: center; padding: 12px; border: 1px solid #ddd; border-radius: 6px; }
      .qr-box img { width: 220px; height: 220px; border: 1px solid #ccc; }
      .url-line { font-family: monospace; font-size: 10px; word-break: break-all; margin-top: 10px; }
    </style>
    <h3>📱 Companion QR Code (1 universal)</h3>
    <div class="hint">One QR code for all companionships. Scan → type last name → auto-routes to your assigned interviewer's available slots. Print and pin in the EQ classroom, ward bulletin, or text individually.</div>
    <div class="qr-box">
      <a href="${qrApi}" target="_blank"><img src="${qrApi}" alt="QR" /></a>
      <div class="url-line"><a href="${url}" target="_blank">${url}</a></div>
    </div>
  `).setTitle('Companion QR Code');
  SpreadsheetApp.getUi().showSidebar(sidebar);
}

/**
 * Show a sidebar/modal listing every companionship's deep-link booking URL.
 * Useful if Braden wants to email a specific companionship directly.
 */
function showAllBookingUrls() {
  const quarter = getCurrentQuarter();
  const rows = getCompanionshipsByQuarter(quarter);
  const html = rows.map(r => {
    const url = bookingUrlForCompanionship(r.CompanionshipId);
    return `${r.CompanionshipId} - ${r.Elder1Name} & ${r.Elder2Name}<br>` +
           `&nbsp;&nbsp;<a href="${url}" target="_blank">${url}</a><br>` +
           `&nbsp;&nbsp;Status: ${r.Status} → Assigned: ${r.AssignedLeaderId}<br><br>`;
  }).join('');
  const sidebar = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 12px; font-size: 11px; }
      a { font-family: monospace; word-break: break-all; }
    </style>
    <h3>All deep-link booking URLs — ${quarter}</h3>
    ${html}
  `).setTitle('EQ Scheduler URLs');
  SpreadsheetApp.getUi().showSidebar(sidebar);
}

/**
 * Open the dashboard as a modal (pop-up).
 */
function showDashboardSidebar() {
  const template = HtmlService.createTemplateFromFile('Dashboard');
  template.token = Utilities.getUuid();
  const html = template.evaluate().setWidth(900).setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, '📊 EQ Presidency Scheduler Dashboard');
}

/**
 * Web app entry — dispatches to companion / leader / dashboard views.
 * Three flows:
 *   ?action=leader&i=D1|D2|D3   → leader enters their own availability
 *   ?action=book                → 1 universal companion URL, search auto-routes by last name
 *   ?action=book&c=C-001        → companion deep-link direct to slot picker
 */
function doGet(e) {
  try {
    const action = e.parameter[URL_PARAM.ACTION];
    if (action === ACTIONS.BOOK) {
      return renderBookingPage_(e);
    } else if (action === ACTIONS.LEADER) {
      return renderLeaderPage_(e);
    } else if (action === ACTIONS.DASHBOARD) {
      return renderDashboardPage_(e);
    } else {
      // Default landing
      return HtmlService.createHtmlOutput(`
        <h2>EQ Presidency Scheduler</h2>
        <p>Use a personalized link to book or submit availability.</p>
        <ul>
          <li>Presidency members: use your personal link to manage availability.</li>
          <li>Companionships: scan the QR code, then enter your last name.</li>
        </ul>
      `);
    }
  } catch (err) {
    console.error('doGet failed:', err);
    return HtmlService.createHtmlOutput(
      `<h2>Something went wrong</h2><pre>${err.message}</pre>`
    );
  }
}

/**
 * Render the companionship booking page.
 *
 * Two entry modes:
 *   - With ?c=C-001 → deep-link to a specific companionship (skip search)
 *   - Without ?c → show the search-by-last-name UI (1 universal QR for the whole ward)
 */
function renderBookingPage_(e) {
  const cid = e.parameter[URL_PARAM.COMPANIONSHIP];

  // Deep-link mode
  if (cid) {
    const comp = getCompanionshipById(cid);
    if (!comp) {
      return HtmlService.createHtmlOutput(`<h2>Unknown companionship: ${cid}</h2>`);
    }
    return renderSlotPicker_(comp);
  }

  // Search-by-name mode — searches across all companionships in the ward;
  // each match auto-routes to their assigned interviewer's slots.
  const template = HtmlService.createTemplateFromFile('BookingSearch');
  template.quarter = getCurrentQuarter();
  template.token = Utilities.getUuid();
  return template.evaluate();
}

/**
 * After companionship picks their name, render the slot-picker.
 */
function renderSlotPicker_(comp) {
  const leader = getLeaderById(comp.AssignedLeaderId);
  const slots = getOpenSlotsForLeader(comp.AssignedLeaderId, comp.Quarter);

  const template = HtmlService.createTemplateFromFile('BookingPage');
  template.companionship = comp;
  template.leader = leader || {};
  template.slots = slots.map(s => ({
    slotId: s.SlotId,
    startIso: new Date(s.Start).toISOString(),
    startDisplay: new Date(s.Start).toLocaleString('en-US', {
      timeZone: TIMEZONE,
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }),
  }));
  template.token = Utilities.getUuid();
  return template.evaluate();
}

/**
 * Render the leader availability page (each leader manages their own slots).
 * Braden confirmed: each interviewer manages their own availability through their QR code.
 */
function renderLeaderPage_(e) {
  const interviewerCode = e.parameter[URL_PARAM.INTERVIEWER];
  if (!interviewerCode) {
    return HtmlService.createHtmlOutput('<h2>Missing interviewer code. Scan your district QR code.</h2>');
  }
  const leader = getLeaderByCode(interviewerCode);
  if (!leader) {
    return HtmlService.createHtmlOutput(`<h2>Unknown interviewer code: ${interviewerCode}</h2>`);
  }
  const slots = getOpenSlotsForLeader(leader.LeaderId, getCurrentQuarter());

  const template = HtmlService.createTemplateFromFile('LeaderAvailability');
  template.leader = leader;
  template.slots = slots.map(s => ({
    slotId: s.SlotId,
    startIso: new Date(s.Start).toISOString(),
    startDisplay: new Date(s.Start).toLocaleString('en-US', { timeZone: TIMEZONE }),
  }));
  template.token = Utilities.getUuid();
  return template.evaluate();
}

function renderDashboardPage_(e) {
  const template = HtmlService.createTemplateFromFile('Dashboard');
  template.token = Utilities.getUuid();
  return template.evaluate()
    .setWidth(900).setHeight(640);

/**
 * === Server-side API called from HTML pages (via google.script.run) ===
 */

/**
 * Search companionships by partial last-name match across the entire ward.
 * Returns up to 12 hits. Braden collapsed to 1 universal QR; auto-routing
 * to assigned leader happens when the companionship is selected.
 */
function searchCompanionships_(searchTerm) {
  const term = (searchTerm || '').trim().toLowerCase();
  if (term.length < 2) return [];

  const comps = getCompanionshipsByQuarter(getCurrentQuarter());

  const hits = comps.filter(c => {
    const blob = `${c.Elder1Name} ${c.Elder2Name}`.toLowerCase();
    return blob.includes(term);
  });

  return hits.slice(0, 12).map(c => ({
    CompanionshipId: c.CompanionshipId,
    DisplayName: `${c.Elder1Name.split(',')[0]} & ${c.Elder2Name.split(',')[0]}`,
    Status: c.Status,
  }));
}

function bookSlot_(cid, slotId) {
  const comp = getCompanionshipById(cid);
  if (!comp) throw new Error('Unknown companionship.');
  if (comp.Status === 'Booked') throw new Error('This companionship is already booked.');

  const slotSheet = getSheet_(SHEET_NAMES.AVAILABILITY);
  const found = findRowById_(slotSheet, 'SlotId', slotId);
  if (!found) throw new Error('Slot not found.');
  const headers = slotSheet.getDataRange().getValues()[0];
  const status = found.values[headers.indexOf('Status')];
  if (status !== 'Open') throw new Error('That slot was just taken. Please pick another.');

  const leader = getLeaderById(comp.AssignedLeaderId);
  const slot = {
    SlotId: slotId,
    Start: found.values[headers.indexOf('Start')],
    End:   found.values[headers.indexOf('End')],
  };

  // Atomically book
  const bookingId = createBooking(cid, slotId, comp.Quarter);
  bookAvailabilitySlot(slotId, bookingId);
  updateCompanionshipStatus(cid, 'Booked', bookingId);

  // Calendar event on leader's calendar
  const eventId = createInterviewEvent(slot, leader, comp);
  if (eventId) updateBookingCalendarEventId(bookingId, eventId);

  // Skip email — the original spec didn't require confirmation emails
  // (companion gets calendar invite via the event attendees)

  return {
    ok: true,
    bookingId,
    slotDisplay: new Date(slot.Start).toLocaleString('en-US', { timeZone: TIMEZONE }),
    interviewerName: leader ? leader.Name : '',
  };
}

function addSlot_(leaderId, startIso) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + INTERVIEW_DURATION_MIN * 60 * 1000);
  return addAvailabilitySlot(leaderId, start, end, getCurrentQuarter());
}

function deleteSlot_(slotId) {
  deleteAvailabilitySlot(slotId);
  return { ok: true };
}
