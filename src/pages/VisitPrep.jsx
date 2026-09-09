import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

// Public visit-prep page — the click-through target of the booking VEVENT's
// URL: line on a presidency member's ministering calendar. No auth: the
// booking UUID in the route IS the access token. Shows when the visit is,
// which presidency member is assigned, the companionship, and the households
// they'll visit — nothing more (no phones, no addresses).

function formatDate(dateStr) {
  if (!dateStr) return 'Date TBD';
  const d = new Date(`${String(dateStr).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return 'Time TBD';
  const [h, m] = String(timeStr).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return String(timeStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function initials(name) {
  const parts = String(name || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  // Stored as "Last, First" — initials from both parts when available.
  if (parts.length >= 2) return `${(parts[1][0] || '')}${(parts[0][0] || '')}`;
  return parts[0]?.slice(0, 2).toUpperCase() || '?';
}

export default function VisitPrep() {
  const { bookingId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/visit/${encodeURIComponent(bookingId)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(res.status === 404 ? 'not_found' : 'server_error');
          return;
        }
        setData(body);
      })
      .catch(() => {
        if (!cancelled) setError('server_error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center text-muted" role="status">
        Loading visit details…
      </div>
    );
  }

  if (error === 'not_found' || !data) {
    return (
      <div className="max-w-xl mx-auto mt-6">
        <div className="rounded-2xl border border-warm-border bg-white p-8 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🕊️
          </p>
          <h1 className="font-serif text-2xl text-burgundy font-bold mb-2">
            This visit couldn’t be found
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            The visit may have been cancelled, or the link may be out of date.
            If you were invited to this visit, ask the presidency for a fresh
            calendar invite.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Back to scheduler
          </Link>
        </div>
      </div>
    );
  }

  if (error === 'server_error') {
    return (
      <div className="max-w-xl mx-auto mt-6">
        <div className="rounded-2xl border border-rose/20 bg-rose-light p-6 text-center">
          <h1 className="font-serif text-xl text-rose font-bold mb-1">Something went wrong</h1>
          <p className="text-rose/90 text-sm">
            We couldn’t load this visit. Please try again in a moment.
          </p>
        </div>
      </div>
    );
  }

  const { booking = {}, companionship = {}, leader = {} } = data;
  const companions = companionship.companions || [];
  const households = companionship.households || [];
  const hasNotes = Boolean(booking.notes && String(booking.notes).trim());

  return (
    <div className="max-w-xl mx-auto">
      {/* When */}
      <section className="rounded-2xl bg-burgundy px-6 py-6 text-white shadow-sm sm:px-8 sm:py-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-burgundy-ghost/90">
          Upcoming visit
        </p>
        <h1 className="mt-1 font-serif text-2xl font-bold leading-snug sm:text-3xl">
          {formatDate(booking.date)}
        </h1>
        <p className="mt-1.5 text-burgundy-ghost">
          {formatTime(booking.time)}
          {Number(booking.duration_minutes) > 0 && (
            <span className="opacity-90"> · {booking.duration_minutes} min</span>
          )}
        </p>
      </section>

      {/* You (the leader) */}
      <section className="mt-4 rounded-2xl border border-warm-border bg-white p-5 sm:p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Presidency member
        </h2>
        <p className="mt-1.5 font-serif text-lg font-semibold text-ink sm:text-xl">
          {leader.name || 'Presidency member'}
        </p>
        {leader.calling && (
          <p className="text-sm text-brown-light mt-0.5">{leader.calling}</p>
        )}
      </section>

      {/* The companionship */}
      <section className="mt-4 rounded-2xl border border-warm-border bg-white p-5 sm:p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Companionship
        </h2>
        <ul className="mt-2 divide-y divide-warm-border">
          {companions.map((name) => (
            <li key={name} className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-1">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-light text-xs font-bold text-sage"
              >
                {initials(name)}
              </span>
              <span className="text-ink font-medium">{name}</span>
            </li>
          ))}
          {companions.length === 0 && (
            <li className="py-2 text-sm text-muted">Companionship details unavailable.</li>
          )}
        </ul>
      </section>

      {/* Households */}
      <section className="mt-4 rounded-2xl border border-warm-border bg-white p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Families to visit
          </h2>
          <span className="text-xs text-muted tabular-nums">{households.length}</span>
        </div>
        {households.length > 0 ? (
          <ul className="mt-3 space-y-0 divide-y divide-warm-border">
            {households.map((name) => (
              <li
                key={name}
                className="flex items-center gap-3 py-2 text-ink first:pt-0 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                />
                <span className="font-serif text-[17px]">{name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No households assigned yet.</p>
        )}
      </section>

      {/* Notes */}
      {hasNotes && (
        <section className="mt-4 rounded-2xl border border-amber/20 bg-amber-light p-5 sm:p-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
            Notes
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink whitespace-pre-line">
            {String(booking.notes).trim()}
          </p>
        </section>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        From the Elders Quorum ministering calendar
      </p>
    </div>
  );
}
