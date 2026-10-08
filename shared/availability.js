// Pure availability helpers shared by the API and the Availability page.
// Date math uses UTC noon so a DST fall-back (Nov 1) cannot shift the calendar date.

export const UI_SLOT_LENGTHS = [15, 30, 45, 60];
export const SLOT_LENGTHS = [15, 20, 30, 45, 60];
export const BUFFER_MINUTES = [0, 5, 10];
export const MAX_RANGE_DAYS = 26 * 7;
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAY_CHIP = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return UUID_RE.test(String(value || ''));
}

export function timeKey(value) {
  const text = String(value || '');
  const match = text.match(/^(\d{2}):(\d{2})/);
  if (!match) return text;
  return `${match[1]}:${match[2]}`;
}

export function minutesOf(value) {
  const key = timeKey(value);
  const [h, m] = key.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

export function formatTime12(value) {
  const mins = minutesOf(value);
  if (!Number.isFinite(mins)) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function todayInTimeZone(timeZone = 'America/Denver', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const pick = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

export function clockInTimeZone(timeZone = 'America/Denver', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const pick = (type) => Number(parts.find((p) => p.type === type)?.value || '0');
  return pick('hour') * 60 + pick('minute');
}

export function addDaysISO(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from, to) {
  const a = new Date(`${from}T12:00:00Z`).getTime();
  const b = new Date(`${to}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86400000);
}

export function weekdayIndex(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

export function mondayOf(dateStr) {
  const day = weekdayIndex(dateStr);
  const diff = day === 0 ? -6 : 1 - day;
  return addDaysISO(dateStr, diff);
}

export function endOfMonth(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  return d.toISOString().slice(0, 10);
}

export function endOfQuarter(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  const qEnd = Math.ceil(m / 3) * 3;
  const d = new Date(Date.UTC(y, qEnd, 0));
  return d.toISOString().slice(0, 10);
}

export function formatMonthDay(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function formatWeekdayMonthDay(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatLongDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function visitCount(start, end, slot, buffer = 0) {
  const span = minutesOf(end) - minutesOf(start);
  const length = Number(slot) || 0;
  const gap = Number(buffer) || 0;
  if (length <= 0 || span < length) return 0;
  const step = length + gap;
  return Math.floor((span - length) / step) + 1;
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function normalizeRow(row) {
  return {
    ...row,
    window_date: String(row.window_date || '').slice(0, 10),
    start_time: timeKey(row.start_time),
    end_time: timeKey(row.end_time),
    slot_duration_minutes: Number(row.slot_duration_minutes ?? 30),
    buffer_minutes: Number(row.buffer_minutes ?? 0),
  };
}

export function validateWindowInput(input) {
  const { window_date, start_time, end_time, slot_duration_minutes, buffer_minutes } = input || {};

  if (!window_date || !start_time || !end_time) {
    return { error: 'window_date, start_time, end_time required' };
  }
  if (!DATE_RE.test(String(window_date))) {
    return { error: 'window_date must be YYYY-MM-DD' };
  }
  if (!TIME_RE.test(String(start_time)) || !TIME_RE.test(String(end_time))) {
    return { error: 'start_time / end_time must be HH:MM[:SS]' };
  }
  const start = timeKey(start_time);
  const end = timeKey(end_time);
  if (end <= start) {
    return { error: 'end_time must be after start_time' };
  }

  let slotDuration = 30;
  if (slot_duration_minutes !== undefined && slot_duration_minutes !== null && slot_duration_minutes !== '') {
    const parsed = Number(slot_duration_minutes);
    if (!Number.isInteger(parsed) || !SLOT_LENGTHS.includes(parsed)) {
      return { error: 'slot_duration_minutes must be one of 15, 20, 30, 45, 60' };
    }
    slotDuration = parsed;
  }

  let buffer = 0;
  if (buffer_minutes !== undefined && buffer_minutes !== null && buffer_minutes !== '') {
    const parsed = Number(buffer_minutes);
    if (!Number.isInteger(parsed) || !BUFFER_MINUTES.includes(parsed)) {
      return { error: 'buffer_minutes must be one of 0, 5, 10' };
    }
    buffer = parsed;
  }

  if (visitCount(start, end, slotDuration, buffer) < 1) {
    return { error: 'window is shorter than one visit' };
  }

  return {
    value: {
      window_date: String(window_date).slice(0, 10),
      start_time: start,
      end_time: end,
      slot_duration_minutes: slotDuration,
      buffer_minutes: buffer,
    },
  };
}

export function expandPattern({ ranges, slot = 30, buffer = 0, from, to, excludedDates = [] }) {
  if (!from || !to || from > to) return [];
  const excluded = new Set((excludedDates || []).map((d) => String(d).slice(0, 10)));
  const out = [];
  const seen = new Set();
  for (let cursor = from; cursor <= to; cursor = addDaysISO(cursor, 1)) {
    const weekday = weekdayIndex(cursor);
    for (const range of ranges || []) {
      const days = range.weekdays || [];
      if (!days.includes(weekday)) continue;
      if (excluded.has(cursor)) continue;
      const start = timeKey(range.start);
      const end = timeKey(range.end);
      const key = `${cursor}|${start}|${end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        window_date: cursor,
        start_time: start,
        end_time: end,
        slot_duration_minutes: Number(slot),
        buffer_minutes: Number(buffer),
      });
    }
  }
  out.sort((a, b) => a.window_date.localeCompare(b.window_date) || a.start_time.localeCompare(b.start_time));
  return out;
}

export function dedupeExact(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const n = normalizeRow(row);
    const key = `${n.window_date}|${n.start_time}|${n.end_time}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

/**
 * Compare proposed rows with windows that already exist.
 * Touching ranges (7–8 and 8–9) are not overlaps.
 */
export function classify(rows, existing) {
  const incoming = dedupeExact(rows);
  const have = (existing || []).map(normalizeRow);

  const internalOverlap = [];
  for (let i = 0; i < incoming.length; i += 1) {
    for (let j = i + 1; j < incoming.length; j += 1) {
      const a = incoming[i];
      const b = incoming[j];
      if (a.window_date !== b.window_date) continue;
      if (rangesOverlap(a.start_time, a.end_time, b.start_time, b.end_time)) {
        internalOverlap.push([a, b]);
      }
    }
  }

  const create = [];
  const exact = [];
  const overlap = [];
  for (const row of incoming) {
    const identical = have.find(
      (e) => e.window_date === row.window_date && e.start_time === row.start_time && e.end_time === row.end_time,
    );
    if (identical) {
      exact.push({ row, existing: identical });
      continue;
    }
    const hits = have.filter(
      (e) => e.window_date === row.window_date && rangesOverlap(row.start_time, row.end_time, e.start_time, e.end_time),
    );
    if (hits.length) {
      overlap.push({ row, existing: hits });
      continue;
    }
    create.push(row);
  }

  return { create, exact, overlap, internalOverlap };
}

export function patternProblems({ ranges, slot, buffer, from, to }) {
  const problems = [];
  if (!ranges?.length || ranges.every((r) => !(r.weekdays || []).length)) {
    problems.push('Pick at least one day.');
  }
  for (const range of ranges || []) {
    if (!(range.weekdays || []).length) {
      problems.push('Each row needs at least one day.');
      break;
    }
    if (!range.start || !range.end) {
      problems.push('Each row needs a start and an end time.');
      break;
    }
    if (timeKey(range.end) <= timeKey(range.start)) {
      problems.push('End time needs to be after the start time.');
      break;
    }
    if (visitCount(range.start, range.end, slot, buffer) < 1) {
      problems.push('That window is shorter than one visit.');
      break;
    }
  }
  if (!from || !to) {
    problems.push('Choose a start and end date.');
  } else if (to < from) {
    problems.push('The end date is before the start date.');
  } else if (daysBetween(from, to) > MAX_RANGE_DAYS) {
    problems.push('Pick a range of 26 weeks or less.');
  }
  return [...new Set(problems)];
}

export function groupRowsByWeek(rows) {
  const groups = new Map();
  for (const row of rows) {
    const week = mondayOf(row.window_date);
    if (!groups.has(week)) groups.set(week, []);
    groups.get(week).push(row);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, items]) => ({
      week,
      label: formatMonthDay(week),
      rows: items.sort((a, b) => a.window_date.localeCompare(b.window_date) || a.start_time.localeCompare(b.start_time)),
    }));
}

export function safeNextPath(value) {
  if (typeof value !== 'string') return '';
  const path = value.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return '';
  if (path.includes('\\') || path.includes('://') || path.includes('\0')) return '';
  return path.split('#')[0];
}

export function legacyPatternFromSlots(slots) {
  const rows = (slots || []).map((s) => ({
    weekday: Number(s.day_of_week),
    start: minutesOf(s.start_time),
    end: minutesOf(s.start_time) + (Number(s.duration_minutes) || 30),
  })).filter((s) => Number.isFinite(s.start));
  if (!rows.length) return null;
  const weekdays = [...new Set(rows.map((r) => r.weekday))].sort((a, b) => a - b);
  const start = Math.min(...rows.map((r) => r.start));
  const end = Math.max(...rows.map((r) => r.end));
  const toHH = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  return { weekdays, start: toHH(start), end: toHH(end), slot: 30, buffer: 0 };
}
