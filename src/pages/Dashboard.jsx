import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/auth';

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

      // Initialize known leaders from request if they have no companionships yet
      ['Cole', 'Kawika', 'Sean'].forEach(l => {
         leaderStats[l] = { total: 0, completed: 0 };
      });

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
    fetch('/api/leaders').then((r) => r.json()).then(setLeadersList).catch(() => []);
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

  if (loading) return <div className="p-4">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-burgundy">Long Valley 2nd Ward</h1>
        <p className="text-lg text-stone-600 mt-1">Elders Quorum Presidency Dashboard</p>
      </div>
      {token && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-warm-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-burgundy">QR Request Queue</h2>
            {role === 'admin' && (
              <button
                onClick={handleAutoAssign}
                className="min-h-[44px] px-4 py-2 rounded bg-sage text-white text-sm font-semibold hover:opacity-90"
              >
                Auto-assign Next
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gold-light">
              <p className="text-2xl font-bold text-amber">{queue.pending.length}</p>
              <p className="text-sm font-semibold text-amber">Pending</p>
            </div>
            <div className="p-4 rounded-lg bg-sage-light">
              <p className="text-2xl font-bold text-sage">{queue.assigned.length}</p>
              <p className="text-sm font-semibold text-sage">Assigned</p>
            </div>
            <div className="p-4 rounded-lg bg-rose-light">
              <p className="text-2xl font-bold text-rose">{queue.completed.length}</p>
              <p className="text-sm font-semibold text-rose">Completed this week</p>
            </div>
          </div>

          {queueError && (
            <p className="text-sm text-rose mb-4">Couldn't load the queue. It may be empty or you may not have access.</p>
          )}

          <h3 className="font-semibold text-brown mb-2">Pending Requests</h3>
          <div className="space-y-2 mb-6">
            {queue.pending.length === 0 ? (
              <p className="text-sm text-stone-500">No pending requests.</p>
            ) : (
              queue.pending.map((r) => (
                <div key={r.id} className="p-3 border border-warm-border rounded flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[160px]">
                    <div className="font-semibold">{requesterLabel(r)}</div>
                    <div className="text-xs text-stone-500">Submitted {formatDate(r.submitted_at)}</div>
                    {r.notes && <div className="text-xs text-stone-500 italic">{r.notes}</div>}
                  </div>
                  {role === 'admin' && (
                    <div className="flex items-center gap-2">
                      <select
                        value={assignTargets[r.id] || ''}
                        onChange={(e) => setAssignTargets((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        className="min-h-[44px] p-2 border border-warm-border rounded bg-white text-sm"
                      >
                        <option value="">Assign to…</option>
                        {leadersList.filter((l) => l.active !== false).map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignNow(r.id)}
                        disabled={!assignTargets[r.id]}
                        className="min-h-[44px] px-3 py-2 rounded bg-burgundy text-white text-sm font-semibold disabled:opacity-40"
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
              <p className="text-sm text-stone-500">No assigned requests.</p>
            ) : (
              queue.assigned.map((r) => (
                <div key={r.id} className="p-3 border border-warm-border rounded flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{requesterLabel(r)}</div>
                    <div className="text-xs text-stone-500">Assigned {formatDate(r.assigned_at)}</div>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-sage-light text-sage">
                    {r.leaders?.name || 'Unassigned'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-serif font-bold mb-4 text-burgundy">Completion Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map(s => {
            const percent = (s.completed / s.total) * 100;
            let color = 'bg-rose-light text-rose border-rose-light';
            if (percent >= 80) color = 'bg-sage-light text-sage border-sage-light';
            else if (percent >= 40) color = 'bg-amber-light text-amber border-amber-light';

            return (
              <div key={s.leader} className={`p-4 rounded-lg border ${color}`}>
                <h3 className="font-serif font-bold text-lg text-burgundy">{s.leader}</h3>
                <p className="text-2xl font-light">{s.completed} / {s.total}</p>
                <p className="text-sm opacity-75">{Math.round(percent)}% completed</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border mb-8">
        <h2 className="text-xl font-serif font-bold mb-4 text-burgundy">Pending Companionships</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream border-b border-warm-border">
              <tr>
                <th className="p-3">Companionship</th>
                <th className="p-3">Interviewer</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {companionships.filter(c => c.status === 'pending').slice(0, 10).map(c => (
                <tr key={c.id} className="border-b border-warm-border/50">
                  <td className="p-3">{c.companion1_name} & {c.companion2_name}</td>
                  <td className="p-3">{c.leaderName}</td>
                  <td className="p-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/book`)}
                      className="text-burgundy font-medium hover:text-burgundy-light underline"
                    >
                      Copy Link
                    </button>
                  </td>
                </tr>
              ))}
              {companionships.filter(c => c.status === 'pending').length === 0 && (
                <tr><td colSpan="3" className="p-3 text-stone-500 text-center">No pending companionships</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <h2 className="text-xl font-serif font-bold mb-4 text-burgundy">All Companionships</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream border-b border-warm-border">
              <tr>
                <th className="p-3">Companionship</th>
                <th className="p-3">Interviewer</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {companionships.map(c => (
                <tr key={c.id} className="border-b border-warm-border/50">
                  <td className="p-3">{c.companion1_name} & {c.companion2_name}</td>
                  <td className="p-3">{c.leaderName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      c.status === 'completed' ? 'bg-sage-light text-sage' :
                      c.status === 'booked' ? 'bg-amber-light text-amber' : 'bg-rose-light text-rose'
                    }`}>
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {companionships.length === 0 && (
                <tr><td colSpan="3" className="p-3 text-stone-500 text-center">No companionships found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border mt-8">
        <h2 className="text-xl font-serif font-bold mb-4 text-burgundy">Quick Links</h2>
        <div className="space-y-4">
          <Link to="/book" className="block text-burgundy font-medium hover:text-burgundy-light underline">Go to Companion Booking Page</Link>

          <div className="flex gap-4 flex-wrap items-center">
            {user ? (
              <>
                <Link to="/leader" className="text-stone-600 hover:underline">My Leader Page</Link>
                {role === 'admin' && (
                  <Link to="/admin" className="text-stone-600 hover:underline">Admin Panel</Link>
                )}
                <button onClick={() => signOut()} className="text-red-600 hover:underline text-sm ml-auto">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="text-stone-600 hover:underline">Leader Login</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}