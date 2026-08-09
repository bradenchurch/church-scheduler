/**
 * EQ Presidency Scheduler — Reminder Trigger
 *
 * Daily 8 AM Mountain Time: scan for interviews happening tomorrow,
 * send reminder emails from the leader's "Send mail as" alias (or fallback).
 */

/**
 * Install the time-driven trigger. Run once after deploying.
 */
function installReminderTrigger() {
  // Remove any pre-existing triggers for this function
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'runDailyReminders')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('runDailyReminders')
    .timeBased()
    .atHour(REMINDER_HOUR_LOCAL)
    .inTimezone(TIMEZONE)
    .everyDays(1)
    .create();

  SpreadsheetApp.getUi().alert('Reminder trigger installed. Daily at 8 AM ' + TIMEZONE + '.');
}

function removeReminderTrigger() {
  const triggers = ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'runDailyReminders');
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  SpreadsheetApp.getUi().alert(triggers.length + ' reminder trigger(s) removed.');
}

/**
 * Trigger entry point. Runs daily.
 */
function runDailyReminders() {
  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const bookings = getBookingsNeedingReminders(tomorrowStart, tomorrowEnd);
  bookings.forEach(b => {
    const comp = getCompanionshipById(b.CompanionshipId);
    const leader = getLeaderById(comp.AssignedLeaderId);
    const slotSheet = getSheet_(SHEET_NAMES.AVAILABILITY);
    const slotRow = findRowById_(slotSheet, 'SlotId', b.SlotId);
    const slotHeaders = slotSheet.getDataRange().getValues()[0];
    const slot = {
      SlotId: b.SlotId,
      Start: slotRow.values[slotHeaders.indexOf('Start')],
      End:   slotRow.values[slotHeaders.indexOf('End')],
    };
    try {
      sendReminder(b, comp, slot, leader);
    } catch (err) {
      console.error(`Reminder failed for booking ${b.BookingId}:`, err);
    }
  });

  console.log(`[runDailyReminders] ${bookings.length} reminder(s) sent.`);
}

/**
 * Manual trigger — for testing. Pass a date string to fake the "tomorrow" date.
 */
function runDailyRemindersManual(fakeTomorrow) {
  const baseDate = fakeTomorrow ? new Date(fakeTomorrow) : new Date();
  const tomorrowStart = new Date(baseDate);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const bookings = getBookingsNeedingReminders(tomorrowStart, tomorrowEnd);
  return bookings.map(b => b.BookingId);
}
