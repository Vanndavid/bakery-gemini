import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Croissant } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const { settings } = useSettings();

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Menu', id: 'menu' },
    { name: 'Gallery', id: 'gallery' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(id);
      }
    }
    setIsOpen(false);
  };

  const isActive = (id: string) => {
    if (location.pathname !== '/') return false;
    return activeSection === id;
  };

  return (
    <nav className="bg-primary-50 border-b border-primary-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button onClick={(e) => handleNavClick(e, 'home')} className="flex items-center gap-2">
              <Croissant className="h-8 w-8 text-primary-700" />
              <span className="font-serif text-2xl font-bold text-primary-900">{settings.appName}</span>
            </button>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={(e) => handleNavClick(e, link.id)}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.id)
                    ? 'text-primary-700 border-b-2 border-primary-700'
                    : 'text-gray-600 hover:text-primary-700'
                }`}
              >
                {link.name}
              </button>
            ))}
            <Link
              to="/admin"
              className="text-sm font-medium text-primary-700 bg-primary-100 px-4 py-2 rounded-full hover:bg-primary-200 transition-colors"
            >
              Admin
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-primary-900 hover:text-primary-700 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-primary-50 border-b border-primary-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={(e) => handleNavClick(e, link.id)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.id)
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-gray-600 hover:bg-primary-100 hover:text-primary-800'
                }`}
              >
                {link.name}
              </button>
            ))}
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-primary-700 bg-primary-100 hover:bg-primary-200"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
