import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/Badge';
import SubscribePanel from '../components/SubscribePanel';
import { formatMonthDay, todayInTimeZone } from '../../shared/availability.js';

export default function Leader() {
  const { leaderId, token, user, role } = useAuth();
  const isAdmin = role === 'admin';

  // Presidency position labels (mirrors AdminRoster.jsx + AdminDashboard.jsx).
  //   president | counselor | secretary | clerk
  const POSITION_LABELS = {
    president: 'President',
    counselor: 'Counselor',
    secretary: 'Secretary',
    clerk: 'Clerk',
  };
  const positionLabelFor = (id) => {
    const found = leaders.find((l) => l.id === id);
    return POSITION_LABELS[found?.position] || 'Presidency';
  };

  const [leaders, setLeaders] = useState([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderUuid, setLeaderUuid] = useState(null);
  const [upcomingWindows, setUpcomingWindows] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`/api/leaders`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const uniqueLeaders = Array.from(new Map(data.map(l => [l.id, l])).values());
          setLeaders(uniqueLeaders);
        }
      })
      .catch(() => {});
  }, [isAdmin, token]);

  // Admins manage any leader and default to the first active leader;
  // non-admin leaders are pinned to their own leader id.
  const effectiveLeaderId = isAdmin ? selectedLeaderId || (leaders.length > 0 ? leaders[0].id : null) : leaderId;

  const leaderNameFor = (id) => {
    const found = leaders.find((l) => l.id === id);
    return found ? found.name : id;
  };

  // Load bookings and upcoming dated windows for the effective leader.
  useEffect(() => {
    if (!effectiveLeaderId) {
      if (!isAdmin) setLoading(false);
      return;
    }
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    const today = todayInTimeZone();

    Promise.all([
      fetch(`/api/bookings/${effectiveLeaderId}`, { headers }).then((res) => res.json()).catch(() => []),
      fetch(`/api/availability/${effectiveLeaderId}/windows`, { headers }).then((res) => (res.ok ? res.json() : { windows: [] })).catch(() => ({ windows: [] })),
    ]).then(([bData, wData]) => {
      if (Array.isArray(bData)) setBookings(bData);
      const rows = Array.isArray(wData?.windows) ? wData.windows : [];
      setUpcomingWindows(rows.filter((row) => String(row.window_date).slice(0, 10) >= today));
      setLoading(false);
    });
  }, [effectiveLeaderId, token, isAdmin]);

  // Resolve the effective leader's public feed UUID so we can build the
  // /ical/leader/:uuid.ics subscription URL. Admins read any leader's UUID off
  // the token endpoint; non-admin leaders read their own record.
  useEffect(() => {
    if (!effectiveLeaderId || !token) return;
    let active = true;
    const url = isAdmin
      ? `/api/leader/${effectiveLeaderId}/ical-token`
      : '/api/me/leader';
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : {}))
      .then((d) => {
        if (active) setLeaderUuid(d?.uuid || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [effectiveLeaderId, token, isAdmin]);

  const handleBulkComplete = async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const pendingBookings = bookings.filter((b) => b.status === 'booked' || b.status === 'pending');
    for (const b of pendingBookings) {
      await fetch(`/api/bookings/${b.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'completed' }),
      });
    }
    const res = await fetch(`/api/bookings/${effectiveLeaderId}`, { headers: { Authorization: `Bearer ${token}` } });
    const bData = await res.json();
    if (Array.isArray(bData)) setBookings(bData);
  };

  const handleCopyDigest = () => {
    const pendingBookings = bookings.filter((b) => b.status === 'booked' || b.status === 'pending');
    if (pendingBookings.length === 0) {
      alert('No upcoming interviews to copy.');
      return;
    }
    const name = isAdmin ? leaderNameFor(effectiveLeaderId) : (user?.email?.split('@')[0] || effectiveLeaderId);
    const text =
      '*Upcoming Interviews for ' + name + '*\n\n' +
      pendingBookings.map((b) => {
        return '- ' + b.companionships?.companion1_name + ' & ' + b.companionships?.companion2_name + ': ' + b.scheduled_date + ' at ' + b.slots?.start_time.slice(0, 5);
      }).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      alert('Weekly digest copied to clipboard!');
    });
  };

  // The ministering feed is a subscription URL (webcal://) so the leader's
  // calendar app polls it automatically — mirrors AdminAvailability, which
  // subscribes to the cache-safe /ical/leader/:uuid.ics route.
  const feedUrl = leaderUuid
    ? `webcal://${window.location.host}/ical/leader/${leaderUuid}.ics`
    : '';

  if (loading) return <div className="p-4">Loading...</div>;
  if (!effectiveLeaderId) return <div className="p-4">Leader ID not found. Ensure your email matches a leader record.</div>;

  const displayName = isAdmin ? leaderNameFor(effectiveLeaderId) : user?.email?.split('@')[0] || effectiveLeaderId;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-serif font-bold capitalize text-burgundy">{displayName}'s Dashboard</h2>
          <p className="text-xs italic text-brown-light mt-0.5">{positionLabelFor(effectiveLeaderId)}</p>

          {isAdmin && (
            <label className="flex flex-col gap-1 text-sm text-brown-light w-full sm:w-auto">
              <span className="font-semibold text-brown">Leader</span>
              <select
                value={effectiveLeaderId}
                onChange={(e) => setSelectedLeaderId(e.target.value)}
                className="min-h-[48px] w-full p-2 border-[1.5px] border-warm-border rounded-md bg-white focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all font-semibold text-burgundy"
              >
                {leaders.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Subscribe to your calendar — the cache-safe /ical/leader feed. */}
        {feedUrl && (
          <SubscribePanel
            feedUrl={feedUrl}
            description="Add your schedule to your phone's calendar. This is separate from confirmation emails."
            className="mb-8"
          />
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-serif font-bold text-burgundy">Current Bookings</h3>

            <div className="flex gap-2">
              <button
                onClick={handleCopyDigest}
                className="min-h-[48px] bg-transparent border border-burgundy text-burgundy px-4 py-2 rounded-md hover:bg-burgundy-ghost transition-colors text-sm font-semibold"
              >
                Copy Digest
              </button>
              <button
                onClick={handleBulkComplete}
                className="min-h-[48px] bg-burgundy text-white px-4 py-2 rounded-md hover:bg-burgundy-light transition-colors text-sm font-semibold"
              >
                Bulk Mark Complete
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {bookings.length === 0 ? (
              <p className="text-brown-light italic">No bookings found.</p>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="p-4 border border-warm-border rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{b.companionships?.companion1_name} & {b.companionships?.companion2_name}</div>
                    <div className="text-sm text-brown-light">{b.scheduled_date} at {b.slots?.start_time}</div>
                  </div>
                  <div>
                    <Badge status={b.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
          <h3 className="text-xl font-serif font-bold mb-2 text-burgundy">Your availability</h3>
          <p className="text-brown mb-4">
            {upcomingWindows.length === 0
              ? 'You have no upcoming windows.'
              : `You have ${upcomingWindows.length} upcoming window${upcomingWindows.length === 1 ? '' : 's'} through ${formatMonthDay(String([...upcomingWindows].sort((a, b) => String(a.window_date).localeCompare(String(b.window_date))).at(-1).window_date).slice(0, 10))}.`}
          </p>
          <Link
            to="/availability"
            className="min-h-[48px] inline-flex items-center px-4 rounded-lg bg-burgundy text-white font-semibold hover:bg-burgundy-light transition-colors"
          >
            Manage availability
          </Link>
        </div>
      </div>
    </div>
  );
}
