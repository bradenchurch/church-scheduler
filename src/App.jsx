import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Book from './pages/Book';
import Leader from './pages/Leader';
import Admin from './pages/Admin';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import QREntry from './pages/QREntry';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="min-h-screen bg-cream text-stone-900 font-sans w-full">
      <header className="bg-white shadow-sm border-b border-warm-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-serif text-burgundy font-bold">EQ Scheduler</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/book" element={<Book />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Public QR entry (no auth) — elders scan a QR at the chapel */}
          <Route path="/q/:slug" element={<QREntry />} />

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
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;