import React from 'react';

// Uppercase letter-spaced eyebrow label — the mockup's `.section-divider` /
// `.ward` eyebrow pattern. Used to mark page context and section headers.
export default function SectionLabel({ children, className = '' }) {
  return (
    <p className={`text-xs uppercase tracking-widest text-muted ${className}`}>
      {children}
    </p>
  );
}
