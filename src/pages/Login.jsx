import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithOtp, signOut } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import SectionLabel from '../components/SectionLabel';

export default function Login() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    // In dev, assuming Vite runs on 5173 or similar, Vercel will have standard origin
    const redirectUrl = `${window.location.origin}/auth/callback`;

    const { error } = await signInWithOtp(email, redirectUrl);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(`Sign-in link sent to ${email}. Click it in your email to finish signing in (no code needed).`);
    }
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Don't flash the form while auth is still resolving
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto text-center mt-20">
        <p className="text-brown-light">Loading…</p>
      </div>
    );
  }

  // Already signed in: show state instead of the login form
  if (user) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-warm-border mt-12">
        <div className="text-center mb-6">
          <SectionLabel className="mb-2">Long Valley 2nd Ward</SectionLabel>
          <h2 className="text-xl font-serif text-burgundy">Elders Quorum Presidency</h2>
        </div>
        <p className="text-center text-brown mb-4">
          You&apos;re already signed in as <span className="font-semibold">{user.email}</span>.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="min-h-[44px] w-full bg-burgundy text-white p-2 rounded-md font-semibold hover:bg-burgundy-light transition-colors"
          >
            Continue to dashboard
          </button>
          <button
            onClick={handleSignOut}
            className="min-h-[44px] w-full border-[1.5px] border-warm-border text-brown p-2 rounded-md font-semibold hover:bg-cream transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-warm-border mt-12">
      <div className="text-center mb-6">
        <SectionLabel className="mb-2">Long Valley 2nd Ward</SectionLabel>
        <h2 className="text-xl font-serif text-burgundy">Elders Quorum Presidency</h2>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brown mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[44px] w-full p-2 border-[1.5px] border-warm-border rounded-md focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
            placeholder="your@email.com"
          />
          <p className="text-xs text-brown-light mt-1.5">
            We&apos;ll email you a sign-in link. No code needed — just click the link in your email to finish.
          </p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[44px] w-full bg-burgundy text-white p-2 rounded-md font-semibold hover:bg-burgundy-light transition-colors disabled:opacity-50"
        >
          {submitting ? 'Sending link...' : 'Send Magic Link'}
        </button>
      </form>
      {message && (
        <div className={`mt-4 p-3 rounded-lg border text-sm ${message.startsWith('Error') ? 'bg-rose-light text-rose border-rose/20' : 'bg-sage-light text-sage border-sage/20'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
