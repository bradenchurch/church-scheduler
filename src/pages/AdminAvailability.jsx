import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authedFetch } from '../lib/api';
import SectionLabel from '../components/SectionLabel';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIME_PRESETS = [
  { label: 'Sunday Afternoon', start: '13:00', end: '15:00' },
  { label: 'Sunday Evening', start: '18:00', end: '20:00' },
  { label: 'Weeknight Evening', start: '19:00', end: '21:00' },
  { label: 'Saturday Morning', start: '08:00', end: '10:00' },
];

const SLOT_DURATIONS = [15, 20, 30, 45, 60];

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime12(t) {
  if (!t) return '';
  const parts = String(t).split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]) || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatFullDate(dateStr) {
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

function formatShortDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// Add `weeks` whole weeks to an ISO date string (e.g. 2026-08-23 + 1 => 2026-08-30).
function addWeeksISO(dateStr, weeks) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + weeks * 7);
  return toISODate(d);
}

// Build the 42-cell (6x7) calendar grid for a given year/month.
function buildMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = first.getDay(); // 0 = Sunday
  const cells = [];

  for (let i = 0; i < offset; i++) {
    cells.push(null); // leading blank cells
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

// All Sunday Date objects within a given year/month.
function sundaysInMonth(year, month) {
  const days = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    if (dt.getDay() === 0) days.push(dt);
  }
  return days;
}

// Expand selected dates when "Repeat weekly" is enabled. `repeatWeeks` is the
// TOTAL number of occurrences (selected date + N-1 following weeks). So 4 weeks
// for Aug 23 => Aug 23, Aug 30, Sep 6, Sep 13.
function expandDates(selectedDates, repeatWeekly, repeatWeeks) {
  if (!repeatWeekly) return selectedDates;
  const weeks = Math.max(2, Math.floor(Number(repeatWeeks) || 2));
  const result = [];
  for (const d of selectedDates) {
    result.push(d);
    for (let w = 1; w < weeks; w++) {
      result.push(addWeeksISO(d, w));
    }
  }
  return [...new Set(result)].sort();
}

export default function AdminAvailability() {
  const { role, leaderId } = useAuth();
  const isAllowed = role === 'leader' || role === 'admin';

  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDates, setSelectedDates] = useState([]);

  // Add-window form state.
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slotDuration, setSlotDuration] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(4);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadWindows = useCallback(async () => {
    if (!leaderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await authedFetch(`/api/availability/${leaderId}/windows`);
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setWindows(data?.windows || []);
    } catch (err) {
      setError(err.message || 'Failed to load windows');
      setWindows([]);
    } finally {
      setLoading(false);
    }
  }, [leaderId]);

  useEffect(() => {
    if (isAllowed) loadWindows();
  }, [isAllowed, loadWindows]);

  const windowsByDate = useMemo(() => {
    const map = {};
    for (const w of windows) {
      const d = String(w.window_date).slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(w);
    }
    return map;
  }, [windows]);

  const cells = useMemo(
    () => buildMonthCells(displayedMonth.getFullYear(), displayedMonth.getMonth()),
    [displayedMonth]
  );

  const monthLabel = displayedMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () =>
    setDisplayedMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () =>
    setDisplayedMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    setDisplayedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const toggleDate = (dateStr) => {
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  const clearSelectedDates = () => setSelectedDates([]);

  // monthOffset 0 => "this month" (the displayed month), 1 => next month.
  // Only future Sundays are selectable (past dates are disabled on the grid).
  const selectSundays = (monthOffset) => {
    const target = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + monthOffset,
      1
    );
    const days = sundaysInMonth(target.getFullYear(), target.getMonth())
      .filter((dt) => dt >= todayMidnight)
      .map((dt) => toISODate(dt));
    setSelectedDates(days);
  };

  const sortedSelectedDates = useMemo(
    () => [...selectedDates].sort(),
    [selectedDates]
  );

  // Windows already published on the currently selected dates.
  const selectedWindows = useMemo(() => {
    const list = [];
    for (const d of sortedSelectedDates) {
      for (const w of windowsByDate[d] || []) {
        list.push({ ...w, date: d });
      }
    }
    return list;
  }, [sortedSelectedDates, windowsByDate]);

  const handleApplyPreset = (preset) => {
    setStartTime(preset.start);
    setEndTime(preset.end);
    setFormError('');
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    setFormError('');

    if (sortedSelectedDates.length === 0) {
      setFormError('Select at least one date on the calendar.');
      return;
    }
    if (!startTime || !endTime) {
      setFormError('Start and end times are required.');
      return;
    }
    if (endTime <= startTime) {
      setFormError('End time must be after start time.');
      return;
    }

    const dates = expandDates(sortedSelectedDates, repeatWeekly, repeatWeeks);
    const payload = {
      windows: dates.map((window_date) => ({
        window_date,
        start_time: startTime,
        end_time: endTime,
        slot_duration_minutes: slotDuration,
        buffer_minutes: bufferMinutes,
      })),
    };

    setSaving(true);
    try {
      const res = await authedFetch(`/api/availability/${leaderId}/windows/batch`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to add windows');
      }
      await loadWindows();
      // Keep the dates selected so the user can review what was just added.
    } catch (err) {
      setFormError(err.message || 'Failed to add windows');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const res = await authedFetch(`/api/availability/windows/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || 'Failed to delete window');
    }
    await loadWindows();
  };

  if (!isAllowed) {
    return (
      <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
        <p className="text-lg font-serif font-semibold text-rose">Access denied</p>
        <p className="text-sm text-brown-light mt-2">
          Only presidency members can publish availability.
        </p>
      </div>
    );
  }

  const expandedCount = expandDates(sortedSelectedDates, repeatWeekly, repeatWeeks).length;
  const publishLabel = saving
    ? 'Publishing…'
    : `Publish ${expandedCount} window${expandedCount === 1 ? '' : 's'}`;

  return (
    <div className="space-y-6 pb-28 sm:pb-6">
      {/* Header */}
      <div>
        <SectionLabel>Admin · Availability</SectionLabel>
        <h1 className="text-3xl font-serif font-bold text-burgundy mt-1">Availability</h1>
        <p className="text-brown-light mt-1 max-w-xl">
          Select dates on the calendar, set a time, and publish your availability in a
          single tap.
        </p>
      </div>

      {error && (
        <div className="bg-white rounded-xl border border-warm-border p-5">
          <p className="text-sm text-rose">{error}</p>
          <button
            onClick={loadWindows}
            className="mt-3 min-h-[48px] inline-flex items-center gap-2 px-5 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:bg-cream transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-warm-border shadow-sm p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-serif font-bold text-burgundy">{monthLabel}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-lg border border-warm-border text-brown hover:bg-cream transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={goToday}
              className="min-h-[48px] px-4 rounded-lg border-[1.5px] border-warm-border text-brown text-sm font-semibold hover:bg-cream transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-lg border border-warm-border text-brown hover:bg-cream transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Date shortcuts */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => selectSundays(0)}
            className="min-h-[48px] w-full sm:w-auto px-4 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:border-burgundy transition-colors"
          >
            All Sundays This Month
          </button>
          <button
            type="button"
            onClick={() => selectSundays(1)}
            className="min-h-[48px] w-full sm:w-auto px-4 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:border-burgundy transition-colors"
          >
            All Sundays Next Month
          </button>
          <button
            type="button"
            onClick={clearSelectedDates}
            disabled={selectedDates.length === 0}
            className="min-h-[48px] w-full sm:w-auto px-4 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:border-burgundy disabled:opacity-40 transition-colors"
          >
            Clear Selected Dates
          </button>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-brown-light uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) {
              return <div key={`blank-${i}`} className="min-h-[48px] sm:min-h-[56px]" />;
            }
            const dateStr = toISODate(cell);
            const isPast = cell < todayMidnight;
            const isToday = isSameDay(cell, today);
            const isSelected = selectedDates.includes(dateStr);
            const count = (windowsByDate[dateStr] || []).length;

            return (
              <button
                key={dateStr}
                disabled={isPast}
                onClick={() => toggleDate(dateStr)}
                aria-pressed={isSelected}
                className={`relative min-h-[48px] sm:min-h-[56px] rounded-lg border flex flex-col items-center justify-center transition-colors ${
                  isPast
                    ? 'bg-cream text-brown-light border-warm-border cursor-not-allowed opacity-50'
                    : isSelected
                      ? 'bg-burgundy text-white border-burgundy'
                      : isToday
                        ? 'bg-burgundy-ghost text-burgundy border-burgundy'
                        : 'bg-warm-white text-brown border-warm-border hover:border-burgundy'
                }`}
              >
                <span className="text-sm font-semibold leading-none">{cell.getDate()}</span>
                {count > 0 && (
                  <span
                    className={`absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center ${
                      isSelected ? 'bg-white text-burgundy' : 'bg-sage text-white'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-brown-light text-center mt-4">
          Click dates to toggle selection. {selectedDates.length} date
          {selectedDates.length === 1 ? '' : 's'} selected.
        </p>
        {loading && <p className="text-sm text-brown-light text-center mt-2">Loading windows…</p>}
      </div>

      {/* Publish form */}
      <div className="bg-white rounded-xl border border-warm-border shadow-sm p-5">
        <h2 className="text-xl font-serif font-bold text-burgundy mb-1">Publish availability</h2>
        <p className="text-sm text-brown-light mb-4">
          Applies to every selected date{repeatWeekly ? ' and the following weeks' : ''}.
        </p>

        {/* Selected date chips */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">
            Selected dates
          </span>
          {sortedSelectedDates.length === 0 ? (
            <p className="text-sm text-brown-light italic mt-1">
              No dates selected — use the calendar or a shortcut above.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-2">
              {sortedSelectedDates.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cream text-brown text-xs font-semibold border border-warm-border"
                >
                  {formatShortDate(d)}
                  <button
                    type="button"
                    onClick={() => toggleDate(d)}
                    aria-label={`Remove ${d}`}
                    className="text-brown-light hover:text-rose transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleAddBatch} className="space-y-4">
          {/* Time presets */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">
              Quick time presets
            </span>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
              {TIME_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="min-h-[48px] w-full sm:w-auto px-4 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:border-burgundy transition-colors"
                >
                  {p.label}
                  <span className="ml-1.5 text-xs font-normal text-brown-light">
                    {formatTime12(p.start)}–{formatTime12(p.end)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">Start</span>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="min-h-[48px] px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-base focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">End</span>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="min-h-[48px] px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-base focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
              />
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">Slot duration</span>
            <div className="flex flex-wrap gap-2">
              {SLOT_DURATIONS.map((mins) => {
                const isSelected = slotDuration === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSlotDuration(mins)}
                    aria-pressed={isSelected}
                    className={`min-h-[48px] flex-1 min-w-[64px] px-4 rounded-lg border-[1.5px] text-sm font-semibold transition-colors ${
                      isSelected
                        ? 'bg-burgundy text-white border-burgundy'
                        : 'bg-warm-white text-brown border-warm-border hover:border-burgundy'
                    }`}
                  >
                    {mins}m{mins === 30 ? ' (default)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">Buffer time</span>
            <div className="flex flex-wrap gap-2">
              {[0, 5, 10].map((mins) => {
                const isSelected = bufferMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setBufferMinutes(mins)}
                    aria-pressed={isSelected}
                    className={`min-h-[48px] flex-1 min-w-[64px] px-4 rounded-lg border-[1.5px] text-sm font-semibold transition-colors ${
                      isSelected
                        ? 'bg-burgundy text-white border-burgundy'
                        : 'bg-warm-white text-brown border-warm-border hover:border-burgundy'
                    }`}
                  >
                    {mins === 0 ? 'None' : `${mins}m`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Repeat weekly */}
          <div className="flex flex-col gap-2 rounded-lg border border-warm-border bg-cream p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={repeatWeekly}
                onChange={(e) => setRepeatWeekly(e.target.checked)}
                className="h-5 w-5 rounded border-warm-border text-burgundy focus:ring-burgundy"
              />
              <span className="text-sm font-semibold text-brown">Repeat weekly for</span>
              <input
                type="number"
                min={2}
                max={52}
                value={repeatWeeks}
                onChange={(e) => setRepeatWeeks(e.target.value)}
                disabled={!repeatWeekly}
                className="w-20 min-h-[40px] px-2 py-1 border-[1.5px] border-warm-border rounded-md bg-white text-brown text-sm text-center disabled:opacity-40 focus:border-burgundy outline-none"
              />
              <span className="text-sm text-brown">weeks</span>
            </label>
            <p className="text-xs text-brown-light">
              {repeatWeekly
                ? `Each selected date also publishes the same window for the following ${Math.max(1, Number(repeatWeeks) - 1)} week(s).`
                : 'When checked, each selected date also repeats on the following weeks.'}
            </p>
          </div>

          {formError && (
            <p className="text-sm rounded-lg px-3 py-2 bg-rose-light text-rose">{formError}</p>
          )}

          <button
            type="submit"
            disabled={saving || sortedSelectedDates.length === 0}
            className="hidden sm:block w-full min-h-[48px] rounded-lg bg-burgundy text-white font-semibold hover:bg-burgundy-light disabled:opacity-40 transition-colors"
          >
            {publishLabel}
          </button>

          {/* Sticky bottom action bar — always under the thumb on mobile */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-warm-border z-20">
            <button
              type="submit"
              disabled={saving || sortedSelectedDates.length === 0}
              className="w-full min-h-[52px] rounded-lg bg-burgundy text-white text-base font-semibold hover:bg-burgundy-light disabled:opacity-40 transition-colors"
            >
              {publishLabel}
            </button>
          </div>
        </form>
      </div>

      {/* Existing windows for selected dates */}
      {sortedSelectedDates.length > 0 && (
        <div className="bg-white rounded-xl border border-warm-border shadow-sm p-5">
          <h2 className="text-xl font-serif font-bold text-burgundy mb-1">Existing windows</h2>
          <p className="text-sm text-brown-light mb-3">On your selected dates.</p>
          {selectedWindows.length === 0 ? (
            <p className="text-sm text-brown-light italic">No windows yet on these dates.</p>
          ) : (
            <ul className="space-y-2">
              {selectedWindows.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-warm-border bg-cream"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-brown">
                      {formatFullDate(w.date)}
                    </span>
                    <span className="text-sm text-brown">
                      {formatTime12(w.start_time)} – {formatTime12(w.end_time)}
                      <span className="text-brown-light"> ({(w.slot_duration_minutes || 30)}m slots{w.buffer_minutes ? `, ${w.buffer_minutes}m buffer` : ''})</span>
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(w.id)}
                    aria-label={`Delete ${formatTime12(w.start_time)} window`}
                    className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-md text-rose hover:bg-rose-light transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
