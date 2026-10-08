import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { landingForRole, safeNextPath, upcomingWindowCount } from '../lib/postAuth';

export default function CatchAll() {
  const navigate = useNavigate();
  const { user, role, leaderId, token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const next = safeNextPath(new URLSearchParams(window.location.search).get('next'));
    if (next) {
      navigate(next, { replace: true });
      return;
    }
    let active = true;
    (async () => {
      const upcomingCount = role === 'leader' ? await upcomingWindowCount(token, leaderId) : 0;
      if (active) navigate(landingForRole({ role, upcomingCount }), { replace: true });
    })();
    return () => {
      active = false;
    };
  }, [user, role, leaderId, token, loading, navigate]);

  return (
    <div className="text-center mt-20">
      <p className="text-brown-light">Routing…</p>
    </div>
  );
}
