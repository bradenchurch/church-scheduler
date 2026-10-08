import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authedFetch } from '../lib/api';
import SectionLabel from '../components/SectionLabel';
import SubscribePanel from '../components/SubscribePanel';
import WeeklyPatternEditor from '../components/WeeklyPatternEditor';
import {
  UI_SLOT_LENGTHS,
  WEEKDAY_SHORT,
  addDaysISO,
  formatLongDate,
  formatMonthDay,
  formatTime12,
  formatWeekdayMonthDay,
  groupRowsByWeek,
  legacyPatternFromSlots,
  mondayOf,
  todayInTimeZone,
  visitCount,
} from '../../shared/availability.js';

const DISMISS_KEY = 'eq-confirmations-banner-until';
const FEED_COPY = "Add your schedule to your phone's calendar. This is separate from confirmation emails.";

function bannerDismissed() {
  const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return until > Date.now();
}

function Toast({ toast, onUndo, onDismiss }) {
  const ref = useRef(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    ref.current?.focus();
    if (toast.persist) return undefined;
    const timer = setTimeout(() => dismissRef.current(), toast.undo ? 8000 : 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-xl border border-warm-border bg-white p-4 shadow-lg outline-none"
    >
      <p className="text-sm font-semibold text-brown">{toast.text}</p>
      <div className="mt-2 flex gap-2">
        {toast.undo && (
          <button type="button" onClick={onUndo} className="min-h-[44px] px-4 rounded-lg bg-burgundy text-white text-sm font-semibold">
            Undo
          </button>
        )}
        <button type="button" onClick={onDismiss} className="min-h-[44px] px-4 rounded-lg border border-warm-border text-sm font-semibold text-brown">
          Dismiss
        </button>
      </div>
    </div>
  );
}

function WeekSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((n) => (
        <div key={n} className="h-24 rounded-xl border border-warm-border bg-white animate-pulse" />
      ))}
    </div>
  );
}

export default function AdminAvailability({ fixture = null }) {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const leaderId = fixture?.leaderId || auth.leaderId;
  const role = fixture?.role || auth.role;
  const isAdmin = role === 'admin';
  const [targetId, setTargetId] = useState(fixture?.leaderId || null);
  const effectiveId = targetId || leaderId;

  const [windows, setWindows] = useState(fixture?.windows || []);
  const [loading, setLoading] = useState(fixture ? !!fixture.loading : true);
  const [loadError, setLoadError] = useState(fixture?.loadError || '');
  const [googleConnected, setGoogleConnected] = useState(fixture ? fixture.googleConnected !== false : true);
  const [bannerHidden, setBannerHidden] = useState(() => (typeof localStorage === 'undefined' ? false : bannerDismissed()));
  const [editor, setEditor] = useState(fixture?.editor || null);
  const [prefill, setPrefill] = useState(fixture?.prefill || null);
  const [toast, setToast] = useState(fixture?.toast || null);
  const [freshIds, setFreshIds] = useState(() => new Set(fixture?.freshIds || []));
  const [showPast, setShowPast] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState('');
  const [rowNote, setRowNote] = useState('');
  const [leaderUuid, setLeaderUuid] = useState(fixture?.leaderUuid || null);
  const [legacy, setLegacy] = useState(fixture?.legacy || []);
  const [menuFor, setMenuFor] = useState(null);
  const patternButtonRef = useRef(null);
  const closeEditor = useCallback(() => setEditor(null), []);
  const today = todayInTimeZone();

  const loadWindows = useCallback(async () => {
    if (fixture) return;
    if (!effectiveId) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await authedFetch(`/api/availability/${effectiveId}/windows`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('load');
      setWindows(data.windows || []);
    } catch {
      setLoadError("Couldn't load your availability.");
      setWindows([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveId, fixture]);

  useEffect(() => {
    if (!fixture) loadWindows();
  }, [loadWindows, fixture]);

  useEffect(() => {
    if (fixture || !leaderId) return undefined;
    let active = true;
    authedFetch('/api/me/leader')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (active) setLeaderUuid(data?.uuid || null);
      })
      .catch(() => {});
    authedFetch('/api/auth/google/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setGoogleConnected(!!data.connected);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [leaderId, fixture]);

  useEffect(() => {
    if (!isAdmin || fixture) return undefined;
    let active = true;
    authedFetch('/api/admin/legacy-slots')
      .then((res) => (res.ok ? res.json() : { leaders: [] }))
      .then((data) => {
        if (active) setLegacy(data.leaders || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAdmin, fixture]);

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setToast({ text: 'Google account connected. Confirmation emails can be sent.', undo: false });
      setGoogleConnected(true);
      const next = new URLSearchParams(searchParams);
      next.delete('connected');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!freshIds.size) return undefined;
    const timer = setTimeout(() => setFreshIds(new Set()), 8000);
    return () => clearTimeout(timer);
  }, [freshIds]);

  const upcoming = useMemo(
    () => windows.filter((row) => String(row.window_date).slice(0, 10) >= today),
    [windows, today],
  );
  const visible = showPast ? windows : upcoming;
  const weeks = useMemo(() => groupRowsByWeek(visible.map((row) => ({
    ...row,
    window_date: String(row.window_date).slice(0, 10),
  }))), [visible]);

  const feedUrl = leaderUuid ? `webcal://${window.location.host}/ical/leader/${leaderUuid}.ics` : '';
  const through = upcoming.length
    ? formatMonthDay([...upcoming].sort((a, b) => String(a.window_date).localeCompare(String(b.window_date))).at(-1).window_date.slice(0, 10))
    : '';

  const dismissBanner = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 86400000));
    setBannerHidden(true);
  };

  const connectGoogle = async () => {
    const res = await authedFetch(`/api/auth/google/start?return_to=${encodeURIComponent('/availability')}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) window.location.href = data.url;
    else setToast({ text: "Couldn't start Google sign-in. Try again from Settings.", undo: false });
  };

  const applyCreated = (created) => {
    setWindows((prev) => {
      const ids = new Set(created.map((row) => row.id));
      return [...prev.filter((row) => !ids.has(row.id)), ...created];
    });
  };

  const handleSave = async (payload) => {
    let data;
    if (fixture?.onSave) {
      data = await fixture.onSave(payload);
    } else {
      const res = await authedFetch(`/api/availability/${effectiveId}/windows/batch`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        await loadWindows();
        const err = new Error('conflict');
        err.publicMessage = 'Your windows changed. Preview updated.';
        throw err;
      }
      if (!res.ok) {
        const err = new Error('save');
        err.publicMessage = data.message && data.error === 'internal_overlap'
          ? data.message
          : "Couldn't save. Nothing was added. Check your connection and try again.";
        throw err;
      }
    }
    const created = data?.created || [];
    const skipped = (data?.skipped_existing || []).length;
    const overlapSkipped = (data?.conflicts || []).filter((item) => item.reason === 'skipped').length;
    const parts = [`Saved ${created.length} window${created.length === 1 ? '' : 's'}.`];
    if (skipped) parts.push(`${skipped} already existed and were skipped.`);
    if (overlapSkipped) parts.push(`${overlapSkipped} overlapping date${overlapSkipped === 1 ? '' : 's'} skipped.`);
    setToast({
      text: parts.join(' '),
      undo: created.length > 0,
      seriesId: data?.series_id,
      ids: created.map((row) => row.id).filter(Boolean),
    });
    setEditor(null);
    setPrefill(null);
    setFreshIds(new Set(created.map((row) => row.id)));
    if (fixture) applyCreated(created);
    else await loadWindows();
    const first = created[0]?.window_date;
    if (first) {
      requestAnimationFrame(() => {
        document.getElementById(`week-${mondayOf(String(first).slice(0, 10))}`)?.scrollIntoView({ block: 'start' });
      });
    }
  };

  const undoToast = async () => {
    if (!toast) return;
    if (fixture) {
      if (toast.kind === 'delete') {
        setWindows((prev) => [...prev, ...(toast.rows || [])]);
      } else if (toast.ids?.length) {
        const drop = new Set(toast.ids);
        setWindows((prev) => prev.filter((row) => !drop.has(row.id)));
        setFreshIds(new Set());
      }
      setToast(null);
      return;
    }
    if (toast.kind === 'delete') {
      await authedFetch(`/api/availability/${effectiveId}/windows/batch`, {
        method: 'POST',
        body: JSON.stringify({ undo: true, windows: toast.rows }),
      });
    } else if (toast.seriesId || toast.ids?.length) {
      const params = new URLSearchParams();
      if (toast.seriesId) params.set('series_id', toast.seriesId);
      if (toast.ids?.length) params.set('ids', toast.ids.join(','));
      await authedFetch(`/api/availability/${effectiveId}/windows?${params.toString()}`, { method: 'DELETE' });
    }
    setToast(null);
    await loadWindows();
  };

  const removeRows = async (rows, label) => {
    const ids = rows.map((row) => row.id);
    const params = new URLSearchParams({ ids: ids.join(',') });
    const res = await authedFetch(`/api/availability/${effectiveId}/windows?${params.toString()}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRowNote("Couldn't delete that. Nothing was changed.");
      return;
    }
    const kept = data.kept || [];
    setToast({
      text: kept.length
        ? `Deleted ${data.deleted?.length || 0}. ${kept.length} booked window${kept.length === 1 ? '' : 's'} kept.`
        : label,
      undo: (data.deleted || []).length > 0,
      kind: 'delete',
      rows: data.deleted || [],
    });
    setSelecting(false);
    setSelectedIds([]);
    setConfirmDelete(null);
    await loadWindows();
  };

  const deleteOne = async (row) => {
    if (Number(row.booked_count) > 0) {
      setRowNote(`${row.booked_count} visit${row.booked_count === 1 ? ' is' : 's are'} booked in that window. Cancel the visit before deleting this window.`);
      return;
    }
    if (fixture) {
      setWindows((prev) => prev.filter((item) => item.id !== row.id));
      setToast({ text: 'Deleted.', undo: true, kind: 'delete', rows: [row] });
      return;
    }
    const res = await authedFetch(`/api/availability/windows/${row.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409) {
      setRowNote(data.message || 'Cancel the visit before deleting this window.');
      return;
    }
    if (!res.ok) {
      setRowNote("Couldn't delete that. Nothing was changed.");
      return;
    }
    setToast({
      text: 'Deleted.',
      undo: true,
      kind: 'delete',
      rows: data.deleted || [row],
    });
    await loadWindows();
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setEditError('');
    const res = await authedFetch(`/api/availability/windows/${editing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        start_time: editing.start_time,
        end_time: editing.end_time,
        slot_duration_minutes: Number(editing.slot_duration_minutes),
        buffer_minutes: Number(editing.buffer_minutes || 0),
        window_date: String(editing.window_date).slice(0, 10),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEditError(data.message || "Couldn't save that change.");
      if (res.status === 409) await loadWindows();
      return;
    }
    setEditing(null);
    setToast({ text: 'Saved the change.', undo: false });
    await loadWindows();
  };

  const hideLegacy = async (leader) => {
    await authedFetch('/api/admin/legacy-slots/hide', {
      method: 'POST',
      body: JSON.stringify({ leader_id: leader.leader_id, hidden: !leader.hidden }),
    });
    setLegacy((prev) => prev.map((item) => (item.leader_id === leader.leader_id ? { ...item, hidden: !item.hidden } : item)));
  };

  const convertLegacy = (leader) => {
    const pattern = legacyPatternFromSlots(leader.slots);
    if (!pattern) return;
    setTargetId(leader.leader_id);
    setPrefill({ ...pattern, from: today, to: addDaysISO(today, 56) });
    setEditor('pattern');
  };

  const monthCells = useMemo(() => {
    const [y, m] = today.split('-').map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const startPad = first.getUTCDay();
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells = Array(startPad).fill(null);
    for (let day = 1; day <= days; day += 1) cells.push(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    return cells;
  }, [today]);

  const countsByDate = useMemo(() => {
    const map = {};
    for (const row of windows) {
      const date = String(row.window_date).slice(0, 10);
      map[date] = (map[date] || 0) + 1;
    }
    return map;
  }, [windows]);

  return (
    <div className="lg:grid lg:grid-cols-5 lg:gap-6 lg:items-start">
      <div className={`space-y-5 min-w-0 ${editor ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
        <div>
          <SectionLabel>Your availability</SectionLabel>
          <h1 className="text-3xl font-serif font-bold text-burgundy mt-1">Your availability</h1>
          <p className="text-brown-light mt-1 max-w-xl">
            {upcoming.length
              ? `You have ${upcoming.length} upcoming window${upcoming.length === 1 ? '' : 's'} through ${through}.`
              : 'Set a weekly pattern once and elders can start booking.'}
          </p>
        </div>

        {!googleConnected && !bannerHidden && (
          <div className="rounded-xl border border-gold/40 bg-gold-light p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif font-bold text-brown">Confirmations are off</h2>
              <button type="button" onClick={dismissBanner} className="min-h-[44px] min-w-[44px] text-sm font-semibold text-brown">Dismiss</button>
            </div>
            <p className="text-sm text-brown mt-1">
              Elders who book with you won't get a calendar invite or confirmation email until you connect your Google account. Your calendar feed works either way.
            </p>
            <button type="button" onClick={connectGoogle} className="mt-3 min-h-[44px] px-4 rounded-lg bg-burgundy text-white text-sm font-semibold">
              Connect Google
            </button>
          </div>
        )}

        {isAdmin && legacy.length > 0 && (
          <div className="rounded-xl border border-warm-border bg-white p-4 space-y-3">
            <h2 className="font-serif font-bold text-burgundy">Older weekly slots</h2>
            <p className="text-sm text-brown-light">These are still offered to members until you convert or hide them. Nothing is deleted automatically.</p>
            {legacy.map((leader) => (
              <div key={leader.leader_id} className="rounded-lg border border-warm-border p-3">
                <p className="font-semibold text-brown">{leader.name}: {leader.slots.length} weekly slot{leader.slots.length === 1 ? '' : 's'}{leader.hidden ? ' (hidden from booking)' : ''}</p>
                <p className="text-sm text-brown-light mt-1">
                  {leader.slots.map((slot) => `${WEEKDAY_SHORT[slot.day_of_week]} ${formatTime12(slot.start_time)}`).join(', ')}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button type="button" onClick={() => convertLegacy(leader)} className="min-h-[44px] px-3 rounded-lg bg-burgundy text-white text-sm font-semibold">Convert to dated windows</button>
                  <button type="button" onClick={() => hideLegacy(leader)} className="min-h-[44px] px-3 rounded-lg border border-warm-border text-sm font-semibold">
                    {leader.hidden ? 'Show in booking' : 'Hide from booking'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            ref={patternButtonRef}
            type="button"
            onClick={() => { setPrefill(null); setEditor('pattern'); }}
            className="min-h-[44px] px-4 rounded-lg bg-burgundy text-white font-semibold"
          >
            Set weekly pattern
          </button>
          <button type="button" onClick={() => { setPrefill(null); setEditor('single'); }} className="min-h-[44px] px-4 rounded-lg border border-burgundy text-burgundy font-semibold">
            Add a single date
          </button>
          <button type="button" onClick={() => setShowPast((v) => !v)} aria-pressed={showPast} className="min-h-[44px] px-4 rounded-lg border border-warm-border font-semibold text-brown">
            {showPast ? 'Hide past' : 'Show past'}
          </button>
          <button type="button" onClick={() => setShowCalendar((v) => !v)} aria-pressed={showCalendar} className="min-h-[44px] px-4 rounded-lg border border-warm-border font-semibold text-brown">
            Calendar
          </button>
        </div>

        {loadError && (
          <div className="rounded-xl border border-warm-border bg-white p-5">
            <p className="text-sm text-rose">{loadError}</p>
            <button type="button" onClick={loadWindows} className="mt-3 min-h-[44px] px-4 rounded-lg border border-warm-border font-semibold">Retry</button>
          </div>
        )}

        {loading && <WeekSkeleton />}

        {!loading && !loadError && upcoming.length === 0 && !showPast && (
          <div className="rounded-xl border border-warm-border bg-white p-6">
            <h2 className="text-xl font-serif font-bold text-burgundy">No availability yet</h2>
            <p className="text-sm text-brown-light mt-2">Set a weekly pattern once and elders can start booking. Most leaders do this once a quarter.</p>
          </div>
        )}

        {!loading && weeks.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelecting((v) => !v)} aria-pressed={selecting} className="min-h-[44px] px-3 rounded-lg border border-warm-border text-sm font-semibold">
                {selecting ? 'Cancel select' : 'Select'}
              </button>
              {selecting && (
                <>
                  <label className="text-sm font-semibold text-brown flex items-center gap-2">From
                    <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className="min-h-[44px] px-2 rounded-md border border-warm-border" />
                  </label>
                  <label className="text-sm font-semibold text-brown flex items-center gap-2">To
                    <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className="min-h-[44px] px-2 rounded-md border border-warm-border" />
                  </label>
                  <button
                    type="button"
                    disabled={!selectedIds.length && !(rangeFrom && rangeTo)}
                    onClick={() => {
                      const rows = rangeFrom && rangeTo
                        ? visible.filter((row) => {
                          const date = String(row.window_date).slice(0, 10);
                          return date >= rangeFrom && date <= rangeTo;
                        })
                        : visible.filter((row) => selectedIds.includes(row.id));
                      setConfirmDelete({
                        rows,
                        text: `Delete ${rows.length} windows${rangeFrom && rangeTo ? ` from ${formatMonthDay(rangeFrom)} to ${formatMonthDay(rangeTo)}` : ''}?`,
                      });
                    }}
                    className="min-h-[44px] px-3 rounded-lg border border-rose text-rose text-sm font-semibold disabled:opacity-40"
                  >
                    Delete selected
                  </button>
                </>
              )}
            </div>
            {rowNote && <p className="text-sm rounded-lg px-3 py-2 bg-rose-light text-rose" role="alert">{rowNote}</p>}
            {weeks.map((week) => {
              const visits = week.rows.reduce((sum, row) => sum + visitCount(row.start_time, row.end_time, row.slot_duration_minutes, row.buffer_minutes), 0);
              return (
                <section key={week.week} id={`week-${week.week}`} className="rounded-xl border border-warm-border bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif font-bold text-burgundy">Week of {week.label}</h2>
                    {selecting && (
                      <button
                        type="button"
                        className="min-h-[44px] text-sm font-semibold text-burgundy"
                        onClick={() => {
                          const ids = week.rows.map((row) => row.id);
                          setSelectedIds((prev) => (ids.every((id) => prev.includes(id)) ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
                        }}
                      >
                        Select week
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-brown-light mb-2">{week.rows.length} windows, {visits} visits</p>
                  <ul className="space-y-2">
                    {week.rows.map((row) => {
                      const date = String(row.window_date).slice(0, 10);
                      const label = `${formatWeekdayMonthDay(date)}, ${formatTime12(row.start_time)} to ${formatTime12(row.end_time)}`;
                      const isNew = freshIds.has(row.id);
                      return (
                        <li
                          key={row.id}
                          className={`flex items-center gap-2 rounded-lg border border-warm-border p-2 ${isNew ? 'bg-gold-light' : 'bg-cream'}`}
                        >
                          {selecting && (
                            <input
                              type="checkbox"
                              className="h-5 w-5"
                              checked={selectedIds.includes(row.id)}
                              aria-label={`Select ${label}`}
                              onChange={() => setSelectedIds((prev) => (prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]))}
                            />
                          )}
                          <button type="button" onClick={() => { setEditing({ ...row, window_date: date, start_time: String(row.start_time).slice(0, 5), end_time: String(row.end_time).slice(0, 5) }); setEditError(''); }} className="flex-1 min-h-[44px] text-left">
                            <span className="block text-sm font-semibold text-brown">
                              {formatWeekdayMonthDay(date)}
                              {isNew && <span className="ml-2 text-xs font-bold uppercase tracking-wide text-amber">New</span>}
                            </span>
                            <span className="block text-sm text-brown">
                              {formatTime12(row.start_time)}–{formatTime12(row.end_time)}, {row.slot_duration_minutes} min
                              {Number(row.booked_count) > 0 ? `, ${row.booked_count} booked` : ''}
                            </span>
                          </button>
                          <button
                            type="button"
                            aria-label={`More actions for ${label}`}
                            onClick={() => setMenuFor(menuFor === row.id ? null : row.id)}
                            className="min-h-[44px] min-w-[44px] rounded-lg border border-warm-border font-bold"
                          >
                            ···
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${label}`}
                            onClick={() => deleteOne(row)}
                            className="min-h-[44px] min-w-[44px] rounded-lg text-rose"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                          {menuFor === row.id && (
                            <div className="w-full basis-full">
                              <button
                                type="button"
                                disabled={!row.series_id}
                                onClick={() => {
                                  const rows = windows.filter((item) => item.series_id && item.series_id === row.series_id);
                                  setConfirmDelete({ rows, text: `Delete this series (${rows.length} windows)?` });
                                  setMenuFor(null);
                                }}
                                className="min-h-[44px] text-sm font-semibold text-rose disabled:opacity-40"
                              >
                                {row.series_id ? 'Delete this series' : 'Delete this series (available after the schedule update)'}
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        {showCalendar && (
          <div className="rounded-xl border border-warm-border bg-white p-4">
            <h2 className="font-serif font-bold text-burgundy mb-2">This month</h2>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-brown-light">{day}</div>
              ))}
              {monthCells.map((date, index) => date ? (
                <button
                  key={date}
                  type="button"
                  aria-label={`${formatLongDate(date)}, ${countsByDate[date] || 0} window${countsByDate[date] === 1 ? '' : 's'}`}
                  onClick={() => document.getElementById(`week-${mondayOf(date)}`)?.scrollIntoView({ block: 'start' })}
                  className="min-h-[44px] rounded-lg border border-warm-border text-sm font-semibold"
                >
                  {Number(date.slice(-2))}
                  {countsByDate[date] > 0 && <span className="block text-[10px] text-sage">{countsByDate[date]}</span>}
                </button>
              ) : <div key={`blank-${index}`} />)}
            </div>
          </div>
        )}

        <details className="lg:hidden rounded-xl border border-warm-border bg-white p-4">
          <summary className="min-h-[44px] cursor-pointer font-semibold text-burgundy">Add to my calendar</summary>
          {feedUrl && <SubscribePanel feedUrl={feedUrl} description={FEED_COPY} className="border-0 shadow-none p-0 mt-3" />}
        </details>
        {feedUrl && (
          <div className="hidden lg:block">
            <SubscribePanel feedUrl={feedUrl} description={FEED_COPY} />
          </div>
        )}
      </div>

      {editor && (
        <div className="lg:col-span-2 lg:sticky lg:top-20">
          <WeeklyPatternEditor
            mode={editor}
            existing={windows}
            windowsReady={!loading && !loadError}
            initial={prefill}
            triggerRef={patternButtonRef}
            onClose={closeEditor}
            onSave={handleSave}
          />
        </div>
      )}

      {editing && (
        <div role="dialog" aria-modal="true" aria-labelledby="edit-window-title" className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-ink/40 p-4">
          <form onSubmit={saveEdit} className="w-full max-w-md rounded-xl bg-white p-5 space-y-3">
            <h2 id="edit-window-title" className="font-serif text-xl font-bold text-burgundy">Edit {formatWeekdayMonthDay(editing.window_date)}</h2>
            <p className="text-sm text-brown-light">All times Mountain Time.</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-brown">Start
                <input type="time" step={900} value={editing.start_time} onChange={(e) => setEditing({ ...editing, start_time: e.target.value })} className="mt-1 w-full min-h-[44px] px-3 rounded-md border border-warm-border" />
              </label>
              <label className="text-sm font-semibold text-brown">End
                <input type="time" step={900} value={editing.end_time} onChange={(e) => setEditing({ ...editing, end_time: e.target.value })} className="mt-1 w-full min-h-[44px] px-3 rounded-md border border-warm-border" />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {UI_SLOT_LENGTHS.map((mins) => (
                <button key={mins} type="button" aria-pressed={Number(editing.slot_duration_minutes) === mins} onClick={() => setEditing({ ...editing, slot_duration_minutes: mins })} className={`min-h-[44px] px-3 rounded-lg border text-sm font-semibold ${Number(editing.slot_duration_minutes) === mins ? 'bg-burgundy text-white border-burgundy' : 'border-warm-border'}`}>
                  {mins}m
                </button>
              ))}
            </div>
            {editError && <p className="text-sm text-rose" role="alert">{editError}</p>}
            <div className="flex gap-2">
              <button type="submit" className="min-h-[44px] flex-1 rounded-lg bg-burgundy text-white font-semibold">Save change</button>
              <button type="button" onClick={() => setEditing(null)} className="min-h-[44px] px-4 rounded-lg border border-warm-border font-semibold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 space-y-3">
            <h2 className="font-serif text-xl font-bold text-burgundy">{confirmDelete.text}</h2>
            <p className="text-sm text-brown-light">Windows with a booked visit stay on the schedule.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => removeRows(confirmDelete.rows, 'Deleted.')} className="min-h-[44px] flex-1 rounded-lg bg-rose text-white font-semibold">Delete</button>
              <button type="button" onClick={() => setConfirmDelete(null)} className="min-h-[44px] px-4 rounded-lg border border-warm-border font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast toast={toast} onUndo={undoToast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
