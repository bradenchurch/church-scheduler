import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authedFetch, downloadCsv } from '../lib/api';
import Badge from '../components/Badge';
import SectionLabel from '../components/SectionLabel';

const FILTERS = [
  { key: 'pending', label: 'Unscheduled' },
  { key: 'booked', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

// Per-interviewer pastel tint (DESIGN-SYSTEM.md): Cole→amber, Kawika→sage,
// Sean→rose. Unknown leaders fall back to a neutral burgundy ghost.
const DISTRICT_TINTS = {
  cole: { bar: 'bg-amber', label: 'text-amber', ghost: 'bg-amber-light' },
  kawika: { bar: 'bg-sage', label: 'text-sage', ghost: 'bg-sage-light' },
  sean: { bar: 'bg-rose', label: 'text-rose', ghost: 'bg-rose-light' },
};

const FALLBACK_TINT = { bar: 'bg-burgundy', label: 'text-burgundy', ghost: 'bg-burgundy-ghost' };

function tintFor(leaderId) {
  return DISTRICT_TINTS[String(leaderId).toLowerCase()] || FALLBACK_TINT;
}

// Normalize a phone number for an `sms:`/`tel:` URI (strip spaces/dashes/parens,
// keep a leading +).
function normalizePhone(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

// Next calendar occurrence of a weekday (0=Sun..6=Sat), as YYYY-MM-DD.
function nextOccurrence(dayOfWeek) {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  const d = new Date(today);
  d.setDate(today.getDate() + daysUntil);
  return d.toISOString().split('T')[0];
}

// Expand a date-specific availability window into bookable start times.
function expandWindowTimes(start, end, slotDuration = 30) {
  if (!start || !end) return [];
  const step = Number(slotDuration) > 0 ? Number(slotDuration) : 30;
  const [sh, sm] = String(start).split(':').map(Number);
  const [eh, em] = String(end).split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const out = [];
  for (let m = startMin; m < endMin; m += step) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return out;
}

function formatWindowDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function MetricCard({ eyebrow, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-warm-border shadow-sm p-6">
      <p className="text-xs uppercase tracking-widest text-muted">{eyebrow}</p>
      <p className="mt-2 text-3xl font-serif font-bold text-burgundy">{value}</p>
      <p className="mt-1 text-sm text-brown-light">{sub}</p>
    </div>
  );
}

function DistrictCard({ district }) {
  const tint = tintFor(district.leader_id);
  const scheduled = district.booked + district.completed;
  const scheduledPct = district.total === 0 ? 0 : Math.round((scheduled / district.total) * 100);

  return (
    <div className="bg-white rounded-xl border border-warm-border shadow-sm p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-serif font-semibold text-brown">{district.leader_name}</h3>
        <span className={`text-2xl font-serif font-bold ${tint.label}`}>
          {district.completion_rate}%
        </span>
      </div>

      <div className="mt-3 h-2.5 w-full rounded-full bg-cream overflow-hidden">
        <div
          className={`h-full rounded-full ${tint.bar} transition-all`}
          style={{ width: `${scheduledPct}%` }}
          role="progressbar"
          aria-valuenow={scheduledPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brown-light">
        <span>{district.total} total</span>
        <span>{district.booked} scheduled</span>
        <span>{district.completed} completed</span>
        <span>{district.pending} unscheduled</span>
      </div>
    </div>
  );
}

function CallBookDrawer({ comp, data, loading, error, message, bookingSlot, onClose, onBook }) {
  const phones = [comp.companion1_phone, comp.companion2_phone].map(normalizePhone).filter(Boolean);
  const names = [comp.elder1_name, comp.elder2_name].filter(Boolean);

  const recurring = (data?.slots || []).map((s) => ({
    id: s.id,
    label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.day_of_week],
    time: String(s.start_time || '').slice(0, 5),
    day_of_week: s.day_of_week,
  }));

  const windowSlots = (data?.windows || []).flatMap((w) =>
    expandWindowTimes(w.start_time, w.end_time, w.slot_duration_minutes).map((time) => ({
      id: w.id,
      label: formatWindowDate(w.window_date),
      time,
      window_date: w.window_date,
    }))
  );

  const slots = [...recurring, ...windowSlots];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl bg-warm-white border-t border-warm-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 border-b border-warm-border flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted">Call &amp; Book</p>
            <h2 className="text-xl font-serif font-bold text-burgundy mt-1">
              {names.length ? names.join(' & ') : 'Unnamed companionship'}
            </h2>
            <p className="text-sm text-brown-light mt-0.5">{comp.leader_name || 'Unassigned'}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-brown-light hover:text-brown hover:bg-cream transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Tap-to-dial contacts */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted">Tap to call</p>
            {phones.length === 0 && (
              <p className="text-sm text-brown-light">No phone numbers on file for this companionship.</p>
            )}
            {phones.map((p, i) => (
              <a
                key={`${p}-${i}`}
                href={`tel:${p}`}
                className="min-h-[48px] w-full flex items-center justify-center gap-2 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-light transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {i === 0 ? (names[0] || 'Companion 1') : (names[1] || 'Companion 2')} · {p}
              </a>
            ))}
          </div>

          {/* Book a slot on their behalf */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted">Book a slot</p>
            {loading && <p className="text-sm text-brown-light">Loading availability…</p>}
            {!loading && error && <p className="text-sm rounded-lg px-3 py-2 bg-rose-light text-rose">{error}</p>}
            {!loading && !error && slots.length === 0 && (
              <p className="text-sm text-brown-light">No availability published yet.</p>
            )}
            {!loading && !error && slots.map((s) => (
              <button
                key={`${s.id}-${s.time}`}
                onClick={() => onBook(s)}
                disabled={bookingSlot === s.id}
                className="w-full min-h-[48px] flex items-center justify-between px-4 rounded-lg border border-warm-border text-brown hover:border-burgundy hover:bg-cream transition-colors disabled:opacity-40"
              >
                <span className="font-semibold">{s.label}</span>
                <span className="text-brown-light">{s.time}</span>
              </button>
            ))}
            {message && <p className="text-sm rounded-lg px-3 py-2 bg-sage-light text-sage">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, role, token, loading } = useAuth();
  const [data, setData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [copiedId, setCopiedId] = useState('');
  const [completingId, setCompletingId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [callBookComp, setCallBookComp] = useState(null);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState('');
  const [drawerMessage, setDrawerMessage] = useState('');
  const [drawerBookingSlot, setDrawerBookingSlot] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoadingData(true);
    setError('');
    try {
      const res = await authedFetch('/api/admin/analytics');
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to load analytics');
      setData(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchAnalytics();
  }, [fetchAnalytics, token]);

  const companionships = useMemo(() => data?.companionships_status || [], [data]);

  const visible = useMemo(() => {
    if (filter === 'all') return companionships;
    return companionships.filter((c) => c.status === filter);
  }, [companionships, filter]);

  const counts = useMemo(() => {
    const by = { pending: 0, booked: 0, completed: 0, all: companionships.length };
    for (const c of companionships) by[c.status] = (by[c.status] || 0) + 1;
    return by;
  }, [companionships]);

  const inviteHref = (c) => {
    const body = `Hi there, here is the link to schedule our Elders Quorum interview: ${c.unique_booking_url}`;
    const phones = [c.companion1_phone, c.companion2_phone].map(normalizePhone).filter(Boolean);
    if (phones.length >= 2) {
      // Group text: address both companions in a single message thread.
      return `sms:${phones.join(',')}?body=${encodeURIComponent(body)}`;
    }
    if (phones.length === 1) {
      return `sms:${phones[0]}?body=${encodeURIComponent(body)}`;
    }
    return `sms:?body=${encodeURIComponent(body)}`;
  };

  const copyLink = async (c) => {
    try {
      await navigator.clipboard.writeText(c.unique_booking_url);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — degrade silently.
    }
    setCopiedId(c.id);
    window.setTimeout(() => setCopiedId(''), 2000);
  };

  const markComplete = async (c) => {
    if (completingId || !c.booking_id) return;
    setCompletingId(c.id);
    try {
      const res = await authedFetch(`/api/bookings/${c.booking_id}/complete`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to mark complete');
      await fetchAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setCompletingId('');
    }
  };

  const handleExportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await downloadCsv('/api/admin/export.csv', 'interview-progress.csv');
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  // Call & Book drawer: open the availability for a companionship's assigned
  // leader so the secretary can book a slot on their behalf while on the phone.
  const openCallBook = async (c) => {
    setCallBookComp(c);
    setDrawerData(null);
    setDrawerError('');
    setDrawerMessage('');
    setDrawerBookingSlot(null);
    if (!c.leader_id) {
      setDrawerError('This companionship has no assigned presidency member.');
      return;
    }
    setDrawerLoading(true);
    try {
      const res = await fetch(`/api/availability/${encodeURIComponent(c.leader_id)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || 'Failed to load availability');
      setDrawerData(data);
    } catch (err) {
      setDrawerError(err.message || 'Failed to load availability');
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeCallBook = () => {
    setCallBookComp(null);
    setDrawerData(null);
    setDrawerMessage('');
    setDrawerError('');
    setDrawerBookingSlot(null);
  };

  const bookForComp = async (slot) => {
    if (!callBookComp) return;
    setDrawerBookingSlot(slot.id);
    setDrawerError('');
    setDrawerMessage('');
    try {
      const scheduledDate = slot.window_date || nextOccurrence(slot.day_of_week);
      const res = await authedFetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionship_id: callBookComp.id,
          slot_id: slot.window_date ? null : slot.id,
          window_id: slot.window_date ? slot.id : null,
          scheduled_date: scheduledDate,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDrawerError(body?.error || 'Booking failed. Please try again.');
        return;
      }
      setDrawerMessage(`Booked ${slot.start_time || slot.time} on ${scheduledDate}.`);
      await fetchAnalytics();
    } catch (err) {
      setDrawerError(err.message || 'Booking failed.');
    } finally {
      setDrawerBookingSlot(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-brown-light">Loading authentication…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin' && role !== 'leader') {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-xl border border-warm-border text-center">
        <h1 className="text-2xl font-serif font-bold text-burgundy">403</h1>
        <p className="text-sm text-brown-light mt-2">You don&apos;t have access to the analytics dashboard.</p>
      </div>
    );
  }

  const scheduledCount = (data?.booked_count || 0) + (data?.completed_count || 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <SectionLabel>Admin · Analytics</SectionLabel>
          <h1 className="text-3xl font-serif font-bold text-burgundy mt-1">Analytics Dashboard</h1>
          <p className="text-brown-light mt-1 max-w-xl">
            Ward-wide interview completion and a live action list of who still needs to schedule.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-light disabled:opacity-40 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {error && (
        <p className="text-sm rounded-lg px-4 py-3 bg-rose-light text-rose border border-rose/20">
          {error}
        </p>
      )}

      {loadingData ? (
        <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
          <p className="text-sm text-brown-light">Loading analytics…</p>
        </div>
      ) : (
        <>
          {/* Top metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              eyebrow="Ward Completion Rate"
              value={`${data?.ward_completion_rate ?? 0}%`}
              sub={`${data?.completed_count ?? 0} of ${data?.total_companionships ?? 0} interviews completed`}
            />
            <MetricCard
              eyebrow="Open Slot Capacity"
              value={String(data?.open_slots_count ?? 0)}
              sub={`${data?.pending_count ?? 0} companionships still unscheduled`}
            />
            <MetricCard
              eyebrow="Overall Ward Status"
              value={`${scheduledCount} / ${data?.total_companionships ?? 0}`}
              sub="Companionships completed / scheduled"
            />
          </div>

          {/* District breakdown */}
          <div>
            <SectionLabel>District Breakdown</SectionLabel>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(data?.district_breakdown || []).map((d) => (
                <DistrictCard key={d.leader_id} district={d} />
              ))}
            </div>
          </div>

          {/* Action list */}
          <div>
            <SectionLabel>Who Hasn&apos;t Scheduled?</SectionLabel>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`min-h-[48px] whitespace-nowrap flex-shrink-0 px-4 rounded-lg text-sm font-semibold transition-colors ${
                    filter === f.key
                      ? 'bg-burgundy text-white'
                      : 'bg-white border border-warm-border text-brown hover:border-brown'
                  }`}
                >
                  {f.label}
                  <span className="ml-1.5 text-xs opacity-70">{counts[f.key] ?? 0}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {visible.length === 0 ? (
                <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
                  <p className="text-lg font-serif font-semibold text-brown">No companionships</p>
                  <p className="text-sm text-brown-light mt-1">
                    Nothing to show for this filter right now.
                  </p>
                </div>
              ) : (
                visible.map((c) => {
                  const names = [c.elder1_name, c.elder2_name].filter(Boolean).join(' & ');
                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-xl border border-warm-border shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink">{names || 'Unnamed companionship'}</div>
                        <div className="text-sm text-brown-light">
                          {c.leader_name || 'Unassigned'}
                          {c.booking_date
                            ? ` · ${c.booking_date}${c.booking_time ? ` ${String(c.booking_time).slice(0, 5)}` : ''}`
                            : ''}
                        </div>
                        {c.notes && (
                          <div className="mt-2 text-sm text-brown bg-cream rounded-md p-2">
                            <span className="font-semibold text-xs uppercase tracking-wider text-brown-light mr-2">Needs / Topics</span>
                            {c.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                        <Badge status={c.status} className="self-start sm:self-auto" />
                        <button
                          onClick={() => openCallBook(c)}
                          className="min-h-[48px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 rounded-lg border-[1.5px] border-burgundy text-burgundy text-sm font-semibold hover:bg-burgundy-ghost transition-colors"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          Call &amp; Book
                        </button>
                        {c.status === 'pending' && (
                          <>
                            <a
                              href={inviteHref(c)}
                              className="min-h-[48px] w-full sm:w-auto inline-flex items-center justify-center px-4 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-light transition-colors"
                            >
                              Text Invite
                            </a>
                            <button
                              onClick={() => copyLink(c)}
                              className="min-h-[48px] w-full sm:w-auto inline-flex items-center justify-center px-4 rounded-lg border-[1.5px] border-warm-border text-brown text-sm font-semibold hover:border-brown transition-colors"
                            >
                              {copiedId === c.id ? 'Copied' : 'Copy Link'}
                            </button>
                          </>
                        )}
                        {c.status === 'booked' && (
                          <button
                            onClick={() => markComplete(c)}
                            disabled={completingId === c.id}
                            className="min-h-[48px] w-full sm:w-auto inline-flex items-center justify-center px-4 rounded-lg bg-sage text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-colors"
                          >
                            {completingId === c.id ? 'Marking…' : 'Mark Complete'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {callBookComp && (
        <CallBookDrawer
          comp={callBookComp}
          data={drawerData}
          loading={drawerLoading}
          error={drawerError}
          message={drawerMessage}
          bookingSlot={drawerBookingSlot}
          onClose={closeCallBook}
          onBook={bookForComp}
        />
      )}
    </div>
  );
}
