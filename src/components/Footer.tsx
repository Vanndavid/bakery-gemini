import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const { settings } = useSettings();
  const visibleContacts = settings.contacts?.filter(c => c.enabled) || [];

  return (
    <footer className="bg-primary-900 text-primary-50 py-12 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-2xl font-serif font-bold mb-2">{settings.appName}</h3>
          <p className="text-primary-200">Baked fresh daily with love.</p>
        </div>
        
        {visibleContacts.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {visibleContacts.map(contact => (
              <div key={contact.id} className="flex items-center gap-2">
                {contact.type === 'phone' ? <Phone className="w-5 h-5 text-primary-300" /> : <Mail className="w-5 h-5 text-primary-300" />}
                <a 
                  href={contact.type === 'phone' ? `tel:${contact.value}` : `mailto:${contact.value}`}
                  className="hover:text-white transition-colors"
                >
                  {contact.value}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-primary-800 text-center text-sm text-primary-300">
        &copy; {new Date().getFullYear()} {settings.appName}. All rights reserved.
      </div>
    </footer>
  );
}
