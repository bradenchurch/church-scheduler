import React, { useState } from 'react';

// Relative time helper ("just now", "5m ago", "3h ago", "2d ago").
function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const STATUS_BADGE = {
  visited: 'bg-sage-light text-sage',
  attempted: 'bg-amber-light text-amber',
  no_contact: 'bg-rose-light text-rose',
};

const STATUS_LABEL = {
  visited: 'Visited',
  attempted: 'Attempted',
  no_contact: 'No contact',
};

// Normalize a families_visited JSONB value into an array of family rows.
function normalizeFamilies(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    // Tolerate a map-of-id -> family shape if it ever arrives.
    return Object.values(raw);
  }
  return [];
}

function familyName(f) {
  if (!f || typeof f !== 'object') return 'Family';
  return f.name || f.family_name || f.head_name || 'Family';
}

export default function RequestCard({ submission, onComplete }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const families = normalizeFamilies(submission.families_visited);
  const member = submission.assigned_presidency_member || {};
  const hasSlot = submission.preferred_slot_date || submission.preferred_slot_time;
  const isCompleted = submission.status === 'completed';

  const handleComplete = async () => {
    if (!notes.trim()) {
      setError('Add your presidency notes before marking complete.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onComplete(submission, notes.trim());
      setOpen(false);
      setNotes('');
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="bg-white rounded-xl border border-warm-border shadow-sm p-5 space-y-4">
      {/* Header: companion + district + time */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif font-bold text-burgundy text-lg">
              {submission.companion_name || 'Companionship'}
            </h3>
            <span className="text-xs font-semibold text-brown-light bg-cream border border-warm-border rounded-full px-2.5 py-0.5">
              District {submission.district_number ?? '—'}
            </span>
          </div>
          <p className="text-xs text-brown-light mt-1">
            Submitted {relativeTime(submission.submitted_at)}
          </p>
        </div>

        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage bg-sage-light rounded-full px-3 py-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Completed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber bg-amber-light rounded-full px-3 py-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Pending
          </span>
        )}
      </div>

      {/* Assigned presidency member */}
      <div className="rounded-lg bg-cream border border-warm-border px-4 py-3">
        <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1">
          Presidency member
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brown">
          <span className="font-semibold">{member.name || 'Unassigned'}</span>
          {member.phone && <span>{member.phone}</span>}
          {member.email && <a href={`mailto:${member.email}`} className="text-burgundy underline underline-offset-2">{member.email}</a>}
        </div>
      </div>

      {/* Families visited */}
      <div>
        <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-2">
          Families visited
        </p>
        {families.length === 0 ? (
          <p className="text-sm text-brown-light italic">No families recorded.</p>
        ) : (
          <ul className="space-y-2">
            {families.map((f, i) => {
              const status = f?.status || 'attempted';
              const badge = STATUS_BADGE[status] || 'bg-cream text-brown-light';
              const label = STATUS_LABEL[status] || status;
              return (
                <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-warm-border bg-warm-white px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brown">{familyName(f)}</p>
                    {f?.notes && <p className="text-xs text-brown-light mt-0.5">{f.notes}</p>}
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-1 ${badge}`}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Visit notes */}
      {submission.visit_notes && (
        <div>
          <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1">
            Visit notes
          </p>
          <p className="text-sm text-brown whitespace-pre-wrap">{submission.visit_notes}</p>
        </div>
      )}

      {/* Preferred slot */}
      {hasSlot && (
        <div className="flex items-center gap-2 text-sm text-brown">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-burgundy">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>
            Preferred slot:{' '}
            <span className="font-medium">
              {submission.preferred_slot_date || ''}
              {submission.preferred_slot_date && submission.preferred_slot_time ? ' at ' : ''}
              {submission.preferred_slot_time || ''}
            </span>
          </span>
        </div>
      )}

      {/* Completed presidency notes (read-only) */}
      {isCompleted && submission.presidency_notes && (
        <div className="rounded-lg bg-sage-light border border-sage/20 px-4 py-3">
          <p className="text-xs uppercase tracking-widest text-sage font-semibold mb-1">
            Presidency notes
          </p>
          <p className="text-sm text-brown whitespace-pre-wrap">{submission.presidency_notes}</p>
        </div>
      )}

      {/* Mark complete */}
      {!isCompleted && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              setError('');
              setOpen(true);
            }}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 rounded-lg bg-burgundy text-warm-white text-sm font-semibold hover:bg-burgundy-light transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Mark complete
          </button>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brown/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="bg-white rounded-xl border border-warm-border shadow-lg w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif font-bold text-burgundy text-xl">Mark submission complete</h3>
            <p className="text-sm text-brown-light">
              {submission.companion_name || 'Companionship'} · District {submission.district_number ?? '—'}
            </p>

            <label className="block">
              <span className="block text-xs font-semibold text-brown-light uppercase tracking-wider mb-1.5">
                Presidency notes
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Record how the visit went, follow-ups, or scheduling notes…"
                className="min-h-[44px] w-full px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-sm focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all resize-y"
              />
            </label>

            {error && (
              <p className="text-sm rounded-lg px-3 py-2 bg-rose-light text-rose">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="min-h-[44px] px-4 rounded-lg border-[1.5px] border-warm-border bg-warm-white text-brown text-sm font-semibold hover:bg-cream transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={submitting}
                className="min-h-[44px] px-5 rounded-lg bg-burgundy text-warm-white text-sm font-semibold hover:bg-burgundy-light transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
