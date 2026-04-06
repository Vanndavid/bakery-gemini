import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { Menu } from './Menu';
import { Gallery } from './Gallery';
import { useSettings } from '../contexts/SettingsContext';

export function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const target = location.state?.scrollTo;
    if (target) {
      const element = document.getElementById(target);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      // Clear the state so it doesn't scroll again on re-render
      navigate('.', { replace: true, state: {} });
    }
  }, [location, navigate]);

  const scrollToSection = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-primary-50/50">
      {/* Hero Section */}
      <section id="home" className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={settings.heroImage} 
            onLoad={() => setIsLoaded(true)}
            className={`
              w-full h-full object-cover transition-opacity duration-300
              ${isLoaded ? 'opacity-80' : 'opacity-0'}
            `}
            referrerPolicy="no-referrer" 
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 drop-shadow-lg whitespace-pre-line">
            {settings.heroTitle}
          </h1>
          <p className="text-xl md:text-2xl text-primary-50 mb-10 drop-shadow-md max-w-2xl mx-auto whitespace-pre-line">
            {settings.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={(e) => scrollToSection(e, 'menu')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-full font-medium text-lg transition-colors flex items-center justify-center gap-2"
            >
              Explore Our Menu <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => scrollToSection(e, 'gallery')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-full font-medium text-lg transition-colors"
            >
              View Gallery
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6 text-primary-700">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary-900 mb-4">Premium Ingredients</h3>
            <p className="text-gray-600 leading-relaxed">
              We source only the finest organic flour, farm-fresh eggs, and rich European butter for our creations.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6 text-primary-700">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary-900 mb-4">Baked Fresh Daily</h3>
            <p className="text-gray-600 leading-relaxed">
              Our ovens start at 3 AM every morning to ensure you get the freshest, warmest baked goods possible.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6 text-primary-700">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary-900 mb-4">Custom Orders</h3>
            <p className="text-gray-600 leading-relaxed">
              From wedding cakes to corporate events, we create custom masterpieces tailored to your special occasions.
            </p>
          </div>
        </div>
      </section>

      <Menu />
      <Gallery />
    </div>
  );
}
