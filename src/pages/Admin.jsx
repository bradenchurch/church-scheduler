import React, { useState, useEffect } from 'react';
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
  const { token } = useAuth();

  useEffect(() => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    authedFetch('/api/leaders').then(r => r.json()).then(setLeaders).catch(() => []);
    fetch('/api/companionships', { headers }).then(r => r.json()).then(setCompanionships).catch(() => []);
    // Resolve the canonical QR target from the server so the slug is never hardcoded client-side.
    fetch('/api/ward').then(r => r.json()).then(d => { if (d?.ok) setQrTarget(d.qrUrl); }).catch(() => {});
  }, [token]);

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
              {leaders.map(l => (
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
