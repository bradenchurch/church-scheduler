import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/auth';

export default function Dashboard() {
  const [stats, setStats] = useState([]);
  const [companionships, setCompanionships] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, role, token } = useAuth();

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

  if (loading) return <div className="p-4">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-burgundy">Long Valley 2nd Ward</h1>
        <p className="text-lg text-stone-600 mt-1">Elders Quorum Presidency Dashboard</p>
      </div>

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