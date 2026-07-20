import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createProfileRepository, Profile, ProfilePrivacy, PrivacyLevel } from '../domain/profile/ProfileRepository';

// Re-export types for UI components
export type { PrivacyLevel, ProfilePrivacy };
export type AppProfile = Profile;

interface AppContextValue {
  profile: AppProfile;
  hydrated: boolean;  // true once repository has been read
  loadError: { type: 'invalid-data' | 'storage-error'; message: string } | null;
  saveError: { type: 'storage-error'; message: string } | null;
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
  const repository = createProfileRepository();
  const [profile, setProfile] = useState<AppProfile>(() => {
    // Initialize with defaults from repository
    // In a real app, we'd load this from the repository, but for now we use the defaults
    // that will be replaced once the repository loads
    return {
      name: '',
      username: '',
      avatarColor: '#6366F1',
      avatarUri: '',
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
      privacy: {
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
      },
    };
  });
  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState<{ type: 'invalid-data' | 'storage-error'; message: string } | null>(null);
  const [saveError, setSaveError] = useState<{ type: 'storage-error'; message: string } | null>(null);

  useEffect(() => {
    repository.load().then(result => {
      if (result.success) {
        setProfile(result.data);
        setLoadError(null);
      } else {
        setLoadError(result.error);
        // Keep defaults on load error
      }
      setHydrated(true);
    });
  }, [repository]);

  const updateProfile = useCallback((updates: Partial<AppProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      repository.save(next).then(result => {
        if (!result.success) {
          setSaveError(result.error);
        } else {
          setSaveError(null);
        }
      });
      return next;
    });
  }, [repository]);

  const updatePrivacy = useCallback((field: keyof ProfilePrivacy, level: PrivacyLevel) => {
    setProfile(prev => {
      const next = { ...prev, privacy: { ...prev.privacy, [field]: level } };
      repository.save(next).then(result => {
        if (!result.success) {
          setSaveError(result.error);
        } else {
          setSaveError(null);
        }
      });
      return next;
    });
  }, [repository]);

  const greeting = getGreeting(profile.name);

  return (
    <AppContext.Provider value={{ profile, hydrated, loadError, saveError, updateProfile, updatePrivacy, greeting }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
