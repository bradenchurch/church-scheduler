import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Admin() {
  const [leaders, setLeaders] = useState([]);
  const [companionships, setCompanionships] = useState([]);
  const [newComp, setNewComp] = useState({ companion1_name: '', companion2_name: '', leader_id: '' });
  const { token } = useAuth();

  useEffect(() => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch('/api/leaders').then(r => r.json()).then(setLeaders).catch(() => []);
    fetch('/api/companionships', { headers }).then(r => r.json()).then(setCompanionships).catch(() => []);
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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-serif font-bold text-burgundy">Admin Portal</h2>
      
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
                <span>{c.companion1_name} & {c.companion2_name}</span>
                <span className="text-stone-500">{c.leaders?.name || c.leader_id}</span>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
