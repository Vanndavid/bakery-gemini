/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsProvider } from './contexts/SettingsContext';

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
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
        </div>
      </Router>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
