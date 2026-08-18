import React, { useEffect, useState } from 'react';

function humanizeSlug(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const STEPS = [
  ['Scan the QR code', 'with your phone camera.'],
  ['Select your companionship', 'from the list.'],
  ['Pick a time slot', 'that works for your interview.'],
];

function PrintIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

export default function AdminFlyer() {
  const [wardName, setWardName] = useState('Long Valley 2nd Ward');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    fetch('/api/ward')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return;
        setWardName(humanizeSlug(d.slug || 'long-valley-2nd-ward'));
        if (d.qrUrl) setQrUrl(d.qrUrl);
      })
      .catch(() => {});

    fetch('/api/qr/generate')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        if (!d || !d.ok || !d.dataUrl) {
          setError('Could not generate the QR code.');
          return;
        }
        setQrDataUrl(d.dataUrl);
      })
      .catch(() => {
        if (active) setError('Could not generate the QR code.');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Screen-only header + actions */}
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1">Admin · Bulletin flyer</p>
          <h1 className="text-3xl font-serif font-bold text-burgundy">Printable QR Flyer</h1>
          <p className="text-brown-light mt-1">Print this for the chapel foyer bulletin board.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 rounded-lg bg-burgundy text-white font-semibold hover:bg-burgundy-light transition-colors"
        >
          <PrintIcon />
          Print Flyer
        </button>
      </div>

      {error && <p className="no-print text-sm text-rose">{error}</p>}

      {/* Printable sheet */}
      <div className="flyer-sheet max-w-md mx-auto bg-white rounded-xl border border-warm-border shadow-sm p-8">
        <div className="text-center">
          <h2 className="text-2xl font-serif font-bold text-burgundy">{wardName}</h2>
          <p className="text-sm text-brown-light mt-1">Elders Quorum Ministering Interviews</p>
        </div>

        <div className="my-8 flex justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code for ${wardName}`} className="w-64 h-64" />
          ) : (
            <div className="w-64 h-64 rounded border border-warm-border bg-cream flex items-center justify-center text-brown-light text-sm">
              Loading QR…
            </div>
          )}
        </div>

        <ol className="space-y-4">
          {STEPS.map(([title, sub], i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-burgundy text-white font-serif font-bold inline-flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-brown">{title}</p>
                <p className="text-sm text-brown-light">{sub}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-center text-xs text-brown-light break-all">{qrUrl}</p>
      </div>
    </div>
  );
}
