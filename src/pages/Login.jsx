import React, { useState } from 'react';
import { signInWithOtp } from '../lib/auth';

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
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-stone-200 mt-12">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-stone-300 rounded focus:ring-stone-500 focus:border-stone-500"
            placeholder="your@email.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-stone-800 text-white p-2 rounded hover:bg-stone-700 disabled:opacity-50"
        >
          {loading ? 'Sending link...' : 'Send Magic Link'}
        </button>
      </form>
      {message && (
        <div className={`mt-4 p-3 rounded text-sm ${message.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
