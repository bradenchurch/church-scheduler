import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authedFetch } from '../lib/api';
import SectionLabel from '../components/SectionLabel';

export default function Admin() {
  const [leaders, setLeaders] = useState([]);
  const [companionships, setCompanionships] = useState([]);
  const [newComp, setNewComp] = useState({ companion1_name: '', companion2_name: '', leader_id: '' });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [qrTarget, setQrTarget] = useState('');
  const [welcomeLinks, setWelcomeLinks] = useState([]);
  const [copiedLeaderId, setCopiedLeaderId] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [addAdminError, setAddAdminError] = useState('');
  const [addAdminMessage, setAddAdminMessage] = useState('');
  const { token } = useAuth();

  const uniqueLeaders = Array.from(new Map((leaders || []).map(l => [l.id, l])).values());
  const admins = uniqueLeaders.filter((l) => l.role === 'admin');

  useEffect(() => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    authedFetch('/api/leaders').then(r => r.json()).then(setLeaders).catch(() => []);
    fetch('/api/companionships', { headers }).then(r => r.json()).then(setCompanionships).catch(() => []);
    authedFetch('/api/admin/welcome-links').then(r => r.json()).then(d => setWelcomeLinks(d?.leaders || [])).catch(() => []);
    // Resolve the canonical QR target from the server so the slug is never hardcoded client-side.
    fetch('/api/ward').then(r => r.json()).then(d => { if (d?.ok) setQrTarget(d.qrUrl); }).catch(() => {});
  }, [token]);

  const copyWelcomeText = async (leader) => {
    try {
      await navigator.clipboard.writeText(leader.sms_text);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — degrade silently.
    }
    setCopiedLeaderId(leader.id);
    window.setTimeout(() => setCopiedLeaderId(''), 2000);
  };

  const handleAddComp = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/companionships', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newComp)
    });
    if (res.ok) {
      const added = await res.json();
      setCompanionships([...companionships, added]);
      setNewComp({ companion1_name: '', companion2_name: '', leader_id: '' });
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAddingAdmin(true);
    setAddAdminError('');
    setAddAdminMessage('');
    try {
      const res = await authedFetch('/api/admin/add-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddAdminError(data?.error || 'Could not add co-admin.');
        return;
      }
      setAddAdminMessage(`${data?.leader?.email || newAdminEmail} is now an admin.`);
      setNewAdminEmail('');
      // Refresh the leaders list so the new role shows immediately.
      authedFetch('/api/leaders').then((r) => r.json()).then(setLeaders).catch(() => {});
    } catch {
      setAddAdminError('Network error adding co-admin.');
    } finally {
      setAddingAdmin(false);
    }
  };

  const generateQR = async () => {
    setQrLoading(true);
    setQrError('');
    try {
      const res = await fetch(`/api/qr/generate?target=${encodeURIComponent(qrTarget)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setQrError(data?.error || 'Failed to generate QR code');
      } else {
        setQrDataUrl(data.dataUrl);
      }
    } catch {
      setQrError('Network error generating QR code');
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <SectionLabel>Admin · Portal</SectionLabel>
        <h1 className="text-3xl font-serif font-bold text-burgundy mt-1">Admin Portal</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h3 className="text-xl font-serif font-bold text-burgundy">Presidency Welcome Links</h3>
            <p className="text-sm text-brown-light mt-1">
              One-tap text templates for Cole, Kawika, and Sean to log in and set their availability.
            </p>
          </div>
          <Link
            to="/admin/flyer"
            className="min-h-[44px] inline-flex items-center px-4 rounded-lg border-[1.5px] border-warm-border text-brown font-semibold hover:border-brown transition-colors"
          >
            Printable flyer
          </Link>
        </div>

        <div className="space-y-3">
          {welcomeLinks.map((leader) => (
            <div key={leader.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-warm-border bg-cream">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-brown">
                  {leader.name}
                  <span className="ml-2 text-xs font-normal text-brown-light">
                    {leader.role_title} · District {leader.district}
                  </span>
                </div>
                <p className="text-sm text-brown-light break-all mt-0.5">{leader.sms_text}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={leader.sms_href}
                  className="min-h-[44px] inline-flex items-center justify-center px-4 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-light transition-colors"
                >
                  Send Text
                </a>
                <button
                  onClick={() => copyWelcomeText(leader)}
                  className="min-h-[44px] inline-flex items-center justify-center px-4 rounded-lg border-[1.5px] border-warm-border text-brown text-sm font-semibold hover:border-brown transition-colors"
                >
                  {copiedLeaderId === leader.id ? 'Copied' : 'Copy Text'}
                </button>
              </div>
            </div>
          ))}
          {welcomeLinks.length === 0 && (
            <p className="text-sm text-brown-light italic">Loading welcome links…</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h3 className="text-xl font-serif font-bold text-burgundy">Admins &amp; Secretaries</h3>
            <p className="text-sm text-brown-light mt-1">
              People who can manage the ward and book on behalf of companionships.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-warm-border bg-cream">
              <span className="min-h-[44px] inline-flex items-center justify-center rounded-full bg-burgundy text-white text-xs font-bold px-3">
                Admin
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-brown">{a.name || 'Secretary'}</div>
                <div className="text-sm text-brown-light break-all">{a.email}</div>
              </div>
            </div>
          ))}
          {admins.length === 0 && (
            <p className="text-sm text-brown-light italic">No admins listed yet.</p>
          )}
        </div>

        <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="Secretary email address"
            className="min-h-[44px] flex-1 p-2 border-[1.5px] border-warm-border rounded-md w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
          />
          <button
            type="submit"
            disabled={addingAdmin}
            className="min-h-[44px] bg-burgundy text-white px-4 rounded-lg font-semibold hover:bg-burgundy-light disabled:opacity-40 transition-colors"
          >
            {addingAdmin ? 'Adding…' : '+ Add Co-Admin'}
          </button>
        </form>

        {addAdminError && <p className="text-sm rounded-lg px-3 py-2 bg-rose-light text-rose mt-3">{addAdminError}</p>}
        {addAdminMessage && <p className="text-sm rounded-lg px-3 py-2 bg-sage-light text-sage mt-3">{addAdminMessage}</p>}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-serif font-bold text-burgundy">Analytics Dashboard</h3>
            <p className="text-sm text-brown-light mt-1">
              Ward completion rate, district breakdown, and the &quot;who hasn&apos;t scheduled&quot; action list.
            </p>
          </div>
          <Link
            to="/admin/dashboard"
            className="min-h-[44px] inline-flex items-center px-4 rounded-lg bg-burgundy text-white font-semibold hover:bg-burgundy-light transition-colors"
          >
            Open analytics
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-serif font-bold text-burgundy">Availability Calendar</h3>
            <p className="text-sm text-brown-light mt-1">
              Publish date-specific windows when you&apos;re free to meet with assigned companionships.
            </p>
          </div>
          <Link
            to="/admin/availability"
            className="min-h-[44px] inline-flex items-center px-4 rounded-lg bg-burgundy text-white font-semibold hover:bg-burgundy-light transition-colors"
          >
            Open calendar
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <h3 className="text-xl font-serif font-bold mb-4 text-burgundy">Add Companionship</h3>
        <form onSubmit={handleAddComp} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Companion 1 Name" required
              value={newComp.companion1_name} onChange={e => setNewComp({...newComp, companion1_name: e.target.value})}
              className="min-h-[44px] p-2 border-[1.5px] border-warm-border rounded-md w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
            />
            <input 
              type="text" placeholder="Companion 2 Name" required
              value={newComp.companion2_name} onChange={e => setNewComp({...newComp, companion2_name: e.target.value})}
              className="min-h-[44px] p-2 border-[1.5px] border-warm-border rounded-md w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
            />
          </div>
          <div>
            <select 
              required
              value={newComp.leader_id} onChange={e => setNewComp({...newComp, leader_id: e.target.value})}
              className="min-h-[44px] p-2 border-[1.5px] border-warm-border rounded-md w-full focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all bg-white"
            >
              <option value="">Select Interviewer...</option>
              {uniqueLeaders.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="min-h-[44px] bg-burgundy text-white px-4 py-2 rounded-md font-semibold hover:bg-burgundy-light transition-colors">Add</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <h3 className="text-xl font-serif font-bold mb-4 text-burgundy">Existing Companionships</h3>
        <div className="space-y-2">
          {companionships.map(c => (
             <div key={c.id} className="p-3 border border-warm-border rounded-lg flex justify-between">
                <span className="text-ink">{c.companion1_name} & {c.companion2_name}</span>
                <span className="text-brown-light">{c.leaders?.name || c.leader_id}</span>
             </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-border">
        <h3 className="text-xl font-serif font-bold mb-2 text-burgundy">QR Code for Chapel Entry</h3>
        <p className="text-sm text-brown-light mb-4">
          Print this QR code and place it at the chapel. Elders scan it to open the public request page.
        </p>
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={generateQR}
            disabled={qrLoading}
            className="bg-burgundy text-white px-4 py-2 rounded-lg font-semibold min-h-[44px] hover:bg-burgundy-light disabled:opacity-40 transition-colors"
          >
            {qrLoading ? 'Generating…' : 'Generate QR Code'}
          </button>
          {qrError && <p className="text-rose text-sm">{qrError}</p>}
          {qrDataUrl && (
            <>
              <img src={qrDataUrl} alt="QR code for chapel entry" className="w-64 h-64 rounded border border-warm-border" />
              <div className="flex flex-col items-center gap-2">
                <a
                  href={qrDataUrl}
                  download="chapel-qr-code.png"
                  className="text-white px-4 py-2 rounded font-semibold min-h-[44px] inline-flex items-center"
                  style={{ background: '#48593D' }}
                >
                  Download PNG
                </a>
                <code className="text-xs text-brown-light break-all">{qrTarget}</code>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
