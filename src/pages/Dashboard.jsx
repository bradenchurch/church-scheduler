import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/auth';
import { authedFetch } from '../lib/api';
import Badge from '../components/Badge';
import SectionLabel from '../components/SectionLabel';

const requesterLabel = (r) => {
  const c = r.companionships;
  if (c && c.companion1_name && c.companion2_name) return `${c.companion1_name} & ${c.companion2_name}`;
  if (c && c.companion1_name) return c.companion1_name;
  if (c && c.companion2_name) return c.companion2_name;
  return 'Walk-in request';
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
};

// Three pastel tints rotated per interviewer (mockup: Cole→amber, Kawika→sage,
// Sean→rose). Border tints match the mockup's `.stat-*` border-color values.
const STAT_TINTS = [
  { bg: 'bg-amber-light', text: 'text-amber', border: 'border-[#E8D9B0]' },
  { bg: 'bg-sage-light', text: 'text-sage', border: 'border-[#CDD6C5]' },
  { bg: 'bg-rose-light', text: 'text-rose', border: 'border-[#EAD0D0]' },
];

export default function Dashboard() {
  const [stats, setStats] = useState([]);
  const [companionships, setCompanionships] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, role, token } = useAuth();
  const [queue, setQueue] = useState({ pending: [], assigned: [], completed: [] });
  const [leadersList, setLeadersList] = useState([]);
  const [assignTargets, setAssignTargets] = useState({});
  const [queueError, setQueueError] = useState(false);

  useEffect(() => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    Promise.all([
      fetch('/api/companionships').then(res => res.json()).catch(() => []), // Public endpoint
      fetch('/api/bookings/all', { headers }).then(res => res.json()).catch(() => [])
    ]).then(([compData, bookingData]) => {

      const bookingsByComp = {};
      if (Array.isArray(bookingData)) {
        bookingData.forEach(b => {
          // If multiple, just keep the latest for simplicity or based on date.
          bookingsByComp[b.companionship_id] = b.status;
        });
      }

      const leaderStats = {};

      const enrichedComps = (Array.isArray(compData) ? compData : []).map(c => {
        const leaderName = c.leaders?.name || 'Unassigned';
        if (!leaderStats[leaderName]) leaderStats[leaderName] = { total: 0, completed: 0 };
        leaderStats[leaderName].total += 1;

        const status = bookingsByComp[c.id] || 'pending';
        if (status === 'completed') leaderStats[leaderName].completed += 1;

        return { ...c, status, leaderName };
      });

      const statsArr = Object.keys(leaderStats).map(leader => ({
        leader,
        total: leaderStats[leader].total,
        completed: leaderStats[leader].completed
      }));

      setStats(statsArr);
      setCompanionships(enrichedComps);
      setLoading(false);
    });
  }, [token]);

  // QR request queue — poll every 30s (authenticated users only).
  const refreshQueue = useCallback(() => {
    if (!token) return;
    fetch('/api/qr/queue', { headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('queue ' + res.status))))
      .then((d) => {
        setQueue({ pending: d.pending || [], assigned: d.assigned || [], completed: d.completed || [] });
        setQueueError(false);
      })
      .catch(() => setQueueError(true));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refreshQueue();
    const id = setInterval(refreshQueue, 30000);
    return () => clearInterval(id);
  }, [token, refreshQueue]);

  useEffect(() => {
    authedFetch('/api/leaders').then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) {
        setLeadersList(Array.from(new Map(data.map(l => [l.id, l])).values()));
      }
    }).catch(() => []);
  }, []);

  const handleAssignNow = async (requestId) => {
    const leaderId = assignTargets[requestId];
    if (!leaderId || !token) return;
    const res = await fetch('/api/qr/assign-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ request_id: requestId, leader_id: leaderId }),
    });
    if (res.ok) {
      setAssignTargets((prev) => { const n = { ...prev }; delete n[requestId]; return n; });
      refreshQueue();
    }
  };

  const handleAutoAssign = async () => {
    const res = await fetch('/api/qr/assign-next', { method: 'POST' });
    if (res.ok) refreshQueue();
  };

  if (loading) return <div className="p-4 text-brown-light">Loading dashboard…</div>;

  return (
    <div className="space-y-8">
      {/* App header — matches mockup .app-header (eyebrow ward + serif title) */}
      <header className="text-center pt-4 pb-2">
        <SectionLabel className="mb-2">Long Valley 2nd Ward</SectionLabel>
        <h1 className="text-2xl font-serif text-burgundy">Elders Quorum Presidency</h1>
      </header>

      {/* Auth bar — matches mockup .auth-bar */}
      <div className="flex justify-end items-center gap-3 text-sm">
        {user ? (
          <>
            <span className="text-muted">{user.email}</span>
            <button onClick={() => signOut()} className="text-rose hover:underline">
              Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" className="text-burgundy hover:underline">Leader Login</Link>
        )}
      </div>

      {/* Interviewer stat cards — matches mockup .stats-grid */}
      {stats.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s, i) => {
            const tint = STAT_TINTS[i % STAT_TINTS.length];
            const percent = s.total ? Math.round((s.completed / s.total) * 100) : 0;
            return (
              <div key={s.leader} className={`${tint.bg} ${tint.border} border rounded-lg text-center px-2 py-5`}>
                <p className="text-sm text-ink mb-1">{s.leader}</p>
                <p className={`text-3xl leading-tight font-serif ${tint.text}`}>{s.completed}/{s.total}</p>
                <p className="text-xs mt-0.5 text-muted">{percent}% booked</p>
              </div>
            );
          })}
        </div>
      )}

      {/* QR request queue (authenticated) */}
      {token && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-bold text-burgundy">QR Request Queue</h2>
            {role === 'admin' && (
              <button
                onClick={handleAutoAssign}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-light transition-colors"
              >
                Auto-assign Next
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-amber-light border border-warm-border">
              <p className="text-2xl font-serif font-bold text-amber">{queue.pending.length}</p>
              <p className="text-xs font-semibold text-amber">Pending</p>
            </div>
            <div className="p-4 rounded-lg bg-sage-light border border-warm-border">
              <p className="text-2xl font-serif font-bold text-sage">{queue.assigned.length}</p>
              <p className="text-xs font-semibold text-sage">Assigned</p>
            </div>
            <div className="p-4 rounded-lg bg-rose-light border border-warm-border">
              <p className="text-2xl font-serif font-bold text-rose">{queue.completed.length}</p>
              <p className="text-xs font-semibold text-rose">Completed this week</p>
            </div>
          </div>

          {queueError && (
            <p className="text-sm text-rose mb-4">Couldn&apos;t load the queue. It may be empty or you may not have access.</p>
          )}

          <h3 className="font-semibold text-brown mb-2">Pending Requests</h3>
          <div className="space-y-2 mb-6">
            {queue.pending.length === 0 ? (
              <p className="text-sm text-brown-light">No pending requests.</p>
            ) : (
              queue.pending.map((r) => (
                <div key={r.id} className="p-3 border border-warm-border rounded-lg flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[160px]">
                    <div className="font-semibold text-ink">{requesterLabel(r)}</div>
                    <div className="text-xs text-brown-light">Submitted {formatDate(r.submitted_at)}</div>
                    {r.notes && <div className="text-xs text-brown-light italic">{r.notes}</div>}
                  </div>
                  {role === 'admin' && (
                    <div className="flex items-center gap-2">
                      <select
                        value={assignTargets[r.id] || ''}
                        onChange={(e) => setAssignTargets((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        className="min-h-[44px] p-2 border-[1.5px] border-warm-border rounded-md bg-white text-sm text-ink"
                      >
                        <option value="">Assign to…</option>
                        {leadersList.filter((l) => l.active !== false).map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignNow(r.id)}
                        disabled={!assignTargets[r.id]}
                        className="min-h-[44px] px-3 py-2 rounded-lg bg-burgundy text-white text-sm font-semibold disabled:opacity-40"
                      >
                        Assign now
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <h3 className="font-semibold text-brown mb-2">Assigned</h3>
          <div className="space-y-2">
            {queue.assigned.length === 0 ? (
              <p className="text-sm text-brown-light">No assigned requests.</p>
            ) : (
              queue.assigned.map((r) => (
                <div key={r.id} className="p-3 border border-warm-border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-ink">{requesterLabel(r)}</div>
                    <div className="text-xs text-brown-light">Assigned {formatDate(r.assigned_at)}</div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-sage-light text-sage">
                    {r.leaders?.name || 'Unassigned'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pending Companionships — matches mockup table w/ Copy Link */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <h2 className="text-xl font-serif font-bold mb-4 text-burgundy">Pending Companionships</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-warm-border">
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted">Companionship</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted">Interviewer</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {companionships.filter(c => c.status === 'pending').slice(0, 10).map(c => (
                <tr key={c.id} className="border-b border-warm-border/50">
                  <td className="p-3 text-ink">{c.companion1_name} & {c.companion2_name}</td>
                  <td className="p-3 text-brown">{c.leaderName}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/book`)}
                      className="min-h-[32px] px-3 py-1 rounded-md border-[1.5px] border-warm-border text-brown text-xs font-semibold hover:border-brown transition-colors"
                    >
                      Copy Link
                    </button>
                  </td>
                </tr>
              ))}
              {companionships.filter(c => c.status === 'pending').length === 0 && (
                <tr><td colSpan="3" className="p-3 text-brown-light text-center">No pending companionships</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Companionships — matches mockup table w/ semantic status badges */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <h2 className="text-xl font-serif font-bold mb-4 text-burgundy">All Companionships</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-warm-border">
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted">Companionship</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted">Interviewer</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {companionships.map(c => (
                <tr key={c.id} className="border-b border-warm-border/50">
                  <td className="p-3 text-ink">{c.companion1_name} & {c.companion2_name}</td>
                  <td className="p-3 text-brown">{c.leaderName}</td>
                  <td className="p-3">
                    <Badge status={c.status} />
                  </td>
                </tr>
              ))}
              {companionships.length === 0 && (
                <tr><td colSpan="3" className="p-3 text-brown-light text-center">No companionships found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links — matches mockup .quick-links */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <h2 className="text-xl font-serif font-bold mb-4 text-burgundy">Quick Links</h2>
        <div className="space-y-3">
          <Link to="/book" className="block text-burgundy font-medium hover:underline">→ Booking Page</Link>

          <div className="flex gap-4 flex-wrap items-center">
            {user ? (
              <>
                <Link to="/leader" className="text-burgundy hover:underline">→ My Leader Page</Link>
                {role === 'admin' && (
                  <Link to="/admin" className="text-burgundy hover:underline">→ Admin Panel</Link>
                )}
                <Link to="/settings" className="text-burgundy hover:underline">Settings</Link>
              </>
            ) : (
              <Link to="/login" className="text-burgundy hover:underline">Leader Login</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
