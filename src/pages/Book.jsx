import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authedFetch } from '../lib/api';

function CheckIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-sage"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// Expand a date-specific availability window into bookable increments of
// `slotDuration` minutes (default 30). e.g. "08:00"–"10:00" at 30m →
// ["08:00", "08:30", "09:00", "09:30"]; at 15m → ["08:00", "08:15", …].
function expandWindowTimes(start, end, slotDuration = 30) {
  if (!start || !end) return [];
  const step = Number(slotDuration) > 0 ? Number(slotDuration) : 30;
  const [sh, sm] = String(start).split(':').map(Number);
  const [eh, em] = String(end).split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const out = [];
  for (let m = startMin; m < endMin; m += step) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return out;
}

function formatWindowDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function Book() {
  const [searchParams] = useSearchParams();
  const prefillId = searchParams.get('companionship');
  const [lang, setLang] = useState('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selectedComp, setSelectedComp] = useState(null);
  const [slots, setSlots] = useState([]);
  const [windows, setWindows] = useState([]);
  const [bookedDetails, setBookedDetails] = useState(null);
  const [bookError, setBookError] = useState('');

  const t = {
    en: {
      find: "Find Your Companionship",
      search: "Search",
      placeholder: "Enter last name...",
      back: "Back",
      pickTime: "Pick a Time",
      interviewer: "Interviewer",
      noSlots: "No available slots.",
      booked: "Booked!",
      scheduled: "Your interview is scheduled.",
      bookAnother: "Book another",
      addToGoogle: "Add to Google Calendar",
      downloadIcs: "Download .ics",
      days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    },
    es: {
      find: "Encuentra tu Compañerismo",
      search: "Buscar",
      placeholder: "Ingrese apellido...",
      back: "Volver",
      pickTime: "Elige una Hora",
      interviewer: "Entrevistador",
      noSlots: "No hay horarios disponibles.",
      booked: "¡Reservado!",
      scheduled: "Tu entrevista está programada.",
      bookAnother: "Reservar otra",
      addToGoogle: "Añadir a Google Calendar",
      downloadIcs: "Descargar .ics",
      days: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
    }
  };

  const currentT = t[lang];

  // Deep-link support: /book?companionship=<id> (sent via the admin dashboard's
  // "Text Invite" / "Copy Link" actions) auto-selects the companionship so the
  // companion lands directly on their interviewer's available times.
  useEffect(() => {
    if (!prefillId) return;
    let cancelled = false;

    fetch('/api/companionships')
      .then((r) => r.json())
      .then((list) => {
        const comp = (Array.isArray(list) ? list : []).find((c) => c.id === prefillId);
        if (!comp || cancelled) return null;
        setSelectedComp(comp);
        return fetch(`/api/availability/${comp.leader_id}`);
      })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        setSlots(Array.isArray(data) ? data : data.slots || []);
        setWindows(data.windows || []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [prefillId]);

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
    setSlots(Array.isArray(data) ? data : data.slots || []);
    setWindows(data.windows || []);
  };

  const handleBook = async (slot) => {
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = slot.day_of_week;

    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) {
      daysUntil += 7;
    }

    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + daysUntil);
    const dateString = scheduledDate.toISOString().split('T')[0];

    setBookError('');
    const res = await authedFetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companionship_id: selectedComp.id, slot_id: slot.id, scheduled_date: dateString })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setBookError(data?.error || 'Booking failed. Please try again.');
      return;
    }
    setBookedDetails({ date: dateString, time: slot.start_time, duration: slot.duration_minutes || 30 });
  };

  const handleBookWindow = async (window, time) => {
    setBookError('');
    const res = await authedFetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companionship_id: selectedComp.id,
        window_id: window.id,
        scheduled_date: window.window_date,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setBookError(data?.error || 'Booking failed. Please try again.');
      return;
    }
    setBookedDetails({ date: window.window_date, time, duration: window.slot_duration_minutes || 30 });
  };

  const getCalendarLinks = () => {
    if (!bookedDetails) return {};

    // YYYYMMDDTHHMMSSZ format for calendar
    const d = new Date(bookedDetails.date + 'T' + bookedDetails.time);
    const end = new Date(d.getTime() + bookedDetails.duration * 60000);

    const startStr = d.toISOString().replace(/-|:|.\d+/g, '');
    const endStr = end.toISOString().replace(/-|:|.\d+/g, '');

    const title = "Ministering Interview";
    const details = "Ministering Interview with " + (selectedComp?.leaders?.name || '');

    const googleLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}`;

    const icsContent =
`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startStr}
DTEND:${endStr}
SUMMARY:${title}
DESCRIPTION:${details}
END:VEVENT
END:VCALENDAR`;
    const icsLink = "data:text/calendar;charset=utf8," + encodeURIComponent(icsContent);

    return { googleLink, icsLink };
  };

  if (bookedDetails) {
    const { googleLink, icsLink } = getCalendarLinks();
    return (
      <div className="max-w-md mx-auto">
        <div className="flex justify-end mb-4">
          <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="text-brown-light hover:text-brown font-medium">
            {lang === 'en' ? 'Español' : 'English'}
          </button>
        </div>
        <div className="text-center p-8 bg-sage-light border border-sage rounded-xl shadow-sm">
          <div className="flex justify-center mb-3">
            <CheckIcon />
          </div>
          <h2 className="text-2xl font-serif font-bold text-sage mb-2">{currentT.booked}</h2>
          <p className="text-brown mb-6">{currentT.scheduled}</p>

          <div className="flex flex-col gap-3 mb-6 max-w-[260px] mx-auto">
            <a href={googleLink} target="_blank" rel="noreferrer" className="min-h-[44px] bg-burgundy text-white py-2 px-4 rounded-lg font-semibold hover:bg-burgundy-light transition-colors inline-flex items-center justify-center">
              {currentT.addToGoogle}
            </a>
            <a href={icsLink} download="interview.ics" className="min-h-[44px] bg-transparent border-[1.5px] border-warm-border text-brown py-2 px-4 rounded-lg font-semibold hover:border-brown transition-colors inline-flex items-center justify-center">
              {currentT.downloadIcs}
            </a>
          </div>

          <button onClick={() => window.location.reload()} className="text-burgundy hover:text-burgundy-light font-medium">{currentT.bookAnother} →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-end mb-4">
        <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="text-brown-light hover:text-brown font-medium">
          {lang === 'en' ? 'Español' : 'English'}
        </button>
      </div>

      {!selectedComp ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
          <h2 className="text-xl font-serif font-bold mb-4 text-center text-burgundy">{currentT.find}</h2>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={currentT.placeholder}
              className="min-h-[44px] flex-1 border-[1.5px] border-warm-border rounded-md p-2 text-base text-ink focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
            />
            <button type="submit" className="min-h-[44px] bg-burgundy text-white px-4 rounded-lg font-semibold hover:bg-burgundy-light transition-colors">{currentT.search}</button>
          </form>

          <div className="space-y-2">
            {results.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelectComp(c)}
                className="w-full text-left p-3 border border-warm-border rounded-lg hover:border-burgundy hover:bg-cream transition-colors"
              >
                <div className="font-semibold text-ink">{c.companion1_name} & {c.companion2_name}</div>
                <div className="text-sm text-brown-light">{currentT.interviewer}: {c.leaders?.name || 'Assigned Leader'}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
          <button onClick={() => setSelectedComp(null)} className="text-sm text-brown-light mb-4 hover:underline">&larr; {currentT.back}</button>
          <h2 className="text-xl font-serif font-bold mb-2 text-burgundy">{currentT.pickTime}</h2>
          <p className="text-brown-light mb-6">{currentT.interviewer}: {selectedComp.leaders?.name}</p>

          {bookError && (
            <p className="text-sm rounded-lg px-3 py-2 bg-rose-light text-rose mb-4">{bookError}</p>
          )}

          <div className="space-y-2">
            {slots.length === 0 && windows.length === 0 ? (
              <p className="text-brown-light italic">{currentT.noSlots}</p>
            ) : (
              <>
                {slots.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleBook(s)}
                    className="w-full text-left p-4 border border-warm-border rounded-lg hover:bg-warm-white hover:border-burgundy transition-all flex justify-between items-center"
                  >
                    <span className="font-semibold text-lg text-ink">{currentT.days[s.day_of_week]}</span>
                    <span className="text-brown">{s.start_time.slice(0,5)}</span>
                  </button>
                ))}
                {windows.flatMap((w) =>
                  expandWindowTimes(w.start_time, w.end_time, w.slot_duration_minutes).map((time) => ({ window: w, time }))
                ).map(({ window, time }) => (
                  <button
                    key={`${window.id}-${time}`}
                    onClick={() => handleBookWindow(window, time)}
                    className="w-full text-left p-4 border border-warm-border rounded-lg hover:bg-warm-white hover:border-burgundy transition-all flex justify-between items-center"
                  >
                    <span className="font-semibold text-lg text-ink">{formatWindowDate(window.window_date)}</span>
                    <span className="text-brown">{time}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
