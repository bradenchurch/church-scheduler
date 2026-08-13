import React, { useState, useMemo } from 'react';
import { mockDistricts, mockTotals } from '../data/mockRoster';

const CATEGORY_LABEL = {
  family: 'Family',
  single: 'Single',
  cross_district: 'Cross-district',
};

const CATEGORY_BADGE = {
  family: 'bg-sage-light text-sage',
  single: 'bg-gold-light text-brown',
  cross_district: 'bg-burgundy-ghost text-burgundy',
};

function filterDistrict(district, categoryFilter, q) {
  return district.companionships
    .map((comp) => {
      const households = comp.households.filter((h) => {
        const catOk = categoryFilter === 'all' || h.category === categoryFilter;
        const searchOk = !q || h.name.toLowerCase().includes(q);
        return catOk && searchOk;
      });
      return { ...comp, households };
    })
    .filter((comp) => {
      const compNameMatches = !q || comp.name.toLowerCase().includes(q);
      if (q && compNameMatches) return true;
      return comp.households.length > 0;
    });
}

export default function AdminRoster() {
  const [districtFilter, setDistrictFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState({});
  const [csvNote, setCsvNote] = useState(false);

  const q = searchTerm.trim().toLowerCase();

  const visibleDistricts = useMemo(() => {
    const list = districtFilter === 'all' ? mockDistricts : mockDistricts.filter((d) => d.id === districtFilter);
    return list.map((d) => ({ ...d, companionships: filterDistrict(d, categoryFilter, q) }));
  }, [districtFilter, categoryFilter, q]);

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleExportCsv = () => setCsvNote(true);

  const selectClass =
    'min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-sm focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1">Admin · Ward roster</p>
          <h1 className="text-3xl font-serif font-bold text-burgundy">Long Valley 2nd Ward — Full Roster</h1>
          <p className="text-brown-light mt-1 max-w-xl">
            Presidency → companionships → households. Drill into a district to see who serves whom.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:bg-cream transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {csvNote && (
        <p className="text-sm text-brown-light rounded-lg border border-warm-border bg-cream px-4 py-3">
          CSV export is a stub for now — it will be implemented in Phase C.
        </p>
      )}

      {/* Totals bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-warm-border p-5">
          <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Households</p>
          <p className="text-3xl font-serif font-bold text-brown mt-1">{mockTotals.households}</p>
        </div>
        <div className="bg-white rounded-xl border border-warm-border p-5">
          <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Individuals</p>
          <p className="text-3xl font-serif font-bold text-brown mt-1">{mockTotals.individuals}</p>
        </div>
        <div className="bg-white rounded-xl border border-warm-border p-5">
          <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Companionships</p>
          <p className="text-3xl font-serif font-bold text-brown mt-1">{mockTotals.companionships}</p>
        </div>
      </div>

      {/* Toolbar: filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">District</span>
          <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className={selectClass}>
            <option value="all">All districts</option>
            {mockDistricts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.role})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">Category</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectClass}>
            <option value="all">All categories</option>
            <option value="family">Family</option>
            <option value="single">Single</option>
            <option value="cross_district">Cross-district</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 flex-1 min-w-[220px]">
          <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">Search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search households or companions…"
            className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-sm w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
          />
        </label>
      </div>

      {/* District cards */}
      <div className="space-y-4">
        {visibleDistricts.map((district) => {
          const isOpen = !!expanded[district.id];
          return (
            <div key={district.id} className="bg-white rounded-xl border border-warm-border shadow-sm overflow-hidden">
              <button
                onClick={() => toggleExpand(district.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-cream transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-bold text-burgundy text-lg">{district.name}</span>
                    <span className="text-xs italic text-brown-light">{district.role}</span>
                  </div>
                  <div className="text-sm text-brown-light mt-0.5">
                    {district.companionshipCount} companionships · {district.householdCount} households
                  </div>
                </div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-brown-light transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-warm-border px-5 py-4 space-y-3">
                  {district.companionships.length === 0 ? (
                    <p className="text-sm text-brown-light italic">No companionships match the current filters.</p>
                  ) : (
                    district.companionships.map((comp) => (
                      <div key={comp.id} className="rounded-lg border border-warm-border bg-cream p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="font-serif font-semibold text-brown">{comp.name}</span>
                          <span className="text-xs text-brown-light">{comp.households.length} household{comp.households.length === 1 ? '' : 's'}</span>
                        </div>
                        <ul className="space-y-1.5">
                          {comp.households.map((h) => (
                            <li key={h.id} className="flex items-center gap-3 text-sm text-brown">
                              <span className="flex-1">{h.name}</span>
                              <span className="text-xs text-brown-light">{h.individuals} individual{h.individuals === 1 ? '' : 's'}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORY_BADGE[h.category]}`}>
                                {CATEGORY_LABEL[h.category]}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
