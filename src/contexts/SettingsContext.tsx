import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface ContactInfo {
  id: string;
  type: 'phone' | 'email';
  value: string;
  enabled: boolean;
}

interface Settings {
  appName: string;
  colorScheme: 'primary' | 'rose' | 'emerald' | 'slate';
  contacts: ContactInfo[];
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => Promise<void>;
  loading: boolean;
}

const defaultSettings: Settings = {
  appName: 'The Friendly Bakers',
  colorScheme: 'primary',
  contacts: [
    { id: '1', type: 'phone', value: '(02) 1234 5678', enabled: true },
    { id: '2', type: 'email', value: 'hello@friendlybakers.com', enabled: true }
  ]
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            ...defaultSettings,
            ...data,
            contacts: data.contacts || defaultSettings.contacts
          });
        } else {
          // If no settings exist yet, we just use the default
          setSettings(defaultSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching settings:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Apply the theme class to the body
    document.body.className = `theme-${settings.colorScheme}`;
  }, [settings.colorScheme]);

  const updateSettings = async (newSettings: Settings) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
