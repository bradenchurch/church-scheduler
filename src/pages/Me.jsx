import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authedFetch } from '../lib/api';
import { PRESIDENCY_ROLES } from '../data/mockRoster';

// Mock fallback for the current leader until /api/leaders has the real row.
const MOCK_ME = {
  name: 'Kawika Tupuola',
  roleTitle: '2nd Counselor',
  phone: '(435) 555-0123',
  email: 'kawika@example.com',
};

const roleTitleFor = (name) => PRESIDENCY_ROLES[name] || null;

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

export default function Me() {
  const { user, role, leaderId, token } = useAuth();

  const [profile, setProfile] = useState({ ...MOCK_ME });
  const [contact, setContact] = useState({ phone: MOCK_ME.phone, email: MOCK_ME.email });
  const [increment, setIncrement] = useState(15);
  const [saved, setSaved] = useState(false);
  const [blockNote, setBlockNote] = useState(false);
  const [icalToken, setIcalToken] = useState(null);
  const [copied, setCopied] = useState(false);

  // Try to resolve the real leader name/role from /api/leaders; fall back to mock.
  useEffect(() => {
    let active = true;
    authedFetch('/api/leaders')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!active || !Array.isArray(data)) return;
        const me = leaderId ? data.find((l) => l.id === leaderId) : null;
        if (me?.name) {
          const roleTitle = roleTitleFor(me.name) || (role === 'admin' ? 'Secretary' : 'Counselor');
          setProfile({ name: me.name, roleTitle, phone: me.phone || MOCK_ME.phone, email: me.email || user?.email || MOCK_ME.email });
          setContact({ phone: me.phone || MOCK_ME.phone, email: me.email || user?.email || MOCK_ME.email });
        } else if (user?.email) {
          const fallbackName = user.email.split('@')[0].replace(/[._-]/g, ' ');
          const roleTitle = role === 'admin' ? 'Secretary' : 'Counselor';
          setProfile((p) => ({ ...p, name: fallbackName, roleTitle, email: user.email }));
          setContact((c) => ({ ...c, email: user.email }));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [leaderId, role, user]);

  // Fetch the current leader's own iCal token via the auth-gated endpoint
  // (tokens are no longer returned by the public /api/leaders list).
  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch('/api/me/ical-token', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => {
        if (active) setIcalToken(d?.ical_token || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token]);

  const handleSaveContact = () => setSaved(true);

  const feedUrl = icalToken
    ? `${window.location.origin}/api/cal/${leaderId}.ics?key=${encodeURIComponent(icalToken)}`
    : '';

  const handleCopyFeedUrl = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1">
            Elders Quorum Presidency
          </p>
          <h1 className="text-3xl font-serif font-bold text-burgundy">
            {profile.name} <span className="text-brown-light font-normal text-xl">— {profile.roleTitle}</span>
          </h1>
        </div>
      </div>

      {/* Set availability */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <h2 className="text-xl font-serif font-bold mb-2 text-burgundy">Set availability</h2>
        <p className="text-sm text-brown-light mb-4">
          Choose your interview time increments. Full scheduling comes in a later phase.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-lg border border-warm-border overflow-hidden">
            <button
              onClick={() => setIncrement(15)}
              className={`min-h-[44px] px-5 text-sm font-semibold transition-colors ${
                increment === 15 ? 'bg-burgundy text-warm-white' : 'bg-warm-white text-brown hover:bg-cream'
              }`}
            >
              15 min
            </button>
            <button
              onClick={() => setIncrement(30)}
              className={`min-h-[44px] px-5 text-sm font-semibold transition-colors ${
                increment === 30 ? 'bg-burgundy text-warm-white' : 'bg-warm-white text-brown hover:bg-cream'
              }`}
            >
              30 min
            </button>
          </div>
          <button
            onClick={() => setBlockNote(true)}
            className="min-h-[44px] px-5 rounded-lg bg-burgundy text-warm-white text-sm font-semibold hover:bg-burgundy-light transition-colors"
          >
            + Block off time
          </button>
        </div>
        {blockNote && (
          <p className="text-xs text-brown-light mt-3">Block-off time is a placeholder for now.</p>
        )}
        {!blockNote && <p className="text-xs text-brown-light mt-3">Availability management is a placeholder for now.</p>}
      </div>

      {/* Connect calendar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-burgundy">Connect your calendar</h2>
          <p className="text-sm text-brown-light mt-1">
            Link Google Calendar so invites and confirmations send automatically.
          </p>
        </div>
        <Link
          to="/settings"
          className="min-h-[44px] inline-flex items-center px-5 rounded-lg border border-burgundy text-burgundy text-sm font-semibold hover:bg-burgundy-ghost transition-colors"
        >
          Connect calendar
        </Link>
      </div>

      {/* Calendar feed (iCal subscription) */}
      {icalToken && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon />
            <h2 className="text-xl font-serif font-bold text-burgundy">Calendar feed</h2>
          </div>
          <p className="text-sm text-brown-light mb-4">
            Subscribe to your interview schedule — it updates automatically as submissions are assigned.
          </p>

          <div className="rounded-lg bg-cream border border-warm-border px-4 py-3 mb-4">
            <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1.5">
              Subscription URL
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 break-all text-xs text-brown">{feedUrl}</code>
              <button
                type="button"
                onClick={handleCopyFeedUrl}
                className="min-h-[44px] shrink-0 px-4 rounded-lg bg-burgundy text-warm-white text-sm font-semibold hover:bg-burgundy-light transition-colors"
              >
                {copied ? 'Copied' : 'Copy URL'}
              </button>
            </div>
            {copied && <p className="text-xs text-sage mt-2">URL copied to clipboard.</p>}
          </div>

          <div className="space-y-1.5 text-sm text-brown-light">
            <p><span className="font-semibold text-brown">Google Calendar:</span> Settings → Add calendar → From URL → paste</p>
            <p><span className="font-semibold text-brown">Apple Calendar:</span> File → New Calendar Subscription → paste</p>
            <p><span className="font-semibold text-brown">Outlook:</span> Add calendar → Subscribe from web → paste</p>
          </div>
        </div>
      )}

      {/* Pending interview requests */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <h2 className="text-xl font-serif font-bold mb-4 text-burgundy">Pending interview requests</h2>
        <div className="rounded-lg border border-dashed border-warm-border p-6 text-center">
          <p className="text-brown-light italic">No requests yet</p>
          <p className="text-xs text-brown-light mt-1">
            Requests from companions who scan the chapel QR will appear here.
          </p>
        </div>
      </div>

      {/* Past interviews */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <h2 className="text-xl font-serif font-bold mb-4 text-burgundy">Past interviews</h2>
        <div className="rounded-lg border border-dashed border-warm-border p-6 text-center">
          <p className="text-brown-light italic">No past interviews yet</p>
        </div>
      </div>

      {/* Editable contact info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <h2 className="text-xl font-serif font-bold mb-4 text-burgundy">Contact info</h2>
        <div className="space-y-4 max-w-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brown">Phone</label>
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) => {
                setContact((c) => ({ ...c, phone: e.target.value }));
                setSaved(false);
              }}
              className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all bg-cream"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brown">Email</label>
            <input
              type="email"
              value={contact.email}
              onChange={(e) => {
                setContact((c) => ({ ...c, email: e.target.value }));
                setSaved(false);
              }}
              className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all bg-cream"
            />
          </div>
          <button
            onClick={handleSaveContact}
            className="min-h-[44px] px-5 rounded-lg bg-burgundy text-warm-white text-sm font-semibold hover:bg-burgundy-light transition-colors"
          >
            Save
          </button>
          {saved && (
            <p className="text-sm text-sage">Contact info saved (demo only — persistence lands in a later phase).</p>
          )}
        </div>
      </div>
    </div>
  );
}
