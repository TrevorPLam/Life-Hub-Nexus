import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lifeos/profile';

export interface AppProfile {
  name: string;
  username: string;
  avatarColor: string;
  onboarded: boolean;
}

const DEFAULT_PROFILE: AppProfile = {
  name: 'Friend',
  username: '',
  avatarColor: '#6366F1',
  onboarded: true,
};

interface AppContextValue {
  profile: AppProfile;
  updateProfile: (updates: Partial<AppProfile>) => void;
  greeting: string;
}

const AppContext = createContext<AppContextValue | null>(null);

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const base = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${base}, ${name}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AppProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setProfile(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const updateProfile = useCallback((updates: Partial<AppProfile>) => {
    setProfile(prev => {
      const u = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return u;
    });
  }, []);

  const greeting = getGreeting(profile.name);

  return (
    <AppContext.Provider value={{ profile, updateProfile, greeting }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
