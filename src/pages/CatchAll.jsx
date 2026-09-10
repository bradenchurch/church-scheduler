import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function CatchAll() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (role === 'leader') {
      navigate('/leader', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="text-center mt-20">
      <p className="text-brown-light">Routing…</p>
    </div>
  );
}
