import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authedFetch } from '../lib/api';
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

export default function AdminDashboard() {
  const { user, role, token, loading } = useAuth();
  const [data, setData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [copiedId, setCopiedId] = useState('');
  const [completingId, setCompletingId] = useState('');

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
      <div>
        <SectionLabel>Admin · Analytics</SectionLabel>
        <h1 className="text-3xl font-serif font-bold text-burgundy mt-1">Analytics Dashboard</h1>
        <p className="text-brown-light mt-1 max-w-xl">
          Ward-wide interview completion and a live action list of who still needs to schedule.
        </p>
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
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                        <Badge status={c.status} className="self-start sm:self-auto" />
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
    </div>
  );
}
