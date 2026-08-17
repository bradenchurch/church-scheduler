import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/Badge';

// Active presidency leaders an admin can switch between on /leader.
const LEADERS = [
  { id: 'cole', name: 'Cole Chollet' },
  { id: 'kawika', name: 'Kawika Tupuola' },
  { id: 'sean', name: 'Sean Bryan' },
];

const leaderNameFor = (id) => {
  const found = LEADERS.find((l) => l.id === id);
  return found ? found.name : id;
};

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-burgundy"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export default function Leader() {
  const { leaderId, token, user, role } = useAuth();
  const isAdmin = role === 'admin';

  const [selectedLeaderId, setSelectedLeaderId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [icalToken, setIcalToken] = useState(null);
  const [copied, setCopied] = useState(false);

  // Admins manage any leader and default to the first active leader (Cole);
  // non-admin leaders are pinned to their own leader id.
  const effectiveLeaderId = isAdmin ? selectedLeaderId || LEADERS[0].id : leaderId;

  // Load slots + bookings for the effective leader.
  useEffect(() => {
    if (!effectiveLeaderId) {
      setLoading(false);
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
  }, [effectiveLeaderId, token]);

  // Load the effective leader's iCal token. Admins can fetch any leader's token;
  // non-admin leaders only fetch their own.
  useEffect(() => {
    if (!effectiveLeaderId || !token) return;
    let active = true;
    const url = isAdmin
      ? `/api/leader/${effectiveLeaderId}/ical-token`
      : '/api/me/ical-token';
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : {}))
      .then((d) => {
        if (active) setIcalToken(d?.ical_token || null);
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

  const feedUrl = icalToken
    ? `${window.location.origin}/api/cal/${effectiveLeaderId}.ics?key=${encodeURIComponent(icalToken)}`
    : '';

  const handleCopyFeedUrl = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

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
                {LEADERS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* iCal Subscription Feed */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon />
            <h3 className="text-xl font-serif font-bold text-burgundy">iCal Subscription Feed</h3>
          </div>
          <p className="text-sm text-brown-light mb-4">
            Subscribe once and your interview bookings sync automatically — no Google account connection needed.
          </p>

          <div className="rounded-lg bg-cream border border-warm-border px-4 py-3 mb-4">
            <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1.5">
              Subscription URL
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <code className="flex-1 min-w-0 break-all text-xs text-brown">{feedUrl || 'Loading…'}</code>
              <button
                type="button"
                onClick={handleCopyFeedUrl}
                disabled={!feedUrl}
                className="min-h-[48px] w-full sm:w-auto sm:shrink-0 px-4 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {copied ? 'Copied' : 'Copy iCal Subscription Link'}
              </button>
            </div>
            {copied && <p className="text-xs text-sage mt-2">Subscription link copied to clipboard.</p>}
          </div>

          <div className="space-y-1.5 text-sm text-brown-light">
            <p><span className="font-semibold text-brown">Apple Calendar:</span> File → New Calendar Subscription → paste the URL</p>
            <p><span className="font-semibold text-brown">Google Calendar:</span> Settings → Add calendar → From URL → paste the URL</p>
            <p className="text-xs text-brown-light mt-2">Paste this link into your calendar app to auto-sync bookings.</p>
          </div>
        </div>

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
