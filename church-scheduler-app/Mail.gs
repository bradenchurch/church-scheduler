/**
 * EQ Presidency Scheduler — Mail
 *
 * - Send booking confirmation (to companions)
 * - Send reminder 24h before (from leader's "Send mail as" alias)
 */

function sendBookingInvite(booking, companionship, slot, leader) {
  const when = new Date(slot.Start);
  const whenStr = when.toLocaleString('en-US', {
    timeZone: TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const subject = `✅ Interview scheduled with ${leader.name.split(',')[0]}`;
  const body = [
    `Hi ${companionship.Elder1Name.split(' ')[0]} and ${companionship.Elder2Name.split(' ')[0]},`,
    '',
    `Your quarterly Elders Quorum Presidency interview is confirmed:`,
    '',
    `   📅 ${whenStr}`,
    `   👤 With ${leader.name}`,
    '',
    'Please reply directly to this email or to your interviewer if you need to reschedule.',
    '',
    'You should also have a calendar invite in your inbox.',
    '',
    '— EQ Presidency Scheduler',
  ].join('\n');

  const recipients = [companionship.Elder1Email, companionship.Elder2Email].filter(Boolean);
  if (recipients.length === 0) return; // No emails on file, skip

  try {
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: subject,
      body: body,
      name: 'EQ Presidency Scheduler',
    });
  } catch (err) {
    console.error('Booking invite email failed:', err);
  }
}

function sendReminder(booking, companionship, slot, leader) {
  const when = new Date(slot.Start);
  const whenStr = when.toLocaleString('en-US', {
    timeZone: TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const subject = `📅 Reminder: Companionship interview tomorrow (${whenStr})`;
  const body = [
    `Hi ${leader.name.split(',')[0]},`,
    '',
    `Friendly reminder that tomorrow you have:`,
    '',
    `   📅 ${whenStr}`,
    `   👤 ${companionship.Elder1Name} & ${companionship.Elder2Name}`,
    '',
    'The companionship should also have a calendar invite.',
    '',
    '— Sent automatically by EQ Presidency Scheduler',
  ].join('\n');

  try {
    if (leader['SendAs Configured?'] === true || leader['SendAs Configured?'] === 'TRUE') {
      // Send from the leader's alias
      MailApp.sendEmail({
        to: leader.email,
        subject: subject,
        body: body,
        from: leader.email,
        name: leader.name,
      });
    } else {
      // Fallback: send from script's default sender with "on behalf of" prefix
      MailApp.sendEmail({
        to: leader.email,
        subject: `[On behalf of ${leader.name}] ${subject}`,
        body: `Note: This reminder was sent on behalf of ${leader.name} because their Gmail "Send mail as" alias is not configured.\n\n` + body,
        name: 'EQ Presidency Scheduler',
      });
    }
    markReminderSent(booking.BookingId);
  } catch (err) {
    console.error('Reminder email failed:', err);
  }
}
