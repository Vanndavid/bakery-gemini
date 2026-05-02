/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';

function AppContent() {
  const { loading } = useSettings();

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          <Route path="/admin" element={null} />
          <Route path="/login" element={null} />
          <Route path="*" element={<Navbar />} />
        </Routes>
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Routes>
          <Route path="/admin" element={null} />
          <Route path="/login" element={null} />
          <Route path="*" element={<Footer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ErrorBoundary>
  );
}
