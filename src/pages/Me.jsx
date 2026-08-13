import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PRESIDENCY_ROLES } from '../data/mockRoster';

// Mock fallback for the current leader until /api/leaders has the real row.
const MOCK_ME = {
  name: 'Kawika Tupuola',
  roleTitle: '2nd Counselor',
  phone: '(435) 555-0123',
  email: 'kawika@example.com',
};

const roleTitleFor = (name) => PRESIDENCY_ROLES[name] || null;

export default function Me() {
  const { user, role, leaderId } = useAuth();

  const [profile, setProfile] = useState({ ...MOCK_ME });
  const [contact, setContact] = useState({ phone: MOCK_ME.phone, email: MOCK_ME.email });
  const [increment, setIncrement] = useState(15);
  const [saved, setSaved] = useState(false);
  const [blockNote, setBlockNote] = useState(false);

  // Try to resolve the real leader name/role from /api/leaders; fall back to mock.
  useEffect(() => {
    let active = true;
    fetch('/api/leaders')
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

  const handleSaveContact = () => setSaved(true);

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
