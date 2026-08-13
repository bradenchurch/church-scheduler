import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

// Chapel-friendly palette (matches PR #4 design system; referenced by hex so this
// file is self-contained and does not depend on src/index.css @theme tokens).
const C = {
  cream: '#FAF7F2',
  warmWhite: '#FFFBF5',
  burgundy: '#7A2E3B',
  burgundyLight: '#A84756',
  burgundyGhost: '#F5E8EA',
  brown: '#5C4334',
  brownLight: '#8B6F5C',
  sage: '#48593D',
  sageLight: '#E8EDE3',
  gold: '#B8943E',
  goldLight: '#F7F0E0',
  rose: '#943030',
  roseLight: '#F5E8E8',
  amber: '#8A5E12',
  amberLight: '#F7EDD8',
  warmBorder: '#E6DDD4',
};

function humanizeSlug(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function QREntry() {
  const { slug } = useParams();
  const [wardName, setWardName] = useState(humanizeSlug(slug));
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  // Resolve a friendly ward name from the slug (falls back to local humanization).
  useEffect(() => {
    let active = true;
    fetch(`/api/ward/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data && data.name) setWardName(data.name);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [slug]);

  // Debounced live search against the existing companionships endpoint.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchTerm.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companionships?search=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/qr/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ward_slug: slug, companionship_id: selected.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Something went wrong. Please try again.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen.
  if (done) {
    return (
      <div className="max-w-md mx-auto">
        <div
          className="rounded-xl p-8 text-center shadow-sm"
          style={{ background: C.sageLight, border: `1px solid ${C.sage}` }}
        >
          <h2 className="text-2xl font-semibold mb-3" style={{ color: C.sage }}>
            Request Submitted
          </h2>
          <p className="mb-6" style={{ color: C.brown }}>
            Thanks! Your request is submitted. An interviewer will contact you shortly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-lg font-semibold text-white"
            style={{ background: C.sage, minHeight: '44px' }}
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div
        className="rounded-xl shadow-sm border overflow-hidden"
        style={{ background: C.warmWhite, borderColor: C.warmBorder }}
      >
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: C.warmBorder }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: C.brownLight }}>
            Ministering Interview Request
          </p>
          <h1 className="text-2xl font-semibold" style={{ color: C.burgundy }}>
            {wardName || 'Your Ward'}
          </h1>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: C.brown }}>
              Find your companionship
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter a last name…"
              autoFocus
              className="w-full rounded-lg px-4 text-base focus:outline-none focus:ring-2"
              style={{
                minHeight: '44px',
                border: `1px solid ${C.warmBorder}`,
                background: C.cream,
                color: C.brown,
              }}
              onFocus={(e) => (e.target.style.borderColor = C.burgundy)}
              onBlur={(e) => (e.target.style.borderColor = C.warmBorder)}
            />
          </div>

          {searching && (
            <p className="text-sm" style={{ color: C.brownLight }}>
              Searching…
            </p>
          )}

          {!searching && searchTerm.trim() && results.length === 0 && (
            <p className="text-sm" style={{ color: C.brownLight }}>
              No companionship found. Try a different last name.
            </p>
          )}

          {results.length > 0 && (
            <ul className="space-y-2">
              {results.map((c) => {
                const isSelected = selected?.id === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelected(c)}
                      className="w-full text-left rounded-lg px-4 py-3 transition-colors"
                      style={{
                        minHeight: '44px',
                        background: isSelected ? C.burgundyGhost : C.cream,
                        border: `1px solid ${isSelected ? C.burgundy : C.warmBorder}`,
                        color: C.brown,
                      }}
                    >
                      <span className="font-semibold block">
                        {c.companion1_name} &amp; {c.companion2_name}
                      </span>
                      <span className="text-sm" style={{ color: C.brownLight }}>
                        Interviewer: {c.leaders?.name || 'Assigned Leader'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ background: C.roseLight, color: C.rose }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="w-full rounded-lg font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: C.burgundy, minHeight: '44px' }}
          >
            {submitting ? 'Submitting…' : 'Submit Interview Request'}
          </button>

          <p className="text-xs text-center" style={{ color: C.brownLight }}>
            Requests are routed to your companionship&apos;s assigned presidency member.
          </p>
        </div>
      </div>
    </div>
  );
}
