import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="p-4 text-center">Loading authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && role !== requireRole && role !== 'admin') {
    // Admin can access anything, otherwise must match exact role
    return <div className="p-4 bg-red-100 text-red-800 text-center rounded m-4">Access Denied: Insufficient permissions</div>;
  }

  return children;
}
