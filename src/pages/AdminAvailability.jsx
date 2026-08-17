import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authedFetch } from '../lib/api';
import SectionLabel from '../components/SectionLabel';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function WindowPanel({ selectedDate, windows, loading, error, onClose, onAdd, onDelete }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slotDuration, setSlotDuration] = useState(30);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStartTime('');
    setEndTime('');
    setSlotDuration(30);
    setFormError('');
  }, [selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!startTime || !endTime) {
      setFormError('Start and end times are required.');
      return;
    }
    if (endTime <= startTime) {
      setFormError('End time must be after start time.');
      return;
    }

    setSaving(true);
    try {
      await onAdd({
        window_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        slot_duration_minutes: slotDuration,
      });
      setStartTime('');
      setEndTime('');
      setSlotDuration(30);
    } catch (err) {
      setFormError(err.message || 'Failed to add window.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 lg:bg-transparent lg:pointer-events-none"
      onClick={onClose}
      aria-label="Window panel overlay"
    >
      <div
        className="lg:pointer-events-auto absolute right-0 top-0 bottom-0 w-full max-w-md lg:w-96 bg-white shadow-xl border-l border-warm-border overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-border">
          <div>
            <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-0.5">
              Availability windows
            </p>
            <h2 className="text-lg font-serif font-bold text-burgundy">
              {formatFullDate(selectedDate)}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-warm-border text-brown-light hover:bg-cream hover:text-brown transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Existing windows */}
          <div>
            <h3 className="text-sm font-semibold text-brown mb-2">Windows for this date</h3>
            {loading ? (
              <p className="text-sm text-brown-light">Loading…</p>
            ) : error ? (
              <p className="text-sm text-rose">{error}</p>
            ) : windows.length === 0 ? (
              <p className="text-sm text-brown-light italic">No windows yet for this date.</p>
            ) : (
              <ul className="space-y-2">
                {windows.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-warm-border bg-cream"
                  >
                    <span className="text-sm font-medium text-brown">
                      {formatTime12(w.start_time)} – {formatTime12(w.end_time)}
                      <span className="text-brown-light"> ({(w.slot_duration_minutes || 30)}m slots)</span>
                    </span>
                    <button
                      onClick={() => onDelete(w.id)}
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

          {/* Add window form */}
          <form onSubmit={handleSubmit} className="space-y-3 border-t border-warm-border pt-4">
            <h3 className="text-sm font-semibold text-brown">Add a window</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">Start</span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-sm focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">End</span>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-sm focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
                />
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">Slot duration</span>
              <div className="flex flex-wrap gap-2">
                {[15, 20, 30, 45, 60].map((mins) => {
                  const isSelected = slotDuration === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSlotDuration(mins)}
                      aria-pressed={isSelected}
                      className={`min-h-[44px] px-4 rounded-lg border-[1.5px] text-sm font-semibold transition-colors ${
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

            {formError && (
              <p className="text-sm rounded-lg px-3 py-2 bg-rose-light text-rose">{formError}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-[44px] rounded-lg bg-burgundy text-white font-semibold hover:bg-burgundy-light disabled:opacity-40 transition-colors"
            >
              {saving ? 'Adding…' : 'Add window'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
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
  const [selectedDate, setSelectedDate] = useState(null);

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

  const prevMonth = () =>
    setDisplayedMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () =>
    setDisplayedMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    setDisplayedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const selectedWindows = selectedDate
    ? (windowsByDate[selectedDate] || []).slice().sort((a, b) =>
        String(a.start_time).localeCompare(String(b.start_time))
      )
    : [];

  const handleAdd = async (payload) => {
    const res = await authedFetch(`/api/availability/${leaderId}/windows`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to add window');
    }
    await loadWindows();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <SectionLabel>Admin · Availability</SectionLabel>
        <h1 className="text-3xl font-serif font-bold text-burgundy mt-1">Availability</h1>
        <p className="text-brown-light mt-1 max-w-xl">
          Publish windows when you&apos;re free to meet with assigned companionships.
        </p>
      </div>

      {error && (
        <div className="bg-white rounded-xl border border-warm-border p-5">
          <p className="text-sm text-rose">{error}</p>
          <button
            onClick={loadWindows}
            className="mt-3 min-h-[44px] inline-flex items-center gap-2 px-5 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:bg-cream transition-colors"
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
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-warm-border text-brown hover:bg-cream transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={goToday}
              className="min-h-[44px] px-4 rounded-lg border-[1.5px] border-warm-border text-brown text-sm font-semibold hover:bg-cream transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-warm-border text-brown hover:bg-cream transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
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
              return <div key={`blank-${i}`} className="min-h-[56px]" />;
            }
            const dateStr = toISODate(cell);
            const isPast = cell < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isToday = isSameDay(cell, today);
            const isSelected = selectedDate === dateStr;
            const count = (windowsByDate[dateStr] || []).length;

            return (
              <button
                key={dateStr}
                disabled={isPast}
                onClick={() => setSelectedDate(dateStr)}
                className={`relative min-h-[56px] rounded-lg border flex flex-col items-center justify-center transition-colors ${
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

        {loading && <p className="text-sm text-brown-light text-center mt-4">Loading windows…</p>}
      </div>

      {selectedDate && (
        <WindowPanel
          selectedDate={selectedDate}
          windows={selectedWindows}
          loading={loading}
          error={error}
          onClose={() => setSelectedDate(null)}
          onAdd={handleAdd}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
