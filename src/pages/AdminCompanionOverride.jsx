import React, { useCallback, useEffect, useState } from 'react';
import { authedFetch } from '../lib/api';

export default function AdminCompanionOverride() {
  const [pending, setPending] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [linked, setLinked] = useState([]);
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
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

      const sortedHouseholds = (data.households || [])
        .map((hh) => ({
          id: hh.household_id,
          name: hh.head_name || hh.family_name || hh.household_id,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setHouseholds(sortedHouseholds);
      setPending(
        (data.unlinked_companions || []).map((c) => ({ ...c, householdId: '' }))
      );
    } catch (err) {
      setError(err.message || 'Failed to load unlinked companions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setHousehold = (id, householdId) => {
    setPending((prev) => prev.map((c) => (c.id === id ? { ...c, householdId } : c)));
    setNote(null);
  };

  const handleSave = (companion) => {
    if (!companion.householdId) return;
    const household = households.find((h) => h.id === companion.householdId);
    setLinked((prev) => [...prev, { id: companion.id, name: companion.name, householdName: household?.name || 'Unknown' }]);
    setPending((prev) => prev.filter((c) => c.id !== companion.id));
    setNote({ type: 'success', text: `Linked ${companion.name} to ${household?.name || 'a household'}.` });
  };

  const selectClass =
    'min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-sm w-full max-w-md focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all';

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1">Admin · Companion override</p>
          <h1 className="text-3xl font-serif font-bold text-burgundy">Attach Unlinked Companions</h1>
        </div>
        <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
          <p className="text-sm text-brown-light">Loading unlinked companions…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1">Admin · Companion override</p>
          <h1 className="text-3xl font-serif font-bold text-burgundy">Attach Unlinked Companions</h1>
        </div>
        <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
          <p className="text-lg font-serif font-semibold text-rose">Couldn&apos;t load unlinked companions</p>
          <p className="text-sm text-brown-light mt-2">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 min-h-[44px] inline-flex items-center gap-2 px-5 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:bg-cream transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1">Admin · Companion override</p>
        <h1 className="text-3xl font-serif font-bold text-burgundy">Attach Unlinked Companions</h1>
        <p className="text-brown-light mt-1 max-w-xl">
          Companions without a household record. Pick each one&apos;s household to attach them to the right family.
        </p>
      </div>

      {note && (
        <div
          className={`px-4 py-3 rounded-lg border text-sm ${
            note.type === 'success'
              ? 'bg-sage-light text-sage border-sage/20'
              : 'bg-rose-light text-rose border-rose/20'
          }`}
        >
          {note.text}
        </div>
      )}

      <p className="text-xs text-brown-light">
        Data is live from the ward roster. Attach (Save) is demo-only — persistence lands in Phase C.
      </p>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
          <p className="text-lg font-serif font-semibold text-brown">All companions linked</p>
          <p className="text-sm text-brown-light mt-1">There are no unlinked companions right now.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-warm-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream border-b border-warm-border">
                <tr>
                  <th className="px-4 py-3 font-semibold text-brown-light uppercase tracking-wider text-xs">Companion</th>
                  <th className="px-4 py-3 font-semibold text-brown-light uppercase tracking-wider text-xs">Attach to household</th>
                  <th className="px-4 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((companion) => (
                  <tr key={companion.id} className="border-b border-warm-border/50 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-brown">
                      {companion.name}
                      {companion.district != null && (
                        <span className="block text-xs text-brown-light">District {companion.district}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={companion.householdId}
                        onChange={(e) => setHousehold(companion.id, e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Select household…</option>
                        {households.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleSave(companion)}
                        disabled={!companion.householdId}
                        className="min-h-[44px] px-4 rounded-lg bg-burgundy text-warm-white text-sm font-semibold hover:bg-burgundy-light disabled:opacity-40 transition-colors"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {linked.length > 0 && (
        <div className="bg-white rounded-xl border border-warm-border p-5">
          <h2 className="text-lg font-serif font-bold text-burgundy mb-3">Recently linked</h2>
          <ul className="space-y-1.5 text-sm text-brown">
            {linked.map((l) => (
              <li key={l.id} className="flex items-center gap-2">
                <span className="font-medium">{l.name}</span>
                <span className="text-brown-light">→</span>
                <span>{l.householdName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
