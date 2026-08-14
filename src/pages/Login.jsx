import React, { useState } from 'react';
import { signInWithOtp } from '../lib/auth';
import SectionLabel from '../components/SectionLabel';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // In dev, assuming Vite runs on 5173 or similar, Vercel will have standard origin
    const redirectUrl = `${window.location.origin}/auth/callback`;

    const { error } = await signInWithOtp(email, redirectUrl);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Check your email for the magic link!');
    }
    setLoading(false);
  };

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
        </div>
        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] w-full bg-burgundy text-white p-2 rounded-md font-semibold hover:bg-burgundy-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending link...' : 'Send Magic Link'}
        </button>
      </form>
      <p className="text-xs text-brown-light text-center mt-6">
        You&apos;ll receive a sign-in link in your email. No password needed.
      </p>
      {message && (
        <div className={`mt-4 p-3 rounded-lg border text-sm ${message.startsWith('Error') ? 'bg-rose-light text-rose border-rose/20' : 'bg-sage-light text-sage border-sage/20'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
