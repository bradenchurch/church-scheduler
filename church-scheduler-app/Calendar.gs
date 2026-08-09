/**
 * EQ Presidency Scheduler — Calendar
 *
 * One-way calendar push: events land on leader's default calendar.
 * Leader never has to share their calendar with anyone.
 */

function createInterviewEvent(slot, leader, companionship) {
  const title = `EQ Presidency Interview: ${companionship.Elder1Name} & ${companionship.Elder2Name}`;
  const description = [
    'Quarterly Elders Quorum Presidency ↔ Companionship interview.',
    '',
    `Companionship: ${companionship.Elder1Name} & ${companionship.Elder2Name}`,
    companionship.Elder1Email ? `Elder 1 email: ${companionship.Elder1Email}` : '',
    companionship.Elder2Email ? `Elder 2 email: ${companionship.Elder2Email}` : '',
    '',
    'Booked via EQ Presidency Scheduler.',
  ].filter(Boolean).join('\n');

  const event = {
    summary: title,
    description: description,
    start: { dateTime: new Date(slot.Start).toISOString(), timeZone: TIMEZONE },
    end:   { dateTime: new Date(slot.End).toISOString(),   timeZone: TIMEZONE },
    attendees: [
      companionship.Elder1Email,
      companionship.Elder2Email,
    ].filter(Boolean).map(email => ({ email })),
    location: 'TBD (virtual or in-person — interviewer to confirm)',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  try {
    const cal = CalendarApp.getCalendarById(leader.CalendarId || 'primary');
    const created = cal.createEvent(event.summary, new Date(slot.Start), new Date(slot.End), {
      description: event.description,
      location: event.location,
      guests: event.attendees.map(a => a.email).join(','),
      sendInvites: true,
    });
    return created.getId();
  } catch (err) {
    console.error('Calendar create failed:', err);
    return null;
  }
}
