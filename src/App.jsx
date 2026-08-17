import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Book from './pages/Book';
import Leader from './pages/Leader';
import Admin from './pages/Admin';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import QREntry from './pages/QREntry';
import Chapel from './pages/Chapel';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './pages/Settings';
import Nav from './components/Nav';
import Me from './pages/Me';
import AdminRoster from './pages/AdminRoster';
import AdminCompanionOverride from './pages/AdminCompanionOverride';
import AdminQueue from './pages/AdminQueue';

function App() {
  return (
    <div className="min-h-screen bg-cream text-ink font-sans w-full">
      <header className="bg-white shadow-sm border-b border-warm-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center gap-4 flex-wrap">
          <Link to="/" className="text-xl font-serif text-burgundy font-bold">
            EQ Scheduler
          </Link>
          <Nav />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book"
            element={
              <ProtectedRoute>
                <Book />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Public QR entry (no auth) — elders scan a QR at the chapel */}
          <Route path="/q/:slug" element={<QREntry />} />

          {/* Public chapel-side companion visit flow (no auth, anonymous) */}
          <Route path="/chapel" element={<Chapel />} />

          {/* Protected Routes */}
          <Route
            path="/leader"
            element={
              <ProtectedRoute requireRole="leader">
                <Leader />
              </ProtectedRoute>
            }
          />
          <Route
            path="/me"
            element={
              <ProtectedRoute requireRole="leader">
                <Me />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roster"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminRoster />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companion-override"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminCompanionOverride />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/queue"
            element={
              <ProtectedRoute requireRole="leader">
                <AdminQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
