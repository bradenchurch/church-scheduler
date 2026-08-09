import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function Leader() {
  const { leaderId } = useParams();
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // For the POC, we'll assume leaderId string (like "cole") maps to a UUID via lookup or mock.
  // In a real app we'd fetch the UUID based on the name. For simplicity, we just fetch with the string
  // if the DB supports it or assume leaderId is the UUID. Let's mock a UUID resolution if needed,
  // but to keep it simple we'll just make the API call. The backend expects a UUID, so we'll need to handle that.
  // For now, we will just display a static skeleton if the API fails with invalid UUID.

  useEffect(() => {
    // Attempt to fetch, in real app leaderId param would be the UUID or we'd resolve it.
    Promise.all([
      fetch(`/api/slots/${leaderId}`).then(res => res.json()).catch(() => []),
      fetch(`/api/bookings/${leaderId}`).then(res => res.json()).catch(() => [])
    ]).then(([sData, bData]) => {
      if (Array.isArray(sData)) setSlots(sData);
      if (Array.isArray(bData)) setBookings(bData);
      setLoading(false);
    });
  }, [leaderId]);

  const [newSlotDay, setNewSlotDay] = useState(0);
  const [newSlotTime, setNewSlotTime] = useState('19:00');
  const [addingSlot, setAddingSlot] = useState(false);

  const handleBulkComplete = async () => {
    // Mark all booked as completed
    const pendingBookings = bookings.filter(b => b.status === 'booked' || b.status === 'pending');
    for (const b of pendingBookings) {
      await fetch(`/api/bookings/${b.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
    }
    // Refresh
    const res = await fetch(`/api/bookings/${leaderId}`);
    const bData = await res.json();
    if (Array.isArray(bData)) setBookings(bData);
  };

  
  const handleCopyDigest = () => {
    const pendingBookings = bookings.filter(b => b.status === 'booked' || b.status === 'pending');
    if (pendingBookings.length === 0) {
      alert('No upcoming interviews to copy.');
      return;
    }
    const text = "*Upcoming Interviews for " + leaderId.charAt(0).toUpperCase() + leaderId.slice(1) + "*\n\n" +
      pendingBookings.map(b => {
        return "- " + b.companionships?.companion1_name + " & " + b.companionships?.companion2_name + ": " + b.scheduled_date + " at " + b.slots?.start_time.slice(0,5);
      }).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Weekly digest copied to clipboard!');
    });
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/slots/${leaderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: newSlotDay, start_time: newSlotTime, duration_minutes: 30 })
    });
    if (res.ok) {
      const addedSlot = await res.json();
      setSlots([...slots, addedSlot]);
      setAddingSlot(false);
    }
  };

  const handleRemoveSlot = async (slotId) => {
    const res = await fetch(`/api/slots/${slotId}`, { method: 'DELETE' });
    if (res.ok) {
      setSlots(slots.filter(s => s.id !== slotId));
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4 capitalize">{leaderId}'s Dashboard</h2>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Current Bookings</h3>
            
            <div className="flex gap-2">
              <button
                onClick={handleCopyDigest}
                className="bg-stone-200 text-stone-800 px-4 py-2 rounded text-sm font-semibold hover:bg-stone-300"
              >
                Copy Digest
              </button>
              <button
                onClick={handleBulkComplete}
                className="bg-stone-800 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-stone-700"
              >
                Bulk Mark Complete
              </button>
            </div>

          </div>

          <div className="space-y-2">
            {bookings.length === 0 ? (
              <p className="text-stone-500 italic">No bookings found.</p>
            ) : (
              bookings.map(b => (
                <div key={b.id} className="p-4 border border-stone-200 rounded flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{b.companionships?.companion1_name} & {b.companionships?.companion2_name}</div>
                    <div className="text-sm text-stone-500">{b.scheduled_date} at {b.slots?.start_time}</div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      b.status === 'completed' ? 'bg-green-100 text-green-800' :
                      b.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {b.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
          <h3 className="text-xl font-bold mb-4">Manage Availability</h3>
          <p className="text-stone-500 mb-4 text-sm">Add 30-min slots for your interviews.</p>
          {/* A simple form to add a slot could go here */}
          <div className="space-y-2 mb-4">
             {slots.map(s => {
                const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                return (
                  <div key={s.id} className="p-3 border border-stone-200 rounded flex justify-between items-center">
                    <span>{days[s.day_of_week]} at {s.start_time.slice(0,5)}</span>
                    <button onClick={() => handleRemoveSlot(s.id)} className="text-red-600 text-sm hover:underline">Remove</button>
                  </div>
                );
             })}
          </div>

          {!addingSlot ? (
            <button
              onClick={() => setAddingSlot(true)}
              className="w-full py-2 border-2 border-dashed border-stone-300 text-stone-600 rounded font-semibold hover:border-stone-400"
            >
              + Add New Slot
            </button>
          ) : (
            <form onSubmit={handleAddSlot} className="p-4 border border-stone-200 rounded bg-stone-50 space-y-3">
              <div className="flex gap-4">
                <select
                  value={newSlotDay}
                  onChange={e => setNewSlotDay(parseInt(e.target.value))}
                  className="p-2 border border-stone-300 rounded bg-white flex-1"
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
                  onChange={e => setNewSlotTime(e.target.value)}
                  className="p-2 border border-stone-300 rounded bg-white flex-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setAddingSlot(false)} className="px-4 py-2 text-stone-600 font-semibold hover:underline">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-stone-800 text-white rounded font-semibold">Save Slot</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}