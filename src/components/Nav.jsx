import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/auth';

// Routes that render the header shell but stay logo-only (no nav): auth
// screens and public companion/chapel flows should never show app navigation.
const PUBLIC_ROUTES = ['/login', '/auth/callback', '/chapel', '/book'];
const isPublicRoute = (pathname) =>
  PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/q/');

// Main bar — every authenticated leader/admin sees these three items, so the
// header reads like a utility bar (Calendly-style), not a sitemap.
const MAIN_NAV = [
  { path: '/', label: 'Home' },
  { path: '/admin/availability', label: 'Availability' },
  { path: '/me', label: 'My Schedule' },
];

// Admin tools live behind the "Admin" trigger to keep the main bar at 3 items.
const ADMIN_NAV = [
  { path: '/admin/dashboard', label: 'Dashboard' },
  { path: '/admin/queue', label: 'Queue' },
  { path: '/admin/roster', label: 'Roster' },
  { path: '/admin/flyer', label: 'Flyer' },
  { path: '/admin/companion-override', label: 'Companion Override' },
];

const desktopLinkClass = (active) =>
  `inline-flex min-h-[44px] px-3 rounded-lg text-sm font-medium items-center transition-colors ${
    active ? 'bg-burgundy-ghost text-burgundy font-semibold' : 'text-brown-light hover:text-burgundy'
  }`;

const dropdownLinkClass = (active) =>
  `flex items-center min-h-[40px] px-4 text-sm font-medium transition-colors ${
    active ? 'bg-burgundy-ghost text-burgundy font-semibold' : 'text-brown-light hover:text-burgundy hover:bg-cream'
  }`;

const mobileLinkClass = (active) =>
  `flex items-center min-h-[48px] px-4 rounded-xl text-base font-medium transition-colors ${
    active ? 'bg-burgundy-ghost text-burgundy font-semibold' : 'text-brown-light hover:text-burgundy hover:bg-cream'
  }`;

function SectionLabel({ children }) {
  return (
    <p className="px-4 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
      {children}
    </p>
  );
}

export default function Nav() {
  const { user, role } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const adminMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  const isAdmin = role === 'admin';
  const isLeader = role === 'leader' || isAdmin;

  const isActive = (path) =>
    pathname === path || (path !== '/' && pathname.startsWith(`${path}/`));

  const adminRouteActive = ADMIN_NAV.some((item) => isActive(item.path));

  // Close every menu when the route changes (navigation, logo clicks, etc.).
  useEffect(() => {
    setDrawerOpen(false);
    setAdminOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Click-outside + Escape handling for the desktop popovers and mobile drawer.
  useEffect(() => {
    const anyOpen = drawerOpen || adminOpen || userMenuOpen;
    if (!anyOpen) return undefined;

    const handlePointerDown = (e) => {
      if (adminOpen && adminMenuRef.current && !adminMenuRef.current.contains(e.target)) {
        setAdminOpen(false);
      }
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setAdminOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen, adminOpen, userMenuOpen]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [drawerOpen]);

  const handleSignOut = async () => {
    setDrawerOpen(false);
    setAdminOpen(false);
    setUserMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  // Logged-out visitors and public flows get a logo-only header.
  if (!user || isPublicRoute(pathname)) return null;

  const initial = (user.email || '?').trim().charAt(0).toUpperCase();
  const displayName = (user.email || '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

  return (
    <>
      <nav aria-label="Main" className="flex items-center gap-1 flex-wrap">
        {/* Desktop bar */}
        <div className="hidden sm:flex items-center gap-1 flex-wrap">
          {MAIN_NAV.map((item) => {
            // Home is for every signed-in user; Availability / My Schedule
            // need a presidency role.
            if (item.path !== '/' && !isLeader) return null;
            return (
              <Link key={item.path} to={item.path} className={desktopLinkClass(isActive(item.path))}>
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <div className="relative" ref={adminMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setAdminOpen((open) => !open);
                  setUserMenuOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={adminOpen}
                className={`inline-flex items-center gap-1 min-h-[44px] px-3 rounded-lg text-sm font-medium transition-colors ${
                  adminOpen || adminRouteActive
                    ? 'bg-burgundy-ghost text-burgundy font-semibold'
                    : 'text-brown-light hover:text-burgundy'
                }`}
              >
                Admin
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`transition-transform duration-150 ${adminOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {adminOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-warm-border bg-white py-2 shadow-lg">
                  {ADMIN_NAV.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={dropdownLinkClass(isActive(item.path))}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User menu (avatar chip) */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen((open) => !open);
                setAdminOpen(false);
              }}
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
              aria-label="Account menu"
              title={user.email || 'Account'}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-burgundy-ghost text-sm font-bold text-burgundy transition-colors hover:bg-burgundy/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy"
            >
              {initial}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-warm-border bg-white py-2 shadow-lg">
                <div className="px-4 py-2">
                  {displayName && (
                    <p className="truncate text-sm font-semibold text-brown">{displayName}</p>
                  )}
                  <p className="truncate text-xs text-brown-light">{user.email}</p>
                </div>
                <div className="my-1 border-t border-warm-border" />
                <Link to="/settings" className={dropdownLinkClass(isActive('/settings'))}>
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center min-h-[40px] px-4 text-left text-sm font-medium text-rose transition-colors hover:bg-rose-light/40"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <div className="flex sm:hidden items-center">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-2 -mr-2 text-ink hover:text-burgundy focus:outline-none"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 right-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b border-warm-border flex justify-between items-center">
              <span className="font-serif text-lg font-bold text-burgundy">EQ Scheduler</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 -mr-2 text-ink hover:text-burgundy focus:outline-none"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-6">
              <SectionLabel>Main</SectionLabel>
              {MAIN_NAV.filter((item) => item.path === '/' || isLeader).map((item) => (
                <Link key={item.path} to={item.path} className={mobileLinkClass(isActive(item.path))}>
                  {item.label}
                </Link>
              ))}

              {isAdmin && (
                <>
                  <SectionLabel>Admin</SectionLabel>
                  {ADMIN_NAV.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={mobileLinkClass(isActive(item.path))}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}

              <SectionLabel>Account</SectionLabel>
              {user ? (
                <>
                  <p className="px-4 pt-0.5 pb-2 text-xs text-brown-light truncate">{user.email}</p>
                  <Link to="/settings" className={mobileLinkClass(isActive('/settings'))}>
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center min-h-[48px] px-4 rounded-xl text-left text-base font-medium text-rose transition-colors hover:bg-rose-light/50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" className={mobileLinkClass(isActive('/login'))}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
