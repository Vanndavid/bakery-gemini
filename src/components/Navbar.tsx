import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Croissant } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');

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
    <nav className="bg-amber-50 border-b border-amber-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button onClick={(e) => handleNavClick(e, 'home')} className="flex items-center gap-2">
              <Croissant className="h-8 w-8 text-amber-700" />
              <span className="font-serif text-2xl font-bold text-amber-900">Golden Crust Bakery</span>
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
                    ? 'text-amber-700 border-b-2 border-amber-700'
                    : 'text-gray-600 hover:text-amber-700'
                }`}
              >
                {link.name}
              </button>
            ))}
            <Link
              to="/admin"
              className="text-sm font-medium text-amber-700 bg-amber-100 px-4 py-2 rounded-full hover:bg-amber-200 transition-colors"
            >
              Admin
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-amber-900 hover:text-amber-700 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-amber-50 border-b border-amber-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={(e) => handleNavClick(e, link.id)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.id)
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-gray-600 hover:bg-amber-100 hover:text-amber-800'
                }`}
              >
                {link.name}
              </button>
            ))}
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-amber-700 bg-amber-100 hover:bg-amber-200"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
