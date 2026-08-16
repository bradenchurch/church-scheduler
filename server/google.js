import { google } from 'googleapis';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
];

export function getRedirectUri() {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  if (process.env.APP_URL) {
    return `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/google/callback`;
  }
  if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3001;
    return `http://localhost:${port}/api/auth/google/callback`;
  }
  throw new Error('GOOGLE_REDIRECT_URI or APP_URL must be set in production');
}

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const missing = [];
    if (!clientId) missing.push('GOOGLE_CLIENT_ID');
    if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');

    let redirectUri;
    try {
      redirectUri = getRedirectUri();
    } catch {
      redirectUri = '(unset — GOOGLE_REDIRECT_URI or APP_URL required in production)';
    }

    throw new Error(
      `Google OAuth not configured. Missing env vars: ${missing.join(', ')}. ` +
        `Redirect URI: ${redirectUri}. ` +
        'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and either GOOGLE_REDIRECT_URI or APP_URL.'
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
}

export function buildAuthUrl(state) {
  const oauth2 = getOAuthClient();
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
    state,
  });
}

export async function exchangeCode(code) {
  const oauth2 = getOAuthClient();
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

export function authorizedClient(tokenRow) {
  const oauth2 = getOAuthClient();
  oauth2.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date: tokenRow.expires_at ? new Date(tokenRow.expires_at).getTime() : undefined,
  });
  return oauth2;
}

export async function getTokenEmail(accessToken) {
  try {
    const oauth2 = getOAuthClient();
    const info = await oauth2.getTokenInfo(accessToken);
    return info.email || null;
  } catch {
    return null;
  }
}

export async function revokeToken(accessToken) {
  const oauth2 = getOAuthClient();
  await oauth2.revokeToken(accessToken);
}

function addMinutes(timeStr, minutes) {
  const [h, m, s = '0'] = String(timeStr).split(':').map(Number);
  const total = h * 60 + m + (minutes || 0);
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}:${String(s || 0).padStart(2, '0')}`;
}

export async function createCalendarEvent(oauth2, { summary, description, date, time, durationMinutes, attendees }) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2 });
  const timezone = process.env.APP_TIMEZONE || 'America/Denver';
  const startDateTime = `${date}T${time}`;
  const endDateTime = `${date}T${addMinutes(time, durationMinutes)}`;

  const requestBody = {
    summary,
    description,
    start: { dateTime: startDateTime, timeZone: timezone },
    end: { dateTime: endDateTime, timeZone: timezone },
  };
  if (attendees && attendees.length) {
    requestBody.attendees = attendees.map((email) => ({ email }));
  }

  const res = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all',
    requestBody,
  });
  return res.data;
}

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64url');
}

async function gmailSend(oauth2, raw) {
  const gmail = google.gmail({ version: 'v1', auth: oauth2 });
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: base64UrlEncode(raw) },
  });
  return res.data;
}

export async function sendEmail(oauth2, { to, subject, body }) {
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    body,
  ].join('\r\n');
  return gmailSend(oauth2, raw);
}

export async function sendEmailWithIcs(oauth2, { to, subject, body, icsContent, icsName = 'interview.ics' }) {
  const boundary = `----=_cs_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    body,
    '',
    `--${boundary}`,
    'Content-Type: text/calendar; charset="UTF-8"; method=REQUEST',
    `Content-Disposition: attachment; filename="${icsName}"`,
    'Content-Transfer-Encoding: 7bit',
    '',
    icsContent,
    '',
    `--${boundary}--`,
  ].join('\r\n');
  return gmailSend(oauth2, raw);
}

export function buildIcsContent({ summary, description, date, time, durationMinutes }) {
  const startStr = `${date}T${time}`.replace(/[-:]/g, '');
  const endStr = `${date}T${addMinutes(time, durationMinutes)}`.replace(/[-:]/g, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EQ Scheduler//EN',
    'BEGIN:VEVENT',
    `UID:${Math.random().toString(36).slice(2)}@church-scheduler`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
