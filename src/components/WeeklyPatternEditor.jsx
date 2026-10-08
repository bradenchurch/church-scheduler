import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  UI_SLOT_LENGTHS,
  WEEKDAY_CHIP,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  addDaysISO,
  classify,
  collapseMerges,
  endOfMonth,
  endOfQuarter,
  expandPattern,
  formatTime12,
  formatWeekdayMonthDay,
  groupRowsByWeek,
  patternProblems,
  todayInTimeZone,
  visitCount,
  weekdayIndex,
} from '../../shared/availability.js';

const TIME_PRESETS = [
  { label: '1–3 PM', start: '13:00', end: '15:00' },
  { label: '6–8 PM', start: '18:00', end: '20:00' },
  { label: '7–9 PM', start: '19:00', end: '21:00' },
];

function newRange(partial = {}) {
  return {
    id: crypto.randomUUID(),
    weekdays: partial.weekdays || [],
    start: partial.start || '19:00',
    end: partial.end || '21:00',
  };
}

function Chip({ pressed, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-[44px] min-w-[44px] px-3 rounded-lg border-[1.5px] text-sm font-semibold transition-colors ${
        pressed
          ? 'bg-burgundy text-white border-burgundy'
          : 'bg-warm-white text-brown border-warm-border hover:border-burgundy'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default function WeeklyPatternEditor({
  mode,
  existing,
  windowsReady,
  initial,
  onClose,
  onSave,
  triggerRef,
}) {
  const today = todayInTimeZone();
  const titleId = useId();
  const panelRef = useRef(null);
  const [ranges, setRanges] = useState(() => [
    newRange(initial || {}),
  ]);
  const [slot, setSlot] = useState(initial?.slot || 30);
  const [buffer, setBuffer] = useState(initial?.buffer || 0);
  const [more, setMore] = useState(false);
  const [from, setFrom] = useState(initial?.from || today);
  const [to, setTo] = useState(initial?.to || addDaysISO(today, 56));
  const [singleDate, setSingleDate] = useState(initial?.from || today);
  const [excluded, setExcluded] = useState([]);
  const [openWeeks, setOpenWeeks] = useState({});
  const [onOverlap, setOnOverlap] = useState('skip');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const inFlight = useRef(false);

  const problems = mode === 'single'
    ? patternProblems({
      ranges: [{ weekdays: [0], start: ranges[0].start, end: ranges[0].end }],
      slot,
      buffer,
      from: singleDate,
      to: singleDate,
    }).filter((p) => p !== 'Pick at least one day.' && p !== 'Each row needs at least one day.')
    : patternProblems({ ranges, slot, buffer, from, to });

  const allRows = useMemo(() => {
    if (problems.length) return [];
    if (mode === 'single') {
      return expandPattern({
        ranges: [{ weekdays: [weekdayIndex(singleDate)], start: ranges[0].start, end: ranges[0].end }],
        slot,
        buffer,
        from: singleDate,
        to: singleDate,
      });
    }
    return expandPattern({ ranges, slot, buffer, from, to });
  }, [problems.length, mode, ranges, slot, buffer, from, to, singleDate]);

  const expanded = useMemo(
    () => allRows.filter((row) => !excluded.includes(row.window_date)),
    [allRows, excluded],
  );
  const patternKey = expanded.map((row) => `${row.window_date}|${row.start_time}|${row.end_time}`).join(',');
  const [seriesId, setSeriesId] = useState(() => crypto.randomUUID());
  useEffect(() => {
    setSeriesId(crypto.randomUUID());
  }, [patternKey, onOverlap]);

  const plan = useMemo(() => classify(expanded, existing || []), [expanded, existing]);

  const weeks = useMemo(() => groupRowsByWeek(allRows), [allRows]);
  const createCount = plan.create.length;
  const exactCount = plan.exact.length;
  const overlapCount = plan.overlap.length;
  const internal = plan.internalOverlap[0];
  const formError = internal
    ? `${WEEKDAY_LONG[weekdayIndex(internal[0].window_date)]} times overlap. Fix before saving.`
    : problems[0] || '';

  const mergeBlocked = plan.overlap.some((item) => {
    const booked = item.existing.some((row) => Number(row.booked_count) > 0);
    const mismatch = item.existing.some(
      (row) => Number(row.slot_duration_minutes) !== Number(slot) || Number(row.buffer_minutes || 0) !== Number(buffer),
    );
    return booked || mismatch;
  });
  const replaceBlocked = plan.overlap.some((item) => item.existing.some((row) => Number(row.booked_count) > 0));
  const bookedOverlap = plan.overlap.reduce(
    (sum, item) => sum + item.existing.reduce((n, row) => n + Number(row.booked_count || 0), 0),
    0,
  );

  const summary = !windowsReady
    ? 'Loading your windows...'
    : formError
      ? formError
      : createCount === 0
        ? `Creates 0 windows. ${exactCount} already exist and will be skipped.`
        : `Creates ${createCount} window${createCount === 1 ? '' : 's'}.${exactCount ? ` ${exactCount} already exist and will be skipped.` : ''}`;

  useEffect(() => {
    const node = panelRef.current;
    if (!node) return undefined;
    const previous = document.activeElement;
    const trigger = triggerRef?.current || null;
    const focusable = () => [...node.querySelectorAll('button, [href], input, select, textarea')].filter((el) => !el.disabled);
    focusable()[0]?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (trigger) trigger.focus();
      else if (typeof previous?.focus === 'function') previous.focus();
    };
  }, [onClose, triggerRef]);

  const toggleDay = (rangeId, day) => {
    setRanges((prev) => prev.map((range) => {
      if (range.id !== rangeId) return range;
      const has = range.weekdays.includes(day);
      return { ...range, weekdays: has ? range.weekdays.filter((d) => d !== day) : [...range.weekdays, day].sort() };
    }));
  };

  const setDays = (rangeId, days) => {
    setRanges((prev) => prev.map((range) => (range.id === rangeId ? { ...range, weekdays: days } : range)));
  };

  const applyTime = (rangeId, start, end) => {
    setRanges((prev) => prev.map((range) => (range.id === rangeId ? { ...range, start, end } : range)));
  };

  const toggleDate = (date) => {
    setExcluded((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]));
  };

  const actionable = createCount + (
    onOverlap === 'merge' ? collapseMerges(plan.overlap).length
      : onOverlap === 'skip' ? 0
        : overlapCount
  );
  const saveDisabledReason = !windowsReady
    ? 'Loading your windows...'
    : formError
      ? formError
      : actionable === 0
        ? 'Nothing new to save'
        : '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (inFlight.current || saving || saveDisabledReason) return;
    inFlight.current = true;
    setSaving(true);
    setSaveError('');
    try {
      await onSave({
        series_id: seriesId,
        on_overlap: overlapCount ? onOverlap : 'skip',
        windows: expanded,
      });
    } catch (err) {
      setSaveError(err?.publicMessage || "Couldn't save. Nothing was added. Check your connection and try again.");
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  const visits = visitCount(ranges[0]?.start, ranges[0]?.end, slot, buffer);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-30 overflow-y-auto bg-cream p-4 pb-28 lg:static lg:inset-auto lg:z-auto lg:overflow-visible lg:bg-white lg:rounded-xl lg:border lg:border-warm-border lg:shadow-sm lg:p-5 lg:pb-5"
    >
      <form onSubmit={handleSubmit} aria-busy={saving ? 'true' : 'false'} className="max-w-xl mx-auto lg:max-w-none space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-xl font-serif font-bold text-burgundy">
              {mode === 'single' ? 'Add a single date' : 'Set weekly pattern'}
            </h2>
            <p className="text-sm text-brown-light mt-1">All times Mountain Time.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg border border-warm-border text-brown font-semibold"
          >
            Close
          </button>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wider text-brown-light">Times</legend>
          {ranges.slice(0, mode === 'single' ? 1 : ranges.length).map((range, index) => (
            <div key={range.id} className="rounded-lg border border-warm-border bg-white p-3 space-y-3">
              {mode !== 'single' && (
                <>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Days for row ${index + 1}`}>
                    {WEEKDAY_CHIP.map((label, day) => (
                      <Chip key={label} pressed={range.weekdays.includes(day)} onClick={() => toggleDay(range.id, day)}>
                        {label}
                      </Chip>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setDays(range.id, [1, 2, 3, 4, 5])} className="min-h-[44px] px-3 rounded-lg border border-warm-border text-sm font-semibold text-brown">Weeknights</button>
                    <button type="button" onClick={() => setDays(range.id, [0])} className="min-h-[44px] px-3 rounded-lg border border-warm-border text-sm font-semibold text-brown">Sundays</button>
                    {ranges.length > 1 && (
                      <button type="button" onClick={() => setRanges((prev) => prev.filter((item) => item.id !== range.id))} className="min-h-[44px] px-3 rounded-lg text-sm font-semibold text-rose">Remove row</button>
                    )}
                  </div>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                {TIME_PRESETS.map((preset) => (
                  <Chip
                    key={preset.label}
                    pressed={range.start === preset.start && range.end === preset.end}
                    onClick={() => applyTime(range.id, preset.start, preset.end)}
                  >
                    {preset.label}
                  </Chip>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm font-semibold text-brown">
                  Start
                  <input type="time" step={900} value={range.start} onChange={(e) => applyTime(range.id, e.target.value, range.end)} className="min-h-[44px] px-3 rounded-md border-[1.5px] border-warm-border bg-warm-white" />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-brown">
                  End
                  <input type="time" step={900} value={range.end} onChange={(e) => applyTime(range.id, range.start, e.target.value)} className="min-h-[44px] px-3 rounded-md border-[1.5px] border-warm-border bg-warm-white" />
                </label>
              </div>
            </div>
          ))}
          {mode !== 'single' && (
            <button type="button" onClick={() => setRanges((prev) => [...prev, newRange()])} className="min-h-[44px] text-sm font-semibold text-burgundy">
              + Add another day and time
            </button>
          )}
        </fieldset>

        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wider text-brown-light mb-2">Slot length</legend>
          <div className="flex flex-wrap gap-2">
            {UI_SLOT_LENGTHS.map((mins) => (
              <Chip key={mins} pressed={slot === mins} onClick={() => setSlot(mins)} className="flex-1">
                {mins}m{mins === 30 ? ' (default)' : ''}
              </Chip>
            ))}
          </div>
          <p className="text-xs text-brown-light mt-2">
            {formatTime12(ranges[0].start)}–{formatTime12(ranges[0].end)} at {slot} min = {visits} visit{visits === 1 ? '' : 's'}
          </p>
          <button type="button" onClick={() => setMore((v) => !v)} className="min-h-[44px] mt-1 text-sm font-semibold text-brown" aria-expanded={more}>
            More options
          </button>
          {more && (
            <div className="flex flex-wrap gap-2 mt-1" role="group" aria-label="Buffer time">
              {[0, 5, 10].map((mins) => (
                <Chip key={mins} pressed={buffer === mins} onClick={() => setBuffer(mins)}>
                  {mins === 0 ? 'No buffer' : `${mins}m buffer`}
                </Chip>
              ))}
            </div>
          )}
        </fieldset>

        {mode === 'single' ? (
          <label className="flex flex-col gap-1 text-sm font-semibold text-brown">
            Date
            <input type="date" min={today} value={singleDate} onChange={(e) => setSingleDate(e.target.value)} className="min-h-[44px] px-3 rounded-md border-[1.5px] border-warm-border bg-white" />
          </label>
        ) : (
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-brown-light">Dates</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-semibold text-brown">
                From
                <input type="date" min={today} value={from} onChange={(e) => setFrom(e.target.value)} className="min-h-[44px] px-3 rounded-md border-[1.5px] border-warm-border bg-white" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-brown">
                To
                <input type="date" min={from || today} value={to} onChange={(e) => setTo(e.target.value)} className="min-h-[44px] px-3 rounded-md border-[1.5px] border-warm-border bg-white" />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setFrom(today); setTo(endOfMonth(today)); }} className="min-h-[44px] px-3 rounded-lg border border-warm-border text-sm font-semibold">Rest of this month</button>
              <button type="button" onClick={() => { setFrom(today); setTo(addDaysISO(today, 56)); }} className="min-h-[44px] px-3 rounded-lg border border-warm-border text-sm font-semibold">Next 8 weeks</button>
              <button type="button" onClick={() => { setFrom(today); setTo(endOfQuarter(today)); }} className="min-h-[44px] px-3 rounded-lg border border-warm-border text-sm font-semibold">Through end of quarter</button>
            </div>
          </fieldset>
        )}

        <div aria-live="polite" className="rounded-lg bg-cream border border-warm-border p-3 space-y-2">
          <p className="text-sm font-semibold text-brown">{summary}</p>
          {overlapCount > 0 && !formError && (
            <div className="space-y-2">
              {plan.overlap.slice(0, 4).map((item) => (
                <p key={`${item.row.window_date}-${item.row.start_time}`} className="text-sm text-rose">
                  {formatWeekdayMonthDay(item.row.window_date)}: overlaps your {formatTime12(item.existing[0].start_time)}–{formatTime12(item.existing[0].end_time)} window.
                </p>
              ))}
              <fieldset className="space-y-1">
                <legend className="text-sm font-semibold text-brown">Overlapping dates</legend>
                <label className="flex items-center gap-2 min-h-[44px] text-sm"><input type="radio" name="overlap" checked={onOverlap === 'skip'} onChange={() => setOnOverlap('skip')} /> Skip these dates</label>
                <label className={`flex items-center gap-2 min-h-[44px] text-sm ${mergeBlocked ? 'text-brown-light' : ''}`}>
                  <input type="radio" name="overlap" disabled={mergeBlocked} checked={onOverlap === 'merge'} onChange={() => setOnOverlap('merge')} />
                  Merge into one window
                </label>
                <label className={`flex items-center gap-2 min-h-[44px] text-sm ${replaceBlocked ? 'text-brown-light' : ''}`}>
                  <input type="radio" name="overlap" disabled={replaceBlocked} checked={onOverlap === 'replace'} onChange={() => setOnOverlap('replace')} />
                  Replace the old window
                </label>
                {bookedOverlap > 0 && (
                  <p className="text-sm text-rose">{bookedOverlap} visit{bookedOverlap === 1 ? ' is' : 's are'} booked in that window.</p>
                )}
              </fieldset>
            </div>
          )}
          {weeks.map((week) => {
            const activeRows = week.rows.filter((row) => !excluded.includes(row.window_date));
            const byTime = new Map();
            for (const row of activeRows) {
              const key = `${row.start_time}|${row.end_time}`;
              if (!byTime.has(key)) byTime.set(key, []);
              byTime.get(key).push(row);
            }
            return (
              <div key={week.week}>
                <button
                  type="button"
                  className="min-h-[44px] text-left text-sm font-semibold text-brown"
                  aria-expanded={!!openWeeks[week.week]}
                  onClick={() => setOpenWeeks((prev) => ({ ...prev, [week.week]: !prev[week.week] }))}
                >
                  Week of {week.label}
                </button>
                {[...byTime.entries()].map(([key, rows]) => {
                  const days = rows.map((row) => WEEKDAY_SHORT[weekdayIndex(row.window_date)]).join(', ');
                  const count = visitCount(rows[0].start_time, rows[0].end_time, slot, buffer);
                  return (
                    <p key={key} className="text-sm text-brown-light pl-1">
                      {days}, {formatTime12(rows[0].start_time)}–{formatTime12(rows[0].end_time)} ({count} visit{count === 1 ? '' : 's'} each)
                    </p>
                  );
                })}
                {openWeeks[week.week] && (
                  <ul className="mt-1 space-y-1">
                    {week.rows.map((row) => {
                      const checked = !excluded.includes(row.window_date);
                      return (
                        <li key={`${row.window_date}-${row.start_time}`}>
                          <label className="flex items-center gap-2 min-h-[44px] text-sm">
                            <input type="checkbox" checked={checked} onChange={() => toggleDate(row.window_date)} />
                            {formatWeekdayMonthDay(row.window_date)}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {saveError && <p className="text-sm rounded-lg px-3 py-2 bg-rose-light text-rose" role="alert">{saveError}</p>}

        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-warm-border bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <button
            type="submit"
            disabled={Boolean(saveDisabledReason) || saving}
            className="w-full min-h-[52px] rounded-lg bg-burgundy text-white font-semibold disabled:opacity-40"
          >
            {saving
              ? `Saving ${actionable} window${actionable === 1 ? '' : 's'}...`
              : saveDisabledReason || `Save ${actionable} window${actionable === 1 ? '' : 's'}`}
          </button>
        </div>
      </form>
    </div>
  );
}
