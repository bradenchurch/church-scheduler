/**
 * EQ Presidency Scheduler — Sheets CRUD
 *
 * All sheet reads/writes go through here. Keeps schema isolated.
 */

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Sheet "${name}" not found. Run bootstrap() first.`);
  return sheet;
}

function readRowsAsObjects_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function findRowById_(sheet, idColumn, idValue) {
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf(idColumn);
  if (idCol === -1) throw new Error(`Column ${idColumn} not in ${sheet.getName()}`);
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === idValue) return { row: i + 1, values: data[i] };
  }
  return null;
}

function nextId_(sheet, idColumn, prefix) {
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf(idColumn);
  let maxN = 0;
  for (let i = 1; i < data.length; i++) {
    const val = data[i][idCol];
    if (typeof val === 'string' && val.startsWith(prefix)) {
      const n = parseInt(val.slice(prefix.length + 1), 10);
      if (!isNaN(n) && n > maxN) maxN = n;
    }
  }
  return `${prefix}-${String(maxN + 1).padStart(3, '0')}`;
}

// === Leaders ===

function getLeaderById(leaderId) {
  const rows = readRowsAsObjects_(getSheet_(SHEET_NAMES.LEADERS));
  return rows.find(r => r.LeaderId === leaderId);
}

function getAllLeaders() {
  return readRowsAsObjects_(getSheet_(SHEET_NAMES.LEADERS));
}

function getLeaderByCode(code) {
  const rows = readRowsAsObjects_(getSheet_(SHEET_NAMES.LEADERS));
  return rows.find(r => r.Code === code);
}

// === Companionships ===

function getCompanionshipById(cid) {
  const rows = readRowsAsObjects_(getSheet_(SHEET_NAMES.COMPANIONSHIPS));
  return rows.find(r => r.CompanionshipId === cid);
}

function getCompanionshipsByQuarter(quarter) {
  return readRowsAsObjects_(getSheet_(SHEET_NAMES.COMPANIONSHIPS))
    .filter(r => r.Quarter === quarter);
}

function getCompanionshipsForLeader(leaderId, quarter) {
  return getCompanionshipsByQuarter(quarter)
    .filter(r => r.AssignedLeaderId === leaderId);
}

function updateCompanionshipStatus(cid, newStatus, bookingId) {
  const sheet = getSheet_(SHEET_NAMES.COMPANIONSHIPS);
  const found = findRowById_(sheet, 'CompanionshipId', cid);
  if (!found) throw new Error(`Companionship ${cid} not found`);
  const headers = sheet.getDataRange().getValues()[0];
  const statusCol = headers.indexOf('Status') + 1;
  const bookedAtCol = headers.indexOf('BookedAt') + 1;
  const bookingIdCol = headers.indexOf('BookingId') + 1;
  sheet.getRange(found.row, statusCol).setValue(newStatus);
  if (newStatus === 'Booked') sheet.getRange(found.row, bookedAtCol).setValue(new Date());
  if (bookingId) sheet.getRange(found.row, bookingIdCol).setValue(bookingId);
}

// === Availability ===

function getOpenSlotsForLeader(leaderId, quarter) {
  return readRowsAsObjects_(getSheet_(SHEET_NAMES.AVAILABILITY))
    .filter(r => r.LeaderId === leaderId && r.Quarter === quarter && r.Status === 'Open');
}

function addAvailabilitySlot(leaderId, start, end, quarter) {
  const sheet = getSheet_(SHEET_NAMES.AVAILABILITY);
  const slotId = nextId_(sheet, 'SlotId', 'S');
  const headers = sheet.getDataRange().getValues()[0];
  const row = headers.map(h => {
    switch (h) {
      case 'SlotId':     return slotId;
      case 'LeaderId':   return leaderId;
      case 'Start':      return new Date(start);
      case 'End':        return new Date(end);
      case 'Quarter':    return quarter;
      case 'Status':     return 'Open';
      case 'BookingId':  return '';
      default:           return '';
    }
  });
  sheet.appendRow(row);
  return slotId;
}

function deleteAvailabilitySlot(slotId) {
  const sheet = getSheet_(SHEET_NAMES.AVAILABILITY);
  const found = findRowById_(sheet, 'SlotId', slotId);
  if (!found) return;
  if (found.values[found.values.indexOf('Status') + 0] !== 'Open') {
    throw new Error('Cannot delete a slot that has been booked.');
  }
  sheet.deleteRow(found.row);
}

function bookAvailabilitySlot(slotId, bookingId) {
  const sheet = getSheet_(SHEET_NAMES.AVAILABILITY);
  const found = findRowById_(sheet, 'SlotId', slotId);
  if (!found) throw new Error(`Slot ${slotId} not found`);
  const headers = sheet.getDataRange().getValues()[0];
  const statusCol = headers.indexOf('Status') + 1;
  const bookingIdCol = headers.indexOf('BookingId') + 1;
  if (found.values[headers.indexOf('Status')] !== 'Open') {
    throw new Error('Slot is no longer available. Please pick another.');
  }
  sheet.getRange(found.row, statusCol).setValue('Booked');
  sheet.getRange(found.row, bookingIdCol).setValue(bookingId);
}

// === Bookings ===

function createBooking(cid, slotId, quarter) {
  const sheet = getSheet_(SHEET_NAMES.BOOKINGS);
  const bookingId = nextId_(sheet, 'BookingId', 'B');
  const headers = sheet.getDataRange().getValues()[0];
  const row = headers.map(h => {
    switch (h) {
      case 'BookingId':        return bookingId;
      case 'CompanionshipId':  return cid;
      case 'SlotId':           return slotId;
      case 'Quarter':          return quarter;
      case 'CreatedAt':        return new Date();
      case 'CalendarEventId':  return '';
      case 'ReminderSent':     return false;
      case 'ReminderSentAt':   return '';
      default:                 return '';
    }
  });
  sheet.appendRow(row);
  return bookingId;
}

function getBookingsNeedingReminders(tomorrowStart, tomorrowEnd) {
  return readRowsAsObjects_(getSheet_(SHEET_NAMES.BOOKINGS))
    .filter(b => {
      if (b.ReminderSent === true) return false;
      // Need cross-reference to slot to check the time
      const slotSheet = getSheet_(SHEET_NAMES.AVAILABILITY);
      const slot = findRowById_(slotSheet, 'SlotId', b.SlotId);
      if (!slot) return false;
      const startDate = new Date(slot.values[slotSheet.getDataRange().getValues()[0].indexOf('Start')]);
      return startDate >= tomorrowStart && startDate < tomorrowEnd;
    });
}

function markReminderSent(bookingId) {
  const sheet = getSheet_(SHEET_NAMES.BOOKINGS);
  const found = findRowById_(sheet, 'BookingId', bookingId);
  if (!found) return;
  const headers = sheet.getDataRange().getValues()[0];
  const sentCol = headers.indexOf('ReminderSent') + 1;
  const atCol = headers.indexOf('ReminderSentAt') + 1;
  sheet.getRange(found.row, sentCol).setValue(true);
  sheet.getRange(found.row, atCol).setValue(new Date());
}

function updateBookingCalendarEventId(bookingId, eventId) {
  const sheet = getSheet_(SHEET_NAMES.BOOKINGS);
  const found = findRowById_(sheet, 'BookingId', bookingId);
  if (!found) return;
  const headers = sheet.getDataRange().getValues()[0];
  const col = headers.indexOf('CalendarEventId') + 1;
  sheet.getRange(found.row, col).setValue(eventId);
}
