import React, { useState, useEffect, useMemo } from 'react';
import { getAvailability } from '../api/chapel';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

function toLocalDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTime(t) {
  if (!t) return '';
  return String(t).slice(0, 5);
}

// Expand a date-specific availability window into 30-minute bookable increments.
// e.g. "08:00"–"10:00" → ["08:00", "08:30", "09:00", "09:30"].
function expandWindowTimes(start, end) {
  if (!start || !end) return [];
  const [sh, sm] = String(start).split(':').map(Number);
  const [eh, em] = String(end).split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const out = [];
  for (let m = startMin; m < endMin; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return out;
}

/**
 * Optional "preferred meeting slot" picker. Shows the next 30 days (weekdays
 * preferred) plus a time dropdown derived from the leader's recurring weekly
 * slots. Both fields are optional — the companion can skip entirely.
 *
 * value/onChange use { preferred_slot_date, preferred_slot_time }.
 */
export default function SlotPicker({ leaderId, availability, value = {}, onChange }) {
  const [fetchedAvailability, setFetchedAvailability] = useState(null);
  const [loaded, setLoaded] = useState(!!availability);

  const days = useMemo(() => {
    const out = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  useEffect(() => {
    if (availability) {
      setFetchedAvailability(availability);
      setLoaded(true);
      return;
    }
    let active = true;
    setLoaded(false);
    if (!leaderId) {
      setFetchedAvailability(null);
      setLoaded(true);
      return () => {
        active = false;
      };
    }
    getAvailability(leaderId)
      .then((data) => {
        if (active) setFetchedAvailability(data);
      })
      .catch(() => {
        if (active) setFetchedAvailability(null);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [leaderId, availability]);

  const slots = fetchedAvailability?.slots || [];
  const windows = fetchedAvailability?.windows || [];
  const selectedDate = value.preferred_slot_date || '';
  const selectedTime = value.preferred_slot_time || '';
  const weekday = selectedDate ? new Date(`${selectedDate}T00:00:00`).getDay() : null;
  const matchingSlots =
    weekday == null ? slots : slots.filter((s) => Number(s.day_of_week) === weekday);

  // Date-specific windows that fall on the selected date, expanded into 30-min
  // bookable increments. These supplement (not replace) the recurring slots.
  const windowsOnDate = selectedDate
    ? windows.filter((w) => String(w.window_date).slice(0, 10) === selectedDate)
    : [];
  const windowTimes = windowsOnDate.flatMap((w) => expandWindowTimes(w.start_time, w.end_time));

  const setDate = (d) => {
    const dateStr = toLocalDateString(d);
    let time = value.preferred_slot_time || '';
    if (time) {
      const forDay = slots.filter((s) => Number(s.day_of_week) === d.getDay());
      const forWindows = windows
        .filter((w) => String(w.window_date).slice(0, 10) === dateStr)
        .flatMap((w) => expandWindowTimes(w.start_time, w.end_time));
      if (!forDay.some((s) => s.start_time === time) && !forWindows.includes(time)) time = '';
    }
    onChange({ preferred_slot_date: dateStr, preferred_slot_time: time });
  };

  const setTime = (t) => {
    onChange({ preferred_slot_date: value.preferred_slot_date || '', preferred_slot_time: t });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-brown">
        <CalendarIcon />
        <span className="text-sm font-semibold">When can you meet?</span>
        <span className="text-xs text-brown-light">(optional)</span>
      </div>

      {/* Next 30 days (weekdays preferred) */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {days.map((d) => {
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const isSelected = selectedDate === toLocalDateString(d);
          return (
            <button
              key={toLocalDateString(d)}
              type="button"
              onClick={() => setDate(d)}
              className={`flex-shrink-0 min-w-[52px] min-h-[44px] rounded-lg border flex flex-col items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-burgundy text-white border-burgundy'
                  : isWeekend
                    ? 'bg-cream text-brown-light border-warm-border hover:border-brown-light'
                    : 'bg-warm-white text-brown border-warm-border hover:border-burgundy'
              }`}
            >
              <span className="text-[11px] leading-none">{DAY_SHORT[d.getDay()]}</span>
              <span className="text-base font-semibold leading-tight">{d.getDate()}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-brown-light">Weekdays are preferred.</p>

      {/* Time dropdown (leader's weekly slots) */}
      <div className="flex items-center gap-2">
        <span className="text-brown-light">
          <ClockIcon />
        </span>
        <select
          value={selectedTime}
          onChange={(e) => setTime(e.target.value)}
          className="w-full min-h-[44px] rounded-lg border border-warm-border bg-warm-white px-3 text-base text-brown focus:outline-none focus:border-burgundy"
        >
          <option value="">No preference</option>
          {matchingSlots.map((s) => (
            <option key={s.id} value={s.start_time}>
              {DAY_LABELS[Number(s.day_of_week)]} {formatTime(s.start_time)}
              {s.duration_minutes ? ` (${s.duration_minutes} min)` : ''}
            </option>
          ))}
          {windowTimes.map((t) => (
            <option key={`win-${t}`} value={t}>
              {formatTime(t)} (available window)
            </option>
          ))}
        </select>
      </div>

      {loaded && slots.length === 0 && windows.length === 0 && (
        <p className="text-xs text-brown-light">
          Your presidency member hasn&apos;t added availability yet — feel free to skip this.
        </p>
      )}
      {selectedDate && weekday != null && matchingSlots.length === 0 && windowTimes.length === 0 && (
        <p className="text-xs text-amber">No available times on that day. Pick another day or leave “No preference”.</p>
      )}
    </div>
  );
}
