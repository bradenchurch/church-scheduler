import {
  authorizedClient,
  createCalendarEvent,
  sendEmail,
  sendEmailWithIcs,
  buildIcsContent,
} from './google.js';

const TZ_LABEL = process.env.APP_TIMEZONE || 'America/Denver';

async function logConfirmation(supabaseAdmin, { bookingId, channel, status, recipient, error }) {
  try {
    await supabaseAdmin.from('confirmation_log').insert({
      booking_id: bookingId,
      channel,
      status,
      recipient: recipient || 'unknown',
      error: error ? String(error).slice(0, 500) : null,
    });
  } catch (err) {
    console.error(`[confirmation_log] failed to insert ${channel}/${status}:`, err.message);
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  return String(timeStr).slice(0, 5);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export async function handleBookingConfirmation(supabaseAdmin, booking) {
  const bookingId = booking.id;

  // 1. Resolve companionship + assigned leader
  const { data: companionship, error: compError } = await supabaseAdmin
    .from('companionships')
    .select('*, leaders(name, email)')
    .eq('id', booking.companionship_id)
    .single();

  if (compError || !companionship) {
    await logConfirmation(supabaseAdmin, {
      bookingId,
      channel: 'calendar',
      status: 'failed',
      recipient: 'unknown',
      error: `Companionship not found: ${compError?.message || 'missing'}`,
    });
    return;
  }

  const leader = companionship.leaders;
  const leaderEmail = leader?.email || null;
  const leaderName = leader?.name || 'the interviewer';
  const elderEmail = companionship.companion1_email || companionship.companion2_email || null;
  const invitee = elderEmail || leaderEmail;

  // 2. Resolve slot time
  const { data: slot } = booking.slot_id
    ? await supabaseAdmin.from('slots').select('*').eq('id', booking.slot_id).single()
    : { data: null };

  const date = booking.scheduled_date ? String(booking.scheduled_date).slice(0, 10) : '';
  const time = slot?.start_time ? String(slot.start_time).slice(0, 8) : '00:00:00';
  const durationMinutes = slot?.duration_minutes || 30;

  const summary = 'Ministering Interview';
  const description = `Ministering interview with ${leaderName}.`;

  // 3. Look up the leader's OAuth tokens
  const { data: tokenRow } = await supabaseAdmin
    .from('oauth_tokens')
    .select('*')
    .eq('email', leaderEmail)
    .maybeSingle();

  if (!tokenRow) {
    const reason = `No Google account connected for leader ${leaderEmail || companionship.leader_id}`;
    await logConfirmation(supabaseAdmin, { bookingId, channel: 'calendar', status: 'failed', recipient: invitee || leaderEmail || 'unknown', error: reason });
    await logConfirmation(supabaseAdmin, { bookingId, channel: 'email', status: 'failed', recipient: elderEmail || leaderEmail || 'unknown', error: reason });
    return { skipped: true, reason };
  }

  const oauth2 = authorizedClient(tokenRow);

  // 4. Calendar invite (leader's calendar, elder as attendee)
  try {
    await createCalendarEvent(oauth2, {
      summary,
      description,
      date,
      time,
      durationMinutes,
      attendees: invitee ? [invitee] : [],
    });
    await logConfirmation(supabaseAdmin, { bookingId, channel: 'calendar', status: 'sent', recipient: invitee || leaderEmail, error: null });
  } catch (calErr) {
    // Fallback: email the .ics attachment instead
    try {
      const icsContent = buildIcsContent({ summary, description, date, time, durationMinutes });
      await sendEmailWithIcs(oauth2, {
        to: invitee || leaderEmail,
        subject: `${summary} — ${formatDate(date)} at ${formatTime(time)}`,
        body: `Your interview has been scheduled.\n\n${leaderName} will meet with you on ${formatDate(date)} at ${formatTime(time)} (${TZ_LABEL}).\n\nThe attached calendar invitation can be imported into your calendar.`,
        icsContent,
      });
      await logConfirmation(supabaseAdmin, { bookingId, channel: 'calendar', status: 'sent', recipient: invitee || leaderEmail, error: 'Sent via email .ics fallback' });
    } catch (icsErr) {
      await logConfirmation(supabaseAdmin, { bookingId, channel: 'calendar', status: 'failed', recipient: invitee || leaderEmail, error: `${calErr.message} | ${icsErr.message}` });
    }
  }

  // 5. Confirmation email to the elder
  try {
    const emailBody = `Your interview request has been confirmed.\n\n${leaderName} will meet with you on ${formatDate(date)} at ${formatTime(time)} (${TZ_LABEL}).`;
    await sendEmail(oauth2, {
      to: elderEmail || leaderEmail,
      subject: `Confirmed: Ministering Interview on ${formatDate(date)}`,
      body: emailBody,
    });
    await logConfirmation(supabaseAdmin, { bookingId, channel: 'email', status: 'sent', recipient: elderEmail || leaderEmail, error: null });
  } catch (emailErr) {
    await logConfirmation(supabaseAdmin, { bookingId, channel: 'email', status: 'failed', recipient: elderEmail || leaderEmail, error: emailErr.message });
  }

  return { sent: true, invitee: invitee || leaderEmail };
}
