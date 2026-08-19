import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authedFetch, downloadCsv } from '../lib/api';

// Stable fallback so derived arrays don't churn a new reference each render.
const EMPTY_ARRAY = [];

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

// Presidency role titles by district (Long Valley 2nd Ward, see ARCHITECTURE.md):
//   Cole Chollet   (District 1) — 1st Counselor
//   Kawika Tupuola (District 2) — 2nd Counselor
//   Sean Bryan     (District 3) — President
const DISTRICT_ROLE = {
  1: '1st Counselor',
  2: '2nd Counselor',
  3: 'President',
};

export default function AdminRoster() {
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [districtFilter, setDistrictFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState({});

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ companion1_name: '', companion2_name: '', leader_id: '', companion1_email: '', companion2_email: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const [importOpen, setImportOpen] = useState(false);
  const [importDrag, setImportDrag] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState(null);

  // LCR PDF importer (Option 1 — native PDF parsing, no CSV intermediate).
  const [pdfImportOpen, setPdfImportOpen] = useState(false);
  const [pdfImportDrag, setPdfImportDrag] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [pdfSaving, setPdfSaving] = useState(false);
  const [pdfResult, setPdfResult] = useState(null);

  const [leaders, setLeaders] = useState([]);

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authedFetch('/api/admin/roster');
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setRoster(data);
    } catch (err) {
      setError(err.message || 'Failed to load the roster.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const totals = roster?.totals || null;
  const districts = roster?.by_district || EMPTY_ARRAY;
  const households = roster?.households || EMPTY_ARRAY;

  const q = searchTerm.trim().toLowerCase();

  const visibleHouseholds = useMemo(() => {
    return households.filter((hh) => {
      const districtOk =
        districtFilter === 'all' || String(hh.district_number) === String(districtFilter);
      const catOk = categoryFilter === 'all' || hh.category === categoryFilter;
      const searchOk =
        !q ||
        [
          hh.head_name,
          hh.family_name,
          hh.address,
          hh.phone,
          hh.email,
          ...(hh.members || []).map((m) => `${m.first_name || ''} ${m.last_name || ''}`),
        ]
          .join(' ')
          .toLowerCase()
          .includes(q);
      return districtOk && catOk && searchOk;
    });
  }, [households, districtFilter, categoryFilter, q]);

  const visibleDistricts = useMemo(() => {
    const list =
      districtFilter === 'all'
        ? districts
        : districts.filter((d) => String(d.district_number) === String(districtFilter));
    return list.map((d) => ({
      ...d,
      households: visibleHouseholds.filter(
        (hh) => String(hh.district_number) === String(d.district_number)
      ),
    }));
  }, [districts, districtFilter, visibleHouseholds]);

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const loadLeaders = useCallback(async () => {
    try {
      const res = await authedFetch('/api/leaders');
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) {
        const uniqueLeaders = Array.from(new Map(data.map(l => [l.id, l])).values());
        setLeaders(uniqueLeaders);
      }
    } catch {
      // leave leaders empty
    }
  }, []);

  useEffect(() => {
    loadLeaders();
  }, [loadLeaders]);

  const handleExportCsv = async () => {
    try {
      await downloadCsv('/api/admin/export.csv', 'interview-progress.csv');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddSaving(true);
    setAddError('');
    setAddSuccess('');
    try {
      const res = await authedFetch('/api/companionships', {
        method: 'POST',
        body: JSON.stringify(addForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to add companionship');
      setAddSuccess(`Added ${data.companion1_name}${data.companion2_name ? ` & ${data.companion2_name}` : ''}.`);
      setAddForm({ companion1_name: '', companion2_name: '', leader_id: '', companion1_email: '', companion2_email: '' });
      await loadRoster();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddSaving(false);
    }
  };

  const handleImportFile = async (file) => {
    if (!file) return;
    setImportSaving(true);
    setImportError('');
    setImportResult(null);
    try {
      const text = await file.text();
      const res = await authedFetch('/api/admin/import-roster', {
        method: 'POST',
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Import failed');
      setImportResult(data);
      await loadRoster();
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportSaving(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setImportDrag(false);
    handleImportFile(e.dataTransfer?.files?.[0]);
  };

  const onFileSelect = (e) => {
    handleImportFile(e.target?.files?.[0]);
    e.target.value = '';
  };

  // --- LCR PDF importer (Option 1) -----------------------------------------
  // Drag-and-drop or click-to-browse a raw LCR Ministering Assignments.pdf.
  // We POST the raw PDF bytes to /api/admin/roster/parse-pdf (the server uses
  // pdf-parse to reconstruct the stacked-cell layout) and render a preview
  // the user can verify before committing. The CSV importer above remains
  // available for users who already have a CSV; this is the *preferred*
  // path because it never has to round-trip through a row-shifting tool.
  const handlePdfFile = async (file) => {
    if (!file) return;
    if (file.type && !/pdf/i.test(file.type)) {
      setPdfError('Please drop a PDF file (Church LCR Ministering Assignments export).');
      return;
    }
    setPdfParsing(true);
    setPdfError('');
    setPdfResult(null);
    setPdfPreview(null);
    try {
      const res = await authedFetch('/api/admin/roster/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Parse failed (${res.status})`);
      setPdfPreview(data);
    } catch (err) {
      setPdfError(err.message);
    } finally {
      setPdfParsing(false);
    }
  };

  const onPdfDrop = (e) => {
    e.preventDefault();
    setPdfImportDrag(false);
    handlePdfFile(e.dataTransfer?.files?.[0]);
  };

  const onPdfFileSelect = (e) => {
    handlePdfFile(e.target?.files?.[0]);
    e.target.value = '';
  };

  const confirmPdfImport = async () => {
    if (!pdfPreview) return;
    setPdfSaving(true);
    setPdfError('');
    try {
      const res = await authedFetch('/api/admin/roster/import', {
        method: 'POST',
        body: JSON.stringify({ districts: pdfPreview.districts }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Import failed (${res.status})`);
      setPdfResult(data);
      await loadRoster();
    } catch (err) {
      setPdfError(err.message);
    } finally {
      setPdfSaving(false);
    }
  };

  const resetPdfImporter = () => {
    setPdfPreview(null);
    setPdfError('');
    setPdfResult(null);
  };

  const closePdfImporter = () => {
    setPdfImportOpen(false);
    resetPdfImporter();
  };

  const selectClass =
    'min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-sm focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all';

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
        <p className="text-sm text-brown-light">Loading roster…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
        <p className="text-lg font-serif font-semibold text-rose">Couldn&apos;t load the roster</p>
        <p className="text-sm text-brown-light mt-2">{error}</p>
        <button
          onClick={loadRoster}
          className="mt-4 min-h-[44px] inline-flex items-center gap-2 px-5 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:bg-cream transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (districts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
        <p className="text-lg font-serif font-semibold text-brown">No roster data</p>
        <p className="text-sm text-brown-light mt-1">The roster is empty right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1">Admin · Ward roster</p>
          <h1 className="text-3xl font-serif font-bold text-burgundy">Long Valley 2nd Ward — Full Roster</h1>
          <p className="text-brown-light mt-1 max-w-xl">
            Presidency → districts → households. Drill into a district to see who serves whom.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:bg-cream transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:bg-cream transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import CSV
          </button>
          <button
            onClick={() => setPdfImportOpen(true)}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-lg bg-cream border-[1.5px] border-burgundy/30 text-burgundy text-sm font-semibold hover:bg-burgundy-ghost transition-colors"
            title="Drop the raw LCR Ministering Assignments.pdf export directly — no CSV conversion needed."
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Import LCR PDF
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-light transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Companionship
          </button>
        </div>
      </div>

      {/* Totals bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-warm-border p-5">
          <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Households</p>
          <p className="text-3xl font-serif font-bold text-brown mt-1">{totals?.households ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-warm-border p-5">
          <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Members</p>
          <p className="text-3xl font-serif font-bold text-brown mt-1">{totals?.members ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-warm-border p-5">
          <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Companionships</p>
          <p className="text-3xl font-serif font-bold text-brown mt-1">{totals?.companionships ?? '—'}</p>
        </div>
      </div>

      {/* Toolbar: filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">District</span>
          <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className={selectClass}>
            <option value="all">All districts</option>
            {districts.map((d) => (
              <option key={d.district_number} value={d.district_number}>
                {d.presidency_member?.name || `District ${d.district_number}`} ({DISTRICT_ROLE[d.district_number] || 'Presidency'})
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
            placeholder="Search households or members…"
            className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-sm w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
          />
        </label>
      </div>

      {/* District cards */}
      <div className="space-y-4">
        {visibleDistricts.map((district) => {
          const isOpen = !!expanded[district.district_number];
          return (
            <div key={district.district_number} className="bg-white rounded-xl border border-warm-border shadow-sm overflow-hidden">
              <button
                onClick={() => toggleExpand(district.district_number)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-cream transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-bold text-burgundy text-lg">
                      {district.presidency_member?.name || `District ${district.district_number}`}
                    </span>
                    <span className="text-xs italic text-brown-light">
                      {DISTRICT_ROLE[district.district_number] || 'Presidency'}
                    </span>
                  </div>
                  <div className="text-sm text-brown-light mt-0.5">
                    {district.companionships_count} companionships · {district.households_count} households
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
                  {district.households.length === 0 ? (
                    <p className="text-sm text-brown-light italic">No households match the current filters.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {district.households.map((hh) => {
                        const individuals = (hh.members || []).length + 1;
                        return (
                          <li key={hh.household_id} className="flex items-center gap-3 text-sm text-brown">
                            <span className="flex-1">{hh.head_name || hh.family_name || hh.household_id}</span>
                            <span className="text-xs text-brown-light">
                              {individuals} individual{individuals === 1 ? '' : 's'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORY_BADGE[hh.category] || 'bg-cream text-brown-light'}`}>
                              {CATEGORY_LABEL[hh.category] || hh.category}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Companionship modal */}
      {addOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/40" onClick={() => setAddOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-warm-border p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-burgundy">Add Companionship</h2>
              <button onClick={() => setAddOpen(false)} aria-label="Close" className="text-brown-light hover:text-rose transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Companion 1 Name" required value={addForm.companion1_name} onChange={(e) => setAddForm({ ...addForm, companion1_name: e.target.value })} className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all" />
                <input type="text" placeholder="Companion 2 Name" value={addForm.companion2_name} onChange={(e) => setAddForm({ ...addForm, companion2_name: e.target.value })} className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all" />
              </div>
              <select required value={addForm.leader_id} onChange={(e) => setAddForm({ ...addForm, leader_id: e.target.value })} className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md w-full bg-white focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all">
                <option value="">Select interviewer…</option>
                {leaders.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <input type="email" placeholder="Companion 1 Email (optional)" value={addForm.companion1_email} onChange={(e) => setAddForm({ ...addForm, companion1_email: e.target.value })} className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all" />
              <input type="email" placeholder="Companion 2 Email (optional)" value={addForm.companion2_email} onChange={(e) => setAddForm({ ...addForm, companion2_email: e.target.value })} className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all" />
              {addError && <p className="text-sm text-rose">{addError}</p>}
              {addSuccess && <p className="text-sm text-sage">{addSuccess}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setAddOpen(false)} className="min-h-[44px] px-4 rounded-lg border-[1.5px] border-warm-border text-brown text-sm font-semibold hover:bg-cream transition-colors">Cancel</button>
                <button type="submit" disabled={addSaving} className="min-h-[44px] px-4 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-light disabled:opacity-40 transition-colors">{addSaving ? 'Adding…' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import roster CSV modal */}
      {importOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/40" onClick={() => setImportOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-warm-border p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-serif font-bold text-burgundy">Import Roster CSV</h2>
              <button onClick={() => setImportOpen(false)} aria-label="Close" className="text-brown-light hover:text-rose transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <p className="text-sm text-brown-light mb-4">
              Drag-and-drop a ward roster CSV from the Church directory. Columns: Companion 1, Companion 2, Assigned Leader / District, Companion 1 Email, Companion 2 Email.
            </p>
            <label
              onDragOver={(e) => { e.preventDefault(); setImportDrag(true); }}
              onDragLeave={() => setImportDrag(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center gap-2 min-h-[160px] rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${importDrag ? 'border-burgundy bg-burgundy-ghost' : 'border-warm-border bg-cream'}`}
            >
              <input type="file" accept=".csv,text/csv,text/plain" onChange={onFileSelect} className="hidden" />
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-burgundy"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              <span className="text-sm font-semibold text-brown">Drop CSV here or click to browse</span>
              <span className="text-xs text-brown-light">Existing companionships are updated in place (bookings preserved).</span>
            </label>
            {importSaving && <p className="text-sm text-brown-light mt-3">Importing…</p>}
            {importError && <p className="text-sm text-rose mt-3">{importError}</p>}
            {importResult && (
              <p className="text-sm text-sage mt-3">
                Import complete — {importResult.added} added, {importResult.updated} updated ({importResult.total} total).
              </p>
            )}
          </div>
        </div>
      )}

      {/* Import LCR PDF modal (Option 1: native PDF parsing) */}
      {pdfImportOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/40" onClick={closePdfImporter}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl shadow-lg border border-warm-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-warm-border">
              <div>
                <h2 className="text-xl font-serif font-bold text-burgundy">Import LCR Ministering PDF</h2>
                <p className="text-xs text-brown-light mt-1">
                  Drop the raw <code className="bg-cream px-1.5 py-0.5 rounded text-[11px]">Ministering_Assignments.pdf</code> export from Church LCR.
                  The PDF is parsed natively — no CSV intermediate, so stacked companion cells stay intact.
                </p>
              </div>
              <button onClick={closePdfImporter} aria-label="Close" className="text-brown-light hover:text-rose transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {!pdfPreview && !pdfResult && (
                <label
                  onDragOver={(e) => { e.preventDefault(); setPdfImportDrag(true); }}
                  onDragLeave={() => setPdfImportDrag(false)}
                  onDrop={onPdfDrop}
                  className={`flex flex-col items-center justify-center gap-2 min-h-[200px] rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${pdfImportDrag ? 'border-burgundy bg-burgundy-ghost' : 'border-warm-border bg-cream'}`}
                >
                  <input type="file" accept="application/pdf,.pdf" onChange={onPdfFileSelect} className="hidden" />
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-burgundy">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-sm font-semibold text-brown">Drop the LCR PDF here or click to browse</span>
                  <span className="text-xs text-brown-light max-w-md">The parser reconstructs stacked companion cells and bulleted family lists automatically.</span>
                </label>
              )}

              {pdfParsing && (
                <div className="bg-cream rounded-lg border border-warm-border p-5 text-center">
                  <p className="text-sm font-semibold text-brown">Parsing PDF…</p>
                  <p className="text-xs text-brown-light mt-1">Reconstructing district headers, stacked companion cells, and assigned families.</p>
                </div>
              )}

              {pdfPreview && !pdfResult && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-cream rounded-lg border border-warm-border">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Ward</p>
                      <p className="text-sm font-semibold text-brown">{pdfPreview.ward_name}</p>
                    </div>
                    <div className="border-l border-warm-border pl-3">
                      <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Districts</p>
                      <p className="text-sm font-semibold text-brown">{pdfPreview.totals.districts}</p>
                    </div>
                    <div className="border-l border-warm-border pl-3">
                      <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Companionships</p>
                      <p className="text-sm font-semibold text-brown">{pdfPreview.totals.companionships}</p>
                    </div>
                    <div className="border-l border-warm-border pl-3">
                      <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Families</p>
                      <p className="text-sm font-semibold text-brown">{pdfPreview.totals.families}</p>
                    </div>
                    <div className="border-l border-warm-border pl-3">
                      <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Warnings</p>
                      <p className={`text-sm font-semibold ${pdfPreview.totals.warnings > 0 ? 'text-amber' : 'text-sage'}`}>
                        {pdfPreview.totals.warnings}
                      </p>
                    </div>
                  </div>

                  {pdfPreview.warnings?.length > 0 && (
                    <div className="bg-gold-light/30 border border-amber/40 rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brown mb-2">Parser notes (advisory — import will still proceed)</p>
                      <ul className="text-xs text-brown space-y-1 list-disc pl-5">
                        {pdfPreview.warnings.slice(0, 12).map((w, idx) => (
                          <li key={idx}>
                            <span className="font-semibold">{w.code}</span>
                            {w.district ? ` — District ${w.district}` : ''}: {w.message}
                          </li>
                        ))}
                        {pdfPreview.warnings.length > 12 && (
                          <li className="italic text-brown-light">…and {pdfPreview.warnings.length - 12} more.</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-3">
                    {pdfPreview.districts.map((d) => (
                      <div key={d.district} className="bg-white rounded-lg border border-warm-border overflow-hidden">
                        <div className="px-4 py-3 bg-cream flex items-center gap-3 border-b border-warm-border">
                          <span className="font-serif font-bold text-burgundy">District {d.district}</span>
                          <span className="text-sm text-brown-light">—</span>
                          <span className="text-sm font-semibold text-brown">{d.leader || '⚠ no supervisor detected'}</span>
                          <span className="ml-auto text-xs text-brown-light">{d.companionships.length} companionship{d.companionships.length === 1 ? '' : 's'}</span>
                        </div>
                        <ul className="divide-y divide-warm-border">
                          {d.companionships.map((c, idx) => (
                            <li key={idx} className="px-4 py-3 space-y-1.5">
                              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <span className="text-sm font-semibold text-brown">{c.companion_1.name}</span>
                                {c.companion_1.phone && <span className="text-xs text-brown-light">{c.companion_1.phone}</span>}
                                {c.companion_1.email && <span className="text-xs text-brown-light">{c.companion_1.email}</span>}
                                {c.companion_2 && (
                                  <>
                                    <span className="text-xs text-brown-light">+</span>
                                    <span className="text-sm font-semibold text-brown">{c.companion_2.name}</span>
                                    {c.companion_2.phone && <span className="text-xs text-brown-light">{c.companion_2.phone}</span>}
                                    {c.companion_2.email && <span className="text-xs text-brown-light">{c.companion_2.email}</span>}
                                  </>
                                )}
                              </div>
                              {c.warnings?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {c.warnings.map((w, widx) => (
                                    <span key={widx} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gold-light text-brown" title={w.message}>
                                      {w.code}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {c.families?.length > 0 && (
                                <details className="text-xs text-brown-light">
                                  <summary className="cursor-pointer hover:text-brown">{c.families.length} assigned famil{c.families.length === 1 ? 'y' : 'ies'}</summary>
                                  <ul className="mt-1 ml-4 list-disc space-y-0.5">
                                    {c.families.map((fam, fidx) => (
                                      <li key={fidx}>{fam}</li>
                                    ))}
                                  </ul>
                                </details>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pdfResult && (
                <div className="bg-sage-light/40 border border-sage/40 rounded-lg p-5 text-center">
                  <p className="text-base font-serif font-bold text-sage">Roster imported.</p>
                  <p className="text-sm text-brown mt-1">
                    {pdfResult.added} added, {pdfResult.updated} updated, {pdfResult.households_upserted} households,
                    {' '}{pdfResult.links_upserted} family links.
                  </p>
                  <p className="text-xs text-brown-light mt-2">Existing companionships kept their ids, so historical bookings are preserved.</p>
                </div>
              )}

              {pdfError && <p className="text-sm text-rose">{pdfError}</p>}
            </div>

            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-warm-border bg-cream">
              <button
                onClick={resetPdfImporter}
                disabled={pdfParsing || pdfSaving}
                className="min-h-[44px] px-4 rounded-lg border-[1.5px] border-warm-border text-brown text-sm font-semibold hover:bg-white disabled:opacity-40 transition-colors"
              >
                {pdfPreview ? 'Re-upload' : 'Cancel'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={closePdfImporter}
                  className="min-h-[44px] px-4 rounded-lg border-[1.5px] border-warm-border text-brown text-sm font-semibold hover:bg-white transition-colors"
                >
                  Close
                </button>
                {pdfPreview && !pdfResult && (
                  <button
                    onClick={confirmPdfImport}
                    disabled={pdfSaving}
                    className="min-h-[44px] px-5 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-light disabled:opacity-40 transition-colors"
                  >
                    {pdfSaving ? 'Importing…' : 'Confirm & Import Roster'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
