import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const linkClass = (active) =>
  `min-h-[44px] px-3 rounded-lg text-sm font-medium inline-flex items-center transition-colors ${
    active ? 'bg-burgundy-ghost text-burgundy font-semibold' : 'text-brown-light hover:text-burgundy'
  }`;

export default function Nav() {
  const { user, role } = useAuth();
  const { pathname } = useLocation();

  const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="flex items-center gap-1 flex-wrap">
      <Link to="/" className={linkClass(isActive('/'))}>
        Dashboard
      </Link>

      {user && (role === 'leader' || role === 'admin') && (
        <Link to="/me" className={linkClass(isActive('/me'))}>
          My Page
        </Link>
      )}

      {(role === 'admin' || role === 'leader') && (
        <Link to="/admin/queue" className={linkClass(isActive('/admin/queue'))}>
          Queue
        </Link>
      )}

      {role === 'admin' && (
        <>
          <Link to="/admin/roster" className={linkClass(isActive('/admin/roster'))}>
            Roster
          </Link>
          <Link to="/admin/companion-override" className={linkClass(isActive('/admin/companion-override'))}>
            Companion Override
          </Link>
          <Link to="/admin" className={linkClass(pathname === '/admin')}>
            Admin
          </Link>
        </>
      )}

      {user ? (
        <Link to="/settings" className={linkClass(isActive('/settings'))}>
          Settings
        </Link>
      ) : (
        <Link to="/login" className={linkClass(isActive('/login'))}>
          Login
        </Link>
      )}
    </nav>
  );
}
