import React, { useState, useEffect, useMemo } from 'react';

const WARD_SLUG = 'long-valley-2nd-ward';

function SearchIcon() {
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
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronIcon() {
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
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Searchable, type-ahead dropdown of every companion in the ward (flat across
 * districts). Selecting a companion invokes onSelect with:
 *   { companionship_id, companion_name, district_number, assigned_to, presidency_member }
 */
export default function CompanionPicker({ onSelect }) {
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/companions?ward=${encodeURIComponent(WARD_SLUG)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load companions');
        return r.json();
      })
      .then((data) => {
        if (!active) return;
        const flat = [];
        for (const district of data.districts || []) {
          for (const comp of district.companionships || []) {
            for (const companion of [comp.companion_1, comp.companion_2]) {
              if (!companion || !companion.name) continue;
              flat.push({
                name: companion.name,
                companionship_id: comp.id,
                companion_name: companion.name,
                district_number: district.district_number,
                assigned_to: comp.assigned_to,
                presidency_member: district.presidency_member || {},
              });
            }
          }
        }
        flat.sort((a, b) => a.name.localeCompare(b.name));
        setCompanions(flat);
      })
      .catch(() => {
        if (active) setError('Could not load the companion list. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companions;
    return companions.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, companions]);

  const handleSelect = (c) => {
    setQuery(c.name);
    setOpen(false);
    onSelect(c);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2 text-brown">Find your name</label>
      <div className="relative">
        <div className="flex items-center bg-cream border border-warm-border rounded-lg focus-within:border-burgundy">
          <span className="pl-3 text-brown-light">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Start typing your name…"
            autoFocus
            className="w-full min-h-[44px] bg-transparent px-3 py-2 text-base text-brown placeholder:text-brown-light focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle results"
            className="min-h-[44px] px-3 text-brown-light hover:text-burgundy"
          >
            <ChevronIcon />
          </button>
        </div>

        {open && (
          <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-warm-border bg-warm-white shadow-md">
            {loading && (
              <p className="px-4 py-3 text-sm text-brown-light">Loading companions…</p>
            )}
            {!loading && error && <p className="px-4 py-3 text-sm text-rose">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-brown-light">No matches. Try a different name.</p>
            )}
            {!loading &&
              !error &&
              filtered.map((c) => (
                <button
                  key={`${c.companionship_id}-${c.name}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(c);
                  }}
                  className="w-full text-left px-4 py-3 min-h-[44px] hover:bg-cream transition-colors border-b border-warm-border last:border-b-0"
                >
                  <span className="block font-semibold text-brown">{c.name}</span>
                  <span className="block text-sm text-brown-light">
                    District {c.district_number} · {c.presidency_member?.name || 'Assigned presidency member'}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
