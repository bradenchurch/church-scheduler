import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/Badge';
import SubscribePanel from '../components/SubscribePanel';

export default function Leader() {
  const { leaderId, token, user, role } = useAuth();
  const isAdmin = role === 'admin';

  const [leaders, setLeaders] = useState([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderUuid, setLeaderUuid] = useState(null);

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

  // Load slots + bookings for the effective leader.
  useEffect(() => {
    if (!effectiveLeaderId) {
      if (!isAdmin) setLoading(false);
      return;
    }
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`/api/slots/${effectiveLeaderId}`, { headers }).then((res) => res.json()).catch(() => []),
      fetch(`/api/bookings/${effectiveLeaderId}`, { headers }).then((res) => res.json()).catch(() => []),
    ]).then(([sData, bData]) => {
      if (Array.isArray(sData)) setSlots(sData);
      if (Array.isArray(bData)) setBookings(bData);
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

  const [newSlotDay, setNewSlotDay] = useState(0);
  const [newSlotTime, setNewSlotTime] = useState('19:00');
  const [addingSlot, setAddingSlot] = useState(false);

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

  const handleAddSlot = async (e) => {
    e.preventDefault();
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    const res = await fetch(`/api/slots/${effectiveLeaderId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ day_of_week: newSlotDay, start_time: newSlotTime, duration_minutes: 30 }),
    });
    if (res.ok) {
      const addedSlot = await res.json();
      setSlots([...slots, addedSlot]);
      setAddingSlot(false);
    }
  };

  const handleRemoveSlot = async (slotId) => {
    const headers = { Authorization: `Bearer ${token}` };
    const res = await fetch(`/api/slots/${slotId}`, { method: 'DELETE', headers });
    if (res.ok) {
      setSlots(slots.filter((s) => s.id !== slotId));
    }
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
            description="Your published availability and booked visits sync automatically — no Google account connection needed. Add it once and your calendar refreshes itself."
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
          <h3 className="text-xl font-serif font-bold mb-4 text-burgundy">Manage Availability</h3>
          <p className="text-brown-light mb-4 text-sm">Add 30-min slots for your interviews.</p>
          <div className="space-y-2 mb-4">
            {slots.map((s) => {
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              return (
                <div key={s.id} className="p-3 border border-warm-border rounded-lg flex justify-between items-center">
                  <span>{days[s.day_of_week]} at {s.start_time.slice(0, 5)}</span>
                  <button onClick={() => handleRemoveSlot(s.id)} className="text-rose text-sm hover:underline">Remove</button>
                </div>
              );
            })}
          </div>

          {!addingSlot ? (
            <button
              onClick={() => setAddingSlot(true)}
              className="min-h-[48px] w-full py-2 border-2 border-dashed border-warm-border text-burgundy rounded-lg hover:border-burgundy-light hover:bg-burgundy-ghost transition-colors font-semibold"
            >
              + Add New Slot
            </button>
          ) : (
            <form onSubmit={handleAddSlot} className="p-4 border border-warm-border rounded-xl bg-cream space-y-3">
              <div className="flex gap-4">
                <select
                  value={newSlotDay}
                  onChange={(e) => setNewSlotDay(parseInt(e.target.value))}
                  className="min-h-[48px] p-2 border-[1.5px] border-warm-border rounded-md bg-white focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all flex-1"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
                <input
                  type="time"
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                  className="min-h-[48px] p-2 border-[1.5px] border-warm-border rounded-md bg-white focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all flex-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setAddingSlot(false)} className="min-h-[48px] px-4 py-2 text-brown-light font-semibold hover:underline">Cancel</button>
                <button type="submit" className="min-h-[48px] px-4 py-2 bg-burgundy text-white rounded-md hover:bg-burgundy-light transition-colors font-semibold">Save Slot</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
