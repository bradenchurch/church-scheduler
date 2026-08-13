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
      <div>
        <h2 className="text-2xl font-bold mb-4">Completion Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map(s => {
            const percent = (s.completed / s.total) * 100;
            let color = 'bg-red-100 text-red-800 border-red-200';
            if (percent >= 80) color = 'bg-green-100 text-green-800 border-green-200';
            else if (percent >= 40) color = 'bg-yellow-100 text-yellow-800 border-yellow-200';

            return (
              <div key={s.leader} className={`p-4 rounded-lg border ${color}`}>
                <h3 className="font-bold text-lg">{s.leader}</h3>
                <p className="text-2xl font-light">{s.completed} / {s.total}</p>
                <p className="text-sm opacity-75">{Math.round(percent)}% completed</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 mb-8">
        <h2 className="text-xl font-bold mb-4">Pending Companionships</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="p-3">Companionship</th>
                <th className="p-3">Interviewer</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {companionships.filter(c => c.status === 'pending').slice(0, 10).map(c => (
                <tr key={c.id} className="border-b border-stone-100">
                  <td className="p-3">{c.companion1_name} & {c.companion2_name}</td>
                  <td className="p-3">{c.leaderName}</td>
                  <td className="p-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/book`)}
                      className="text-blue-600 hover:underline"
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

      <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
        <h2 className="text-xl font-bold mb-4">All Companionships</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="p-3">Companionship</th>
                <th className="p-3">Interviewer</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {companionships.map(c => (
                <tr key={c.id} className="border-b border-stone-100">
                  <td className="p-3">{c.companion1_name} & {c.companion2_name}</td>
                  <td className="p-3">{c.leaderName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      c.status === 'completed' ? 'bg-green-100 text-green-800' :
                      c.status === 'booked' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
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

      <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 mt-8">
        <h2 className="text-xl font-bold mb-4">Quick Links</h2>
        <div className="space-y-4">
          <Link to="/book" className="block text-blue-600 hover:underline">Go to Companion Booking Page</Link>

          <div className="flex gap-4 flex-wrap items-center">
            {user ? (
              <>
                <Link to="/leader" className="text-stone-600 hover:underline">My Leader Page</Link>
                {role === 'admin' && (
                  <Link to="/admin" className="text-stone-600 hover:underline">Admin Panel</Link>
                )}
                <Link to="/settings" className="text-stone-600 hover:underline">Settings</Link>
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