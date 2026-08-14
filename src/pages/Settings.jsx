import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [banner, setBanner] = useState(null);

  const fetchStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/google/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStatus(data);
    } catch (err) {
      console.error('Failed to fetch Google status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected === 'true') {
      setBanner({ type: 'success', text: 'Google account connected successfully.' });
    } else if (connected === 'false') {
      setBanner({ type: 'error', text: `Connection failed: ${error || 'unknown error'}` });
    }
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleConnect = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch('/api/auth/google/start', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setBanner({ type: 'error', text: data.error || 'Could not start Google sign-in.' });
        setBusy(false);
      }
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBanner({ type: 'success', text: 'Google account disconnected.' });
      } else {
        const data = await res.json();
        setBanner({ type: 'error', text: data.error || 'Could not disconnect.' });
      }
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
      fetchStatus();
    }
  };

  const handleTestInvite = async () => {
    setBusy(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/auth/google/test-invite', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({
          ok: data.calendar === 'sent' && data.email === 'sent',
          calendar: data.calendar,
          email: data.email,
        });
      } else {
        setTestResult({ ok: false, calendar: '-', email: data.error || 'failed' });
      }
    } catch (err) {
      setTestResult({ ok: false, calendar: '-', email: err.message });
    } finally {
      setBusy(false);
    }
  };

  const connected = status?.connected;
  const connectedEmail = status?.email;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-burgundy">Settings</h2>
        <p className="text-brown-light mt-1">
          Connect your Google account so calendar invites and confirmation emails are sent automatically.
        </p>
      </div>

      {banner && (
        <div
          className={`p-3 rounded-lg border text-sm ${
            banner.type === 'success'
              ? 'bg-sage-light text-sage border-sage/20'
              : 'bg-rose-light text-rose border-rose/20'
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-warm-border shadow-sm">
        <h3 className="text-lg font-serif font-semibold text-brown mb-4">Google Calendar &amp; Email</h3>

        {loading ? (
          <p className="text-brown-light">Checking connection…</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  connected ? 'bg-sage' : 'bg-gold'
                }`}
              />
              <span className="font-medium text-brown">
                {connected ? `Connected as ${connectedEmail}` : 'Not connected'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              {!connected ? (
                <button
                  onClick={handleConnect}
                  disabled={busy}
                  className="min-h-[44px] px-5 rounded-lg bg-burgundy text-white font-semibold hover:bg-burgundy-light disabled:opacity-50 transition-colors"
                >
                  {busy ? 'Connecting…' : 'Connect Google Calendar & Email'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleTestInvite}
                    disabled={busy}
                    className="min-h-[44px] px-5 rounded-lg bg-sage text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {busy ? 'Sending…' : 'Send Test Invite'}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={busy}
                    className="min-h-[44px] px-5 rounded-lg border border-warm-border text-rose font-semibold hover:bg-rose-light disabled:opacity-50 transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>

            {testResult && (
              <div className="mt-4 p-3 rounded-lg border border-warm-border bg-cream text-sm">
                <p className="font-semibold text-brown mb-1">Test result:</p>
                <p className="text-brown">
                  Calendar invite:{' '}
                  <span className={testResult.calendar === 'sent' ? 'text-sage' : 'text-rose'}>
                    {testResult.calendar}
                  </span>
                </p>
                <p className="text-brown">
                  Confirmation email:{' '}
                  <span className={testResult.email === 'sent' ? 'text-sage' : 'text-rose'}>
                    {testResult.email}
                  </span>
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {user && (
        <p className="text-sm text-brown-light">
          Signed in as <span className="font-medium text-brown">{user.email}</span>
        </p>
      )}
    </div>
  );
}
