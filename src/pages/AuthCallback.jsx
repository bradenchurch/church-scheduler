import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Handle the hash fragment from Supabase redirect
    const handleAuthResult = async () => {
      // Supabase client should automatically process the URL hash and set the session.
      // We just need to wait a moment for onAuthStateChange in AuthContext to pick it up,
      // or we can explicitly get the session to verify.

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setError(error.message);
      } else if (session) {
        // Redirect to home/dashboard on success
        navigate('/');
      } else {
        setError("No session found. Please try logging in again.");
      }
    };

    // Check if there's an error in the hash fragment directly
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('error')) {
      setError(hashParams.get('error_description') || hashParams.get('error'));
    } else {
      handleAuthResult();
    }

  }, [navigate]);

  return (
    <div className="max-w-md mx-auto text-center mt-20">
      {error ? (
        <div className="bg-rose-light text-rose p-4 rounded-xl border border-rose/20">
          <h2 className="font-serif font-bold text-xl">Authentication Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/login')} className="mt-4 text-burgundy hover:underline">
            Back to Login
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-serif text-burgundy">Completing login…</h2>
          <p className="text-brown-light">Please wait while we log you in.</p>
        </div>
      )}
    </div>
  );
}
