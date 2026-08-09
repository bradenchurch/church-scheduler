/**
 * EQ Presidency Scheduler — Config
 *
 * Central configuration: sheet names, leader roster, URLs.
 * Update leaders here when presidency changes.
 */

const SHEET_NAMES = {
  LEADERS:        'Leaders',
  COMPANIONSHIPS: 'Companionships',
  AVAILABILITY:   'Availability',
  BOOKINGS:       'Bookings',
};

// Quarter format: 'YYYY-QN' where N = 1..4 (church fiscal year if used)
function getCurrentQuarter() {
  // V1: Hardcoded. V1.1: derive from date or ward config.
  return '2026-Q3';
}

// Mapping inferred from PDF; Braden to confirm role titles.
// Each district gets a code (D1, D2, D3) that encodes the QR URL.
const LEADERS_SEED = [
  { leaderId: 'L-D1', code: 'D1', name: 'Chollet, Cole',   email: '', role: '1st Counselor', district: '1', calendarId: 'primary' },
  { leaderId: 'L-D2', code: 'D2', name: 'Tupuola, Kawika', email: '', role: '2nd Counselor', district: '2', calendarId: 'primary' },
  { leaderId: 'L-D3', code: 'D3', name: 'Bryan, Sean',     email: '', role: 'President',    district: '3', calendarId: 'primary' },
];

const INTERVIEW_DURATION_MIN = 30;
const TIMEZONE = 'America/Denver'; // Mountain Time (DST-aware)
const REMINDER_HOUR_LOCAL = 8;     // 8:00 AM MST daily

// URL params — 3-QR architecture: each QR encodes interviewer/district (D1/D2/D3)
const URL_PARAM = {
  ACTION:        'action',
  COMPANIONSHIP: 'c',
  LEADER:        'l',
  INTERVIEWER:   'i',   // D1, D2, D3 — used by QR codes
  SEARCH:        'q',   // last-name search string typed by companionship
  SLOT:          's',
};
const ACTIONS = {
  BOOK:        'book',          // Companionship booking (search-by-name)
  LEADER:      'leader',        // Leader manages their own availability
  DASHBOARD:   'dashboard',     // Presidency dashboard (private)
};

// === URL builders ===
// Companionships: 1 universal URL (last name auto-routes to assigned leader)
function bookingLandingUrl() {
  return ScriptApp.getService().getUrl() + '?' + URL_PARAM.ACTION + '=' + ACTIONS.BOOK;
}

// Direct deep-link to a specific companionship (used in confirmation emails)
function bookingUrlForCompanionship(cId) {
  return ScriptApp.getService().getUrl() + '?' + URL_PARAM.ACTION + '=' + ACTIONS.BOOK + '&' + URL_PARAM.COMPANIONSHIP + '=' + encodeURIComponent(cId);
}

// Leadership: 3 separate URLs (each leader manages their own availability)
function leaderAvailabilityUrl(interviewerCode) {
  return ScriptApp.getService().getUrl() + '?' + URL_PARAM.ACTION + '=' + ACTIONS.LEADER + '&' + URL_PARAM.INTERVIEWER + '=' + encodeURIComponent(interviewerCode);
}

// Lookup helper used by Sheets.gs and Dashboard.gs
function getLeaderByCode(code) {
  return getAllLeaders().find(l => l.code === code);
}
