import React, { useState } from 'react';

export default function Book() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selectedComp, setSelectedComp] = useState(null);
  const [slots, setSlots] = useState([]);
  const [booked, setBooked] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    const res = await fetch(`/api/companionships?search=${searchTerm}`);
    const data = await res.json();
    setResults(data);
  };

  const handleSelectComp = async (comp) => {
    setSelectedComp(comp);
    const res = await fetch(`/api/availability/${comp.leader_id}`);
    const data = await res.json();
    setSlots(data);
  };

  const handleBook = async (slot) => {
    // Calculate the next date for the given day_of_week
    const today = new Date();
    const currentDay = today.getDay(); // 0-6
    const targetDay = slot.day_of_week;

    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) {
      daysUntil += 7; // if today or past, schedule for next week
    }

    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + daysUntil);
    const dateString = scheduledDate.toISOString().split('T')[0];

    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companionship_id: selectedComp.id, slot_id: slot.id, scheduled_date: dateString })
    });
    setBooked(true);
  };

  if (booked) {
    return (
      <div className="text-center p-8 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-2xl font-bold text-green-800 mb-2">Booked!</h2>
        <p className="text-green-700">Your interview is scheduled.</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-green-700 underline">Book another</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {!selectedComp ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
          <h2 className="text-xl font-bold mb-4 text-center">Find Your Companionship</h2>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Enter last name..."
              className="flex-1 border border-stone-300 rounded p-2 text-lg"
            />
            <button type="submit" className="bg-stone-800 text-white px-4 rounded font-semibold">Search</button>
          </form>

          <div className="space-y-2">
            {results.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelectComp(c)}
                className="w-full text-left p-3 border border-stone-200 rounded hover:bg-stone-50"
              >
                <div className="font-semibold">{c.companion1_name} & {c.companion2_name}</div>
                <div className="text-sm text-stone-500">Interviewer: {c.leaders?.name || 'Assigned Leader'}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
          <button onClick={() => setSelectedComp(null)} className="text-sm text-stone-500 mb-4 hover:underline">&larr; Back</button>
          <h2 className="text-xl font-bold mb-2">Pick a Time</h2>
          <p className="text-stone-600 mb-6">Interviewer: {selectedComp.leaders?.name}</p>

          <div className="space-y-2">
            {slots.length === 0 ? (
              <p className="text-stone-500 italic">No available slots.</p>
            ) : (
              slots.map(s => {
                const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                return (
                  <button
                    key={s.id}
                    onClick={() => handleBook(s)}
                    className="w-full text-left p-4 border border-stone-200 rounded hover:bg-stone-50 hover:border-stone-400 transition-colors flex justify-between items-center"
                  >
                    <span className="font-medium text-lg">{days[s.day_of_week]}</span>
                    <span className="text-stone-600">{s.start_time.slice(0,5)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}