import React from 'react';

// Semantic status badge. "booked" = success (sage), "pending" = warn (amber),
// "completed" = neutral (muted). Family visit statuses reuse the same tints.
// Matches the v1 mockup's `.badge` pattern (pill, bold, letter-spaced).
const VARIANTS = {
  booked: 'bg-sage-light text-sage',
  pending: 'bg-amber-light text-amber',
  completed: 'bg-cream text-muted border border-warm-border',
  cancelled: 'bg-rose-light text-rose',
  visited: 'bg-sage-light text-sage',
  attempted: 'bg-amber-light text-amber',
  no_contact: 'bg-rose-light text-rose',
};

export default function Badge({ status, children, className = '' }) {
  const key = String(status || '').toLowerCase();
  const variant = VARIANTS[key] || 'bg-cream text-muted border border-warm-border';
  const label = children ?? key.toUpperCase();

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${variant} ${className}`}
    >
      {label}
    </span>
  );
}
