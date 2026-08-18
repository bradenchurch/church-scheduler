import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/auth';

const desktopLinkClass = (active) =>
  `hidden sm:inline-flex min-h-[44px] px-3 rounded-lg text-sm font-medium items-center transition-colors ${
    active ? 'bg-burgundy-ghost text-burgundy font-semibold' : 'text-brown-light hover:text-burgundy'
  }`;

const mobileLinkClass = (active) =>
  `flex items-center min-h-[48px] px-4 rounded-xl text-base font-medium transition-colors ${
    active ? 'bg-burgundy-ghost text-burgundy font-semibold' : 'text-brown-light hover:text-burgundy hover:bg-cream'
  }`;

export default function Nav() {
  const { user, role } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`));

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Home', roles: ['admin', 'leader', 'member', undefined] },
    { path: '/admin/dashboard', label: 'Dashboard', roles: ['admin', 'leader'] },
    { path: '/admin/availability', label: 'Availability', roles: ['admin', 'leader'] },
    { path: '/leader', label: 'Leader View', roles: ['admin', 'leader'] },
    { path: '/admin/roster', label: 'Roster', roles: ['admin'] },
    { path: '/admin/flyer', label: 'Flyer', roles: ['admin'] },
    { path: '/admin', label: 'Admin', roles: ['admin'] },
    { path: '/me', label: 'My Page', roles: ['admin', 'leader'] },
    { path: '/admin/queue', label: 'Queue', roles: ['admin', 'leader'] },
    { path: '/admin/companion-override', label: 'Companion Override', roles: ['admin'] },
    { path: '/settings', label: 'Settings', roles: ['admin', 'leader', 'member', undefined] },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (!user && item.path !== '/login') return false;
    if (item.roles.includes(role)) return true;
    if (item.roles.includes('member') && !role) return true;
    if (item.roles.includes(undefined) && !role) return true;
    return false;
  });

  return (
    <>
      <nav className="flex items-center gap-1 flex-wrap">
        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center gap-1">
          {visibleNavItems.map(item => (
            <Link key={item.path} to={item.path} className={desktopLinkClass(isActive(item.path))}>
              {item.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={handleSignOut}
              className="hidden sm:inline-flex min-h-[44px] px-3 rounded-lg text-sm font-medium items-center transition-colors text-rose hover:underline"
            >
              Sign Out
            </button>
          ) : (
            <Link to="/login" className={desktopLinkClass(isActive('/login'))}>
              Login
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="sm:hidden flex items-center gap-2">
          {user && (
            <span className="text-xs font-semibold bg-cream px-2 py-1 rounded-full text-brown">
              {user.email?.split('@')[0]}
            </span>
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -mr-2 text-ink hover:text-burgundy focus:outline-none"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b border-warm-border flex justify-between items-center">
              <span className="font-serif font-bold text-burgundy">Elders Quorum</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-ink hover:text-burgundy focus:outline-none"
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {visibleNavItems.map(item => (
                <Link key={item.path} to={item.path} className={mobileLinkClass(isActive(item.path))}>
                  {item.label}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center min-h-[48px] px-4 rounded-xl text-base font-medium transition-colors text-rose hover:bg-rose-50"
                >
                  Sign Out
                </button>
              ) : (
                <Link to="/login" className={mobileLinkClass(isActive('/login'))}>
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
