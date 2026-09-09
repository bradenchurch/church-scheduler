import React, { useState } from 'react';

function CalendarIcon() {
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
      className="text-burgundy"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/**
 * SubscribePanel — copy + subscribe UI for an iCal feed URL.
 *
 * Props:
 *   feedUrl    the webcal:// subscription URL
 *   title      panel heading (default "Subscribe to your calendar")
 *   description short explainer under the heading
 *   className  extra classes for the outer card
 */
export default function SubscribePanel({ feedUrl, title = 'Subscribe to your calendar', description = '', className = '' }) {
  const [copied, setCopied] = useState(false);

  if (!feedUrl) return null;

  // Google's cid= flow fetches the URL server-side and does not resolve the
  // webcal scheme — hand it an https URL instead. Apple stays on webcal://.
  const httpsFeedUrl = feedUrl.replace(/^webcal:/, 'https:');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const googleHref = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(httpsFeedUrl)}`;

  return (
    <div className={`bg-white rounded-xl border border-warm-border shadow-sm p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <CalendarIcon />
        <h2 className="text-xl font-serif font-bold text-burgundy">{title}</h2>
      </div>
      {description && <p className="text-sm text-brown-light mb-4">{description}</p>}

      <div className="rounded-lg bg-cream border border-warm-border px-4 py-3 mb-4">
        <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1.5">
          Subscription URL
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <code className="flex-1 min-w-0 break-all text-xs text-brown">{feedUrl}</code>
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[48px] w-full sm:w-auto sm:shrink-0 px-4 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-light transition-colors"
          >
            {copied ? 'Copied' : 'Copy URL'}
          </button>
        </div>
        {copied && <p className="text-xs text-sage mt-2">Subscription link copied to clipboard.</p>}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <a
          href={googleHref}
          target="_blank"
          rel="noreferrer"
          className="min-h-[48px] flex-1 inline-flex items-center justify-center px-4 rounded-lg border-[1.5px] border-burgundy text-burgundy text-sm font-semibold hover:bg-burgundy-ghost transition-colors"
        >
          Open in Google Calendar
        </a>
        <a
          href={feedUrl}
          className="min-h-[48px] flex-1 inline-flex items-center justify-center px-4 rounded-lg border-[1.5px] border-warm-border text-brown text-sm font-semibold hover:bg-cream transition-colors"
        >
          Open in Apple Calendar
        </a>
      </div>

      <div className="space-y-1.5 text-sm text-brown-light">
        <p><span className="font-semibold text-brown">Apple Calendar:</span> File → New Calendar Subscription → paste the URL</p>
        <p><span className="font-semibold text-brown">Google Calendar:</span> Settings → Add calendar → From URL → paste the URL</p>
        <p><span className="font-semibold text-brown">Outlook:</span> Add calendar → Subscribe from web → paste the URL</p>
        <p className="text-xs text-brown-light mt-2">This calendar refreshes automatically — you only add it once.</p>
      </div>
    </div>
  );
}
