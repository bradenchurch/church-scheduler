import React, { useState } from 'react';
import CompanionPicker from '../components/CompanionPicker';
import SlotPicker from '../components/SlotPicker';
import { submitChapelForm, getAvailability } from '../api/chapel';

const FAMILY_STATUSES = [
  { value: '', label: 'Select status…' },
  { value: 'visited', label: 'Visited' },
  { value: 'attempted', label: 'Attempted' },
  { value: 'no_contact', label: 'No contact' },
];

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

const STEPS = [
  { n: 1, label: 'Your name' },
  { n: 2, label: 'Presidency member' },
  { n: 3, label: 'Families visited' },
  { n: 4, label: 'Notes & submit' },
];

export default function Chapel() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [families, setFamilies] = useState([]);
  const [familyData, setFamilyData] = useState({});
  const [visitNotes, setVisitNotes] = useState('');
  const [slot, setSlot] = useState({ preferred_slot_date: '', preferred_slot_time: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSelectCompanion = (c) => {
    setSelected(c);
    setError('');
    setSlot({ preferred_slot_date: '', preferred_slot_time: '' });
    setVisitNotes('');
    setFamilyData({});
    setResult(null);

    // Load families for the selected companionship.
    fetch(`/api/families?companionship_id=${encodeURIComponent(c.companionship_id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load families'))))
      .then((d) => {
        setFamilies(d.families || []);
        const init = {};
        for (const f of d.families || []) {
          init[f.household_id] = { status: '', notes: '' };
        }
        setFamilyData(init);
      })
      .catch(() => setFamilies([]));

    // Load the assigned presidency member's availability (contact + slots).
    if (c.assigned_to) {
      getAvailability(c.assigned_to)
        .then(setAvailability)
        .catch(() => setAvailability(null));
    } else {
      setAvailability(null);
    }

    setStep(2);
  };

  const setFamilyField = (householdId, field, value) => {
    setFamilyData((prev) => ({
      ...prev,
      [householdId]: { ...(prev[householdId] || {}), [field]: value },
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const familiesVisited = families
        .filter((f) => familyData[f.household_id]?.status)
        .map((f) => ({
          household_id: f.household_id,
          head_name: f.head_name,
          status: familyData[f.household_id].status,
          notes: familyData[f.household_id].notes || null,
        }));

      const payload = {
        companionship_id: selected.companionship_id,
        companion_name: selected.companion_name,
        families_visited: familiesVisited,
        visit_notes: visitNotes.trim() || null,
        preferred_slot_date: slot.preferred_slot_date || null,
        preferred_slot_time: slot.preferred_slot_time || null,
      };

      const data = await submitChapelForm(payload);
      setResult(data);
      setStep(5);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Success screen ----
  if (step === 5 && result) {
    const pm = result.presidency_member || {};
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-xl p-8 text-center shadow-sm border border-sage bg-sage-light">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage text-white">
            <CheckIcon />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-2 text-sage">Submitted</h2>
          <p className="mb-6 text-brown">
            Thanks, {selected?.companion_name}. Your visit report is on its way to your presidency
            member.
          </p>

          <div className="rounded-lg bg-warm-white border border-warm-border p-4 text-left mb-6">
            <p className="text-xs uppercase tracking-widest text-brown-light mb-1">Assigned to</p>
            <p className="font-semibold text-burgundy">{pm.name || 'Your presidency member'}</p>
            {pm.phone && (
              <p className="mt-1 flex items-center gap-2 text-sm text-brown">
                <PhoneIcon /> {pm.phone}
              </p>
            )}
            {pm.email && (
              <p className="mt-1 flex items-center gap-2 text-sm text-brown">
                <MailIcon /> {pm.email}
              </p>
            )}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full min-h-[44px] rounded-lg bg-burgundy text-white font-semibold hover:bg-burgundy-light transition-colors"
          >
            Submit another report
          </button>
        </div>
      </div>
    );
  }

  const pm = selected?.presidency_member || {};
  const contactName = availability?.name || pm.name || 'Your presidency member';
  const contactPhone = availability?.phone || pm.phone || '';
  const contactEmail = availability?.email || pm.email || '';

  return (
    <div className="max-w-md mx-auto">
      {/* Stepper */}
      <div className="mb-6">
        <div className="flex items-center gap-1">
          {STEPS.map((s) => (
            <div key={s.n} className="flex-1 flex items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  s.n < step
                    ? 'bg-sage text-white'
                    : s.n === step
                      ? 'bg-burgundy text-white'
                      : 'bg-cream text-brown-light border border-warm-border'
                }`}
              >
                {s.n < step ? <CheckIcon /> : s.n}
              </div>
              {s.n < STEPS.length && (
                <div
                  className={`h-px flex-1 ${s.n < step ? 'bg-sage' : 'bg-warm-border'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl shadow-sm border border-warm-border bg-warm-white overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-warm-border">
          <p className="text-xs uppercase tracking-widest mb-1 text-brown-light">
            Ministering Visit Report
          </p>
          <h1 className="text-2xl font-serif font-bold text-burgundy">
            {STEPS.find((s) => s.n === step)?.label}
          </h1>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && <CompanionPicker onSelect={handleSelectCompanion} />}

          {step === 2 && selected && (
            <>
              <div className="rounded-lg bg-burgundy-ghost border border-burgundy p-4">
                <p className="text-xs uppercase tracking-widest text-burgundy-light mb-1">
                  You&apos;re assigned to
                </p>
                <p className="font-semibold text-burgundy">{contactName}</p>
                {contactPhone && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-brown">
                    <PhoneIcon /> {contactPhone}
                  </p>
                )}
                {contactEmail && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-brown">
                    <MailIcon /> {contactEmail}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-cream border border-warm-border p-4">
                <SlotPicker
                  leaderId={selected.assigned_to}
                  availability={availability}
                  value={slot}
                  onChange={setSlot}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="min-h-[44px] px-4 rounded-lg border border-warm-border text-brown font-medium hover:bg-cream transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 min-h-[44px] rounded-lg bg-burgundy text-white font-semibold hover:bg-burgundy-light transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {families.length === 0 ? (
                <p className="text-brown-light">No families are assigned to your companionship.</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-brown">
                    Mark how each visit went, and add any notes.
                  </p>
                  {families.map((f) => {
                    const fd = familyData[f.household_id] || { status: '', notes: '' };
                    return (
                      <div
                        key={f.household_id}
                        className="rounded-lg border border-warm-border bg-cream p-4 space-y-2"
                      >
                        <p className="font-semibold text-brown">{f.head_name}</p>
                        {f.address && <p className="text-sm text-brown-light">{f.address}</p>}
                        <select
                          value={fd.status}
                          onChange={(e) => setFamilyField(f.household_id, 'status', e.target.value)}
                          className="w-full min-h-[44px] rounded-lg border border-warm-border bg-warm-white px-3 text-base text-brown focus:outline-none focus:border-burgundy"
                        >
                          {FAMILY_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={fd.notes}
                          onChange={(e) => setFamilyField(f.household_id, 'notes', e.target.value)}
                          placeholder="Notes (optional)"
                          className="w-full min-h-[44px] rounded-lg border border-warm-border bg-warm-white px-3 text-base text-brown placeholder:text-brown-light focus:outline-none focus:border-burgundy"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="min-h-[44px] px-4 rounded-lg border border-warm-border text-brown font-medium hover:bg-cream transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 min-h-[44px] rounded-lg bg-burgundy text-white font-semibold hover:bg-burgundy-light transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2 text-brown">
                  Visit notes
                </label>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  rows={4}
                  placeholder="Anything your presidency member should know…"
                  className="w-full rounded-lg border border-warm-border bg-cream px-3 py-2 text-base text-brown placeholder:text-brown-light focus:outline-none focus:border-burgundy"
                />
              </div>

              {error && (
                <p className="text-sm rounded-lg px-3 py-2 bg-rose-light text-rose">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  disabled={submitting}
                  className="min-h-[44px] px-4 rounded-lg border border-warm-border text-brown font-medium hover:bg-cream transition-colors disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 min-h-[44px] rounded-lg bg-sage text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {submitting ? 'Submitting…' : 'Submit visit report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
