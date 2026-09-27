import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authedFetch } from '../lib/api';

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

const selectClass =
  'min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-sm w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all';

const primaryBtn =
  'min-h-[44px] inline-flex items-center justify-center px-4 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-light transition-colors disabled:opacity-60';

const secondaryBtn =
  'min-h-[44px] inline-flex items-center justify-center px-4 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:bg-cream transition-colors disabled:opacity-60';

function districtLabel(districtNumber, leaderName) {
  if (districtNumber == null) return leaderName || 'No district';
  const who = leaderName ? ` · ${leaderName}` : '';
  return `District ${districtNumber}${who}`;
}

function companionshipOptionLabel(comp) {
  const district = comp.district_number != null ? `District ${comp.district_number} · ` : '';
  return `${district}${comp.label}`;
}

export default function AdminNeedsAssignment() {
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [section, setSection] = useState('companion');
  const [district, setDistrict] = useState('all');
  const [draft, setDraft] = useState(null);
  const [busyId, setBusyId] = useState('');

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authedFetch('/api/admin/needs-assignment');
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      setQueue(data);
    } catch (err) {
      setError(err.message || 'Failed to load the queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const inDistrict = useCallback(
    (row) => district === 'all' || String(row.district_number) === String(district),
    [district],
  );

  const solos = useMemo(() => queue?.needs_companion || [], [queue]);
  const households = useMemo(() => queue?.needs_companionship || [], [queue]);
  const intentional = useMemo(() => queue?.intentional_solos || [], [queue]);
  const visibleSolos = useMemo(() => solos.filter(inDistrict), [solos, inDistrict]);
  const visibleHouseholds = useMemo(() => households.filter(inDistrict), [households, inDistrict]);
  const visibleIntentional = useMemo(() => intentional.filter(inDistrict), [intentional, inDistrict]);

  const districtOptions = useMemo(() => {
    const nums = new Set([1, 2, 3]);
    for (const row of [...solos, ...households, ...intentional]) {
      if (row.district_number != null) nums.add(row.district_number);
    }
    return Array.from(nums).sort((a, b) => a - b);
  }, [solos, households, intentional]);

  const runAction = async (id, url, body, successText) => {
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      const res = await authedFetch(url, { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      setDraft(null);
      setNotice(successText);
      await loadQueue();
    } catch (err) {
      setError(err.message || 'Save failed.');
    } finally {
      setBusyId('');
    }
  };

  const savePartner = (solo) => {
    if (!draft || draft.id !== solo.id) return;
    if (draft.source === 'existing') {
      if (!draft.absorbId) {
        setError('Choose a companion to pair with.');
        return;
      }
      const partner = solos.find((s) => s.id === draft.absorbId);
      runAction(
        solo.id,
        `/api/admin/needs-assignment/companionships/${solo.id}/partner`,
        { absorb_companionship_id: draft.absorbId },
        `Paired ${solo.companion1_name} with ${partner?.companion1_name || 'a partner'}. Their companionship id was kept.`,
      );
      return;
    }
    const name = String(draft.name || '').trim();
    if (!name) {
      setError('Enter a partner name.');
      return;
    }
    runAction(
      solo.id,
      `/api/admin/needs-assignment/companionships/${solo.id}/partner`,
      { companion2_name: name, companion2_email: String(draft.email || '').trim() || null },
      `Added ${name} as ${solo.companion1_name}'s partner. The companionship id was kept.`,
    );
  };

  const markSolo = (solo) => {
    runAction(
      solo.id,
      `/api/admin/needs-assignment/companionships/${solo.id}/intentional-solo`,
      { intentional_solo: true },
      `${solo.companion1_name} is marked as an intentional solo and left the queue.`,
    );
  };

  const returnSolo = (solo) => {
    runAction(
      solo.id,
      `/api/admin/needs-assignment/companionships/${solo.id}/intentional-solo`,
      { intentional_solo: false },
      `${solo.companion1_name} is back in the needs-companion queue.`,
    );
  };

  const assignExisting = (household) => {
    if (!draft?.companionshipId) {
      setError('Choose a companionship.');
      return;
    }
    const comp = (queue?.companionships || []).find((c) => c.id === draft.companionshipId);
    runAction(
      household.id,
      `/api/admin/needs-assignment/households/${household.id}/assign`,
      { companionship_id: draft.companionshipId },
      `Assigned ${household.family_name || household.head_name} to ${comp?.label || 'that companionship'}.`,
    );
  };

  const createAndAssign = (household) => {
    const name = String(draft?.companion1_name || '').trim();
    if (!name) {
      setError('Enter the first companion’s name.');
      return;
    }
    runAction(
      household.id,
      `/api/admin/needs-assignment/households/${household.id}/assign`,
      {
        create: {
          companion1_name: name,
          companion2_name: String(draft.companion2_name || '').trim() || null,
          companion1_email: String(draft.companion1_email || '').trim() || null,
          companion2_email: String(draft.companion2_email || '').trim() || null,
          leader_id: draft.leader_id || null,
        },
      },
      `Created a companionship for ${name} and assigned ${household.family_name || household.head_name}.`,
    );
  };

  if (loading && !queue) {
    return (
      <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
        <p className="text-sm text-brown-light">Loading the assignment queue…</p>
      </div>
    );
  }

  if (error && !queue) {
    return (
      <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
        <p className="text-lg font-serif font-semibold text-rose">Couldn&apos;t load the queue</p>
        <p className="text-sm text-brown-light mt-2">{error}</p>
        <button type="button" onClick={loadQueue} className={`mt-4 ${secondaryBtn}`}>
          Retry
        </button>
      </div>
    );
  }

  const counts = queue?.counts || { needs_companion: 0, needs_companionship: 0, intentional_solo: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1">
            Presidency · Needs assignment
          </p>
          <h1 className="text-3xl font-serif font-bold text-burgundy">Needs assignment</h1>
          <p className="text-brown-light mt-1 max-w-xl">
            Solo companionships and households that are not linked yet. Saves go to the ward roster
            immediately. Existing companionship ids stay in place so visit history is kept.
          </p>
        </div>
        <button type="button" onClick={loadQueue} className={secondaryBtn} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setSection('companion')}
          className={`text-left bg-white rounded-xl border p-5 transition-colors ${
            section === 'companion' ? 'border-burgundy shadow-sm' : 'border-warm-border hover:border-burgundy/40'
          }`}
        >
          <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Needs companion</p>
          <p className="text-3xl font-serif font-bold text-brown mt-1">{counts.needs_companion}</p>
          <p className="text-sm text-brown-light mt-1">Companionships with no partner</p>
        </button>
        <button
          type="button"
          onClick={() => setSection('household')}
          className={`text-left bg-white rounded-xl border p-5 transition-colors ${
            section === 'household' ? 'border-burgundy shadow-sm' : 'border-warm-border hover:border-burgundy/40'
          }`}
        >
          <p className="text-xs uppercase tracking-wider text-brown-light font-semibold">Needs companionship</p>
          <p className="text-3xl font-serif font-bold text-brown mt-1">{counts.needs_companionship}</p>
          <p className="text-sm text-brown-light mt-1">Households with no assignment</p>
        </button>
      </div>

      <label className="flex flex-col gap-1 max-w-xs">
        <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">District</span>
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className={selectClass}>
          <option value="all">All districts</option>
          {districtOptions.map((n) => (
            <option key={n} value={n}>
              District {n}
            </option>
          ))}
        </select>
      </label>

      {notice && (
        <p className="text-sm rounded-lg px-4 py-3 bg-sage-light text-sage border border-sage/20">{notice}</p>
      )}
      {error && queue && (
        <p className="text-sm rounded-lg px-4 py-3 bg-rose-light text-rose border border-rose/20">{error}</p>
      )}

      {section === 'companion' ? (
        <CompanionSection
          solos={visibleSolos}
          total={solos.length}
          otherSolos={solos}
          intentional={visibleIntentional}
          draft={draft}
          setDraft={setDraft}
          busyId={busyId}
          onSavePartner={savePartner}
          onMarkSolo={markSolo}
          onReturnSolo={returnSolo}
        />
      ) : (
        <HouseholdSection
          households={visibleHouseholds}
          total={households.length}
          companionships={queue?.companionships || []}
          leaders={queue?.leaders || []}
          draft={draft}
          setDraft={setDraft}
          busyId={busyId}
          onAssign={assignExisting}
          onCreate={createAndAssign}
        />
      )}
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
      <p className="text-lg font-serif font-semibold text-brown">{title}</p>
      <p className="text-sm text-brown-light mt-1 max-w-md mx-auto">{body}</p>
    </div>
  );
}

function CompanionSection({
  solos,
  total,
  otherSolos,
  intentional,
  draft,
  setDraft,
  busyId,
  onSavePartner,
  onMarkSolo,
  onReturnSolo,
}) {
  return (
    <div className="space-y-4">
      {solos.length === 0 ? (
        <EmptyState
          title={total === 0 ? 'No companionships need a partner' : 'Nothing in this district'}
          body={
            total === 0
              ? 'Every companionship has a second companion, or is marked as an intentional solo.'
              : 'Try all districts to see the rest of the queue.'
          }
        />
      ) : (
        solos.map((solo) => (
          <article key={solo.id} className="bg-white rounded-xl border border-warm-border shadow-sm p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-serif font-bold text-burgundy">{solo.companion1_name}</h2>
                <p className="text-sm text-brown-light mt-1">
                  {districtLabel(solo.district_number, solo.leader_name)}
                  {solo.household_count > 0
                    ? ` · ${solo.household_count} ${solo.household_count === 1 ? 'family' : 'families'}`
                    : ''}
                </p>
                {solo.companion1_email && (
                  <p className="text-xs text-muted mt-1">{solo.companion1_email}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={primaryBtn}
                  disabled={Boolean(busyId)}
                  onClick={() =>
                    setDraft({
                      kind: 'partner',
                      id: solo.id,
                      source: otherSolos.some((s) => s.id !== solo.id) ? 'existing' : 'new',
                      absorbId: '',
                      name: '',
                      email: '',
                    })
                  }
                >
                  Add partner
                </button>
                <button
                  type="button"
                  className={secondaryBtn}
                  disabled={Boolean(busyId)}
                  onClick={() => setDraft({ kind: 'solo-confirm', id: solo.id })}
                >
                  Intentional solo
                </button>
              </div>
            </div>

            {draft?.kind === 'partner' && draft.id === solo.id && (
              <PartnerForm
                solo={solo}
                draft={draft}
                setDraft={setDraft}
                candidates={otherSolos.filter((s) => s.id !== solo.id)}
                busy={busyId === solo.id}
                onSave={() => onSavePartner(solo)}
              />
            )}

            {draft?.kind === 'solo-confirm' && draft.id === solo.id && (
              <div className="rounded-lg border border-warm-border bg-cream p-4 space-y-3">
                <p className="text-sm text-brown">
                  Mark {solo.companion1_name} as an intentional solo? They leave this queue. The
                  companionship id and any visit history stay the same.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={primaryBtn} disabled={busyId === solo.id} onClick={() => onMarkSolo(solo)}>
                    {busyId === solo.id ? 'Saving…' : 'Confirm solo'}
                  </button>
                  <button type="button" className={secondaryBtn} onClick={() => setDraft(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </article>
        ))
      )}

      {intentional.length > 0 && (
        <div className="bg-white rounded-xl border border-warm-border p-5 space-y-3">
          <h2 className="text-lg font-serif font-semibold text-brown">Intentional solos</h2>
          <p className="text-sm text-brown-light">
            These companionships have one companion on purpose. Return one to the queue if that changes.
          </p>
          <ul className="divide-y divide-warm-border">
            {intentional.map((solo) => (
              <li key={solo.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-brown">{solo.companion1_name}</p>
                  <p className="text-xs text-brown-light">{districtLabel(solo.district_number, solo.leader_name)}</p>
                </div>
                <button
                  type="button"
                  className={secondaryBtn}
                  disabled={Boolean(busyId)}
                  onClick={() => onReturnSolo(solo)}
                >
                  {busyId === solo.id ? 'Saving…' : 'Return to queue'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PartnerForm({ solo, draft, setDraft, candidates, busy, onSave }) {
  return (
    <form
      className="rounded-lg border border-warm-border bg-cream p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wider text-brown-light">Partner</legend>
        <label className="flex items-center gap-2 text-sm text-brown">
          <input
            type="radio"
            name={`partner-source-${solo.id}`}
            checked={draft.source === 'existing'}
            onChange={() => setDraft({ ...draft, source: 'existing' })}
            disabled={candidates.length === 0}
          />
          Pair with another solo companionship
        </label>
        <select
          className={selectClass}
          value={draft.absorbId}
          disabled={draft.source !== 'existing' || candidates.length === 0}
          onChange={(e) => setDraft({ ...draft, absorbId: e.target.value })}
        >
          <option value="">{candidates.length ? 'Select a companion' : 'No other solos'}</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companion1_name}
              {c.district_number != null ? ` · District ${c.district_number}` : ''}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-brown">
          <input
            type="radio"
            name={`partner-source-${solo.id}`}
            checked={draft.source === 'new'}
            onChange={() => setDraft({ ...draft, source: 'new' })}
          />
          Add a new name
        </label>
        <input
          className={selectClass}
          placeholder="Last, First"
          value={draft.name}
          disabled={draft.source !== 'new'}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <input
          className={selectClass}
          placeholder="Email (optional)"
          value={draft.email}
          disabled={draft.source !== 'new'}
          onChange={(e) => setDraft({ ...draft, email: e.target.value })}
        />
      </fieldset>
      <p className="text-xs text-brown-light">
        Saving updates this companionship in place. Pairing with another solo moves that
        companion&apos;s families and visit history onto this id, then removes the empty row.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryBtn} disabled={busy}>
          {busy ? 'Saving…' : 'Save partner'}
        </button>
        <button type="button" className={secondaryBtn} onClick={() => setDraft(null)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function HouseholdSection({
  households,
  total,
  companionships,
  leaders,
  draft,
  setDraft,
  busyId,
  onAssign,
  onCreate,
}) {
  if (households.length === 0) {
    return (
      <EmptyState
        title={total === 0 ? 'Every household is assigned' : 'Nothing in this district'}
        body={
          total === 0
            ? 'Each household has a companionship. New import leftovers will show up here.'
            : 'Try all districts to see households that still need a companionship.'
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {households.map((household) => {
        const options = [...companionships].sort((a, b) => {
          const aSame = a.district_number === household.district_number ? 0 : 1;
          const bSame = b.district_number === household.district_number ? 0 : 1;
          if (aSame !== bSame) return aSame - bSame;
          return a.label.localeCompare(b.label);
        });
        const openAssign = draft?.kind === 'assign' && draft.id === household.id;
        const openCreate = draft?.kind === 'create' && draft.id === household.id;
        return (
          <article key={household.id} className="bg-white rounded-xl border border-warm-border shadow-sm p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-serif font-bold text-burgundy">
                  {household.family_name || household.head_name}
                </h2>
                <p className="text-sm text-brown-light mt-1">
                  {household.head_name && household.head_name !== household.family_name
                    ? `${household.head_name} · `
                    : ''}
                  {districtLabel(household.district_number, household.leader_name)}
                </p>
                {household.category && (
                  <span
                    className={`inline-flex mt-2 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      CATEGORY_BADGE[household.category] || 'bg-cream text-muted border border-warm-border'
                    }`}
                  >
                    {CATEGORY_LABEL[household.category] || household.category}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={primaryBtn}
                  disabled={Boolean(busyId)}
                  onClick={() =>
                    setDraft({
                      kind: 'assign',
                      id: household.id,
                      companionshipId: options.find((c) => c.district_number === household.district_number)?.id || '',
                    })
                  }
                >
                  Assign companionship
                </button>
                <button
                  type="button"
                  className={secondaryBtn}
                  disabled={Boolean(busyId)}
                  onClick={() =>
                    setDraft({
                      kind: 'create',
                      id: household.id,
                      companion1_name: '',
                      companion2_name: '',
                      companion1_email: '',
                      companion2_email: '',
                      leader_id: household.leader_id || '',
                    })
                  }
                >
                  Create companionship
                </button>
              </div>
            </div>

            {openAssign && (
              <form
                className="rounded-lg border border-warm-border bg-cream p-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  onAssign(household);
                }}
              >
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brown-light">
                    Existing companionship
                  </span>
                  <select
                    className={selectClass}
                    value={draft.companionshipId}
                    onChange={(e) => setDraft({ ...draft, companionshipId: e.target.value })}
                  >
                    <option value="">Select a companionship</option>
                    {options.map((c) => (
                      <option key={c.id} value={c.id}>
                        {companionshipOptionLabel(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-xs text-brown-light">
                  This links the household to that companionship. The companionship id does not change.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className={primaryBtn} disabled={busyId === household.id}>
                    {busyId === household.id ? 'Saving…' : 'Assign'}
                  </button>
                  <button type="button" className={secondaryBtn} onClick={() => setDraft(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {openCreate && (
              <form
                className="rounded-lg border border-warm-border bg-cream p-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  onCreate(household);
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brown-light">Companion</span>
                    <input
                      className={selectClass}
                      placeholder="Last, First"
                      value={draft.companion1_name}
                      onChange={(e) => setDraft({ ...draft, companion1_name: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brown-light">
                      Partner (optional)
                    </span>
                    <input
                      className={selectClass}
                      placeholder="Last, First"
                      value={draft.companion2_name}
                      onChange={(e) => setDraft({ ...draft, companion2_name: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brown-light">Email</span>
                    <input
                      className={selectClass}
                      placeholder="Optional"
                      value={draft.companion1_email}
                      onChange={(e) => setDraft({ ...draft, companion1_email: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brown-light">
                      District leader
                    </span>
                    <select
                      className={selectClass}
                      value={draft.leader_id}
                      onChange={(e) => setDraft({ ...draft, leader_id: e.target.value })}
                    >
                      <option value="">Use the household&apos;s district</option>
                      {leaders.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                          {l.district_number != null ? ` · District ${l.district_number}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className={primaryBtn} disabled={busyId === household.id}>
                    {busyId === household.id ? 'Saving…' : 'Create and assign'}
                  </button>
                  <button type="button" className={secondaryBtn} onClick={() => setDraft(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </article>
        );
      })}
    </div>
  );
}
