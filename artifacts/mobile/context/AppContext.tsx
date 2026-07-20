import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lifeos/profile';

export type PrivacyLevel = 'public' | 'friends' | 'private';

export interface ProfilePrivacy {
  bio: PrivacyLevel;
  birthday: PrivacyLevel;
  location: PrivacyLevel;
  occupation: PrivacyLevel;
  website: PrivacyLevel;
  phone: PrivacyLevel;
  email: PrivacyLevel;
  about: PrivacyLevel;
  pronouns: PrivacyLevel;
  socialLinks: PrivacyLevel;
}

export interface AppProfile {
  // Identity
  name: string;
  username: string;
  avatarColor: string;
  pronouns: string;      // e.g. "she/her", "he/him", "they/them"

  // Personal data
  bio: string;           // short tagline
  about: string;         // longer "about me" paragraph
  birthday: string;      // ISO date string e.g. "1995-08-14"
  location: string;
  occupation: string;
  website: string;
  phone: string;
  email: string;

  // Social links
  socialTwitter: string;
  socialInstagram: string;
  socialLinkedin: string;

  // Internals
  onboarded: boolean;
  privacy: ProfilePrivacy;
}

const DEFAULT_PRIVACY: ProfilePrivacy = {
  bio: 'public',
  birthday: 'friends',
  location: 'public',
  occupation: 'public',
  website: 'public',
  phone: 'private',
  email: 'private',
  about: 'public',
  pronouns: 'public',
  socialLinks: 'public',
};

const DEFAULT_PROFILE: AppProfile = {
  name: '',
  username: '',
  avatarColor: '#6366F1',
  pronouns: '',
  bio: '',
  about: '',
  birthday: '',
  location: '',
  occupation: '',
  website: '',
  phone: '',
  email: '',
  socialTwitter: '',
  socialInstagram: '',
  socialLinkedin: '',
  onboarded: false,
  privacy: DEFAULT_PRIVACY,
};

interface AppContextValue {
  profile: AppProfile;
  hydrated: boolean;  // true once AsyncStorage has been read
  updateProfile: (updates: Partial<AppProfile>) => void;
  updatePrivacy: (field: keyof ProfilePrivacy, level: PrivacyLevel) => void;
  greeting: string;
}

const AppContext = createContext<AppContextValue | null>(null);

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const base = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = name || 'Friend';
  return `${base}, ${displayName}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AppProfile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          // Merge with defaults so new fields get picked up after upgrades
          setProfile(prev => ({
            ...prev,
            ...saved,
            privacy: { ...DEFAULT_PRIVACY, ...(saved.privacy || {}) },
          }));
        } catch {}
      }
      // Mark hydrated whether or not we found saved data
      setHydrated(true);
    });
  }, []);

  const updateProfile = useCallback((updates: Partial<AppProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updatePrivacy = useCallback((field: keyof ProfilePrivacy, level: PrivacyLevel) => {
    setProfile(prev => {
      const next = { ...prev, privacy: { ...prev.privacy, [field]: level } };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const greeting = getGreeting(profile.name);

  return (
    <AppContext.Provider value={{ profile, hydrated, updateProfile, updatePrivacy, greeting }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
