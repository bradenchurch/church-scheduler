import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RequestCard from '../components/RequestCard';
import QueueFilters from '../components/QueueFilters';

export default function AdminQueue() {
  const { user, role, token, loading } = useAuth();
  const [status, setStatus] = useState('pending');
  const [district, setDistrict] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = role === 'admin';

  const fetchQueue = useCallback(async () => {
    if (!token) return;
    setLoadingQueue(true);
    setError('');
    try {
      const params = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(`/api/admin/queue${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load queue');
      setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingQueue(false);
    }
  }, [token, status]);

  useEffect(() => {
    if (token) fetchQueue();
  }, [fetchQueue, token]);

  const visible = useMemo(() => {
    if (!isAdmin || district === 'all') return submissions;
    return submissions.filter((s) => String(s.district_number) === String(district));
  }, [submissions, district, isAdmin]);

  const handleComplete = async (submission, notes) => {
    const res = await fetch(`/api/admin/queue/${submission.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ presidency_notes: notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to mark complete');
    // Optimistic update, then refetch to confirm.
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submission.id
          ? { ...s, status: 'completed', presidency_notes: notes, reviewed_at: new Date().toISOString() }
          : s
      )
    );
    await fetchQueue();
  };

  if (loading) {
    return <div className="p-8 text-center text-brown-light">Loading authentication…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin' && role !== 'leader') {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-xl border border-warm-border text-center">
        <h1 className="text-2xl font-serif font-bold text-burgundy">403</h1>
        <p className="text-sm text-brown-light mt-2">You don&apos;t have access to the presidency queue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-brown-light font-semibold mb-1">
          Presidency · Queue
        </p>
        <h1 className="text-3xl font-serif font-bold text-burgundy">Chapel Visit Queue</h1>
        <p className="text-brown-light mt-1 max-w-xl">
          Review companion visit submissions routed to your district and mark them complete with your
          notes.
        </p>
      </div>

      <QueueFilters
        status={status}
        onStatusChange={setStatus}
        district={district}
        onDistrictChange={setDistrict}
        isAdmin={isAdmin}
      />

      {error && (
        <p className="text-sm rounded-lg px-4 py-3 bg-rose-light text-rose border border-rose/20">
          {error}
        </p>
      )}

      {loadingQueue ? (
        <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
          <p className="text-sm text-brown-light">Loading submissions…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-warm-border p-10 text-center">
          <p className="text-lg font-serif font-semibold text-brown">No submissions</p>
          <p className="text-sm text-brown-light mt-1">
            There are no {status === 'all' ? '' : `${status} `}submissions right now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((sub) => (
            <RequestCard key={sub.id} submission={sub} onComplete={handleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}
