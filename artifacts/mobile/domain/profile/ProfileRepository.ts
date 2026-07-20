// Deep module for profile persistence with anti-corruption layer
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile, updateProfile, type Profile as ApiProfile, type UpdateProfile as ApiUpdateProfile } from '@workspace/api-client-react';

const STORAGE_KEY = '@lifeos/profile';
const CURRENT_VERSION = 1;

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

export interface Profile {
  // Identity
  name: string;
  username: string;
  avatarColor: string;
  avatarUri: string;
  pronouns: string;

  // Personal data
  bio: string;
  about: string;
  birthday: string;
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

// Versioned persisted DTO - private to this module
interface PersistedProfileDTO {
  version: number;
  data: Partial<Profile>;
}

// Result types for observable failures
export type ProfileLoadResult =
  | { success: true; data: Profile }
  | { success: false; error: { type: 'invalid-data' | 'storage-error'; message: string } };

export type ProfileSaveResult =
  | { success: true }
  | { success: false; error: { type: 'storage-error'; message: string } };

// Repository interface
export interface ProfileRepository {
  load(): Promise<ProfileLoadResult>;
  save(profile: Profile): Promise<ProfileSaveResult>;
  sync(): Promise<ProfileSaveResult>; // Sync with server (local-first)
}

// Default values
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

const DEFAULT_PROFILE: Profile = {
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
  privacy: DEFAULT_PRIVACY,
};

// Migration function - private to this module
function migrateFromDTO(dto: PersistedProfileDTO): Profile {
  const partial = dto.data || {};
  
  return {
    ...DEFAULT_PROFILE,
    ...partial,
    // Ensure privacy object is complete
    privacy: {
      ...DEFAULT_PRIVACY,
      ...(partial.privacy || {}),
    },
  };
}

// AsyncStorage adapter
class AsyncStorageProfileRepository implements ProfileRepository {
  async load(): Promise<ProfileLoadResult> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (raw === null) {
        // No stored data - return defaults
        return { success: true, data: DEFAULT_PROFILE };
      }

      try {
        const parsed = JSON.parse(raw);
        
        // Handle legacy format (no version field)
        if (parsed.version === undefined) {
          // Legacy format - treat as partial profile
          const legacyDTO: PersistedProfileDTO = {
            version: 0,
            data: parsed,
          };
          return { success: true, data: migrateFromDTO(legacyDTO) };
        }
        
        // Versioned format
        const dto = parsed as PersistedProfileDTO;
        return { success: true, data: migrateFromDTO(dto) };
      } catch (parseError) {
        // JSON parse failed - invalid data
        return {
          success: false,
          error: {
            type: 'invalid-data',
            message: 'Failed to parse stored profile data',
          },
        };
      }
    } catch (error) {
      // AsyncStorage read failed
      return {
        success: false,
        error: {
          type: 'storage-error',
          message: error instanceof Error ? error.message : 'Unknown storage error',
        },
      };
    }
  }

  async save(profile: Profile): Promise<ProfileSaveResult> {
    try {
      const dto: PersistedProfileDTO = {
        version: CURRENT_VERSION,
        data: profile,
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dto));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'storage-error',
          message: error instanceof Error ? error.message : 'Unknown storage error',
        },
      };
    }
  }

  async sync(): Promise<ProfileSaveResult> {
    try {
      // Load local profile
      const localResult = await this.load();
      if (!localResult.success) {
        return { success: false, error: { type: 'storage-error', message: 'Failed to load local profile for sync' } };
      }

      const localProfile = localResult.data;

      // Convert to API format
      const apiUpdate: ApiUpdateProfile = {
        name: localProfile.name || undefined,
        username: localProfile.username || undefined,
        avatarColor: localProfile.avatarColor || undefined,
        avatarUri: localProfile.avatarUri || undefined,
        pronouns: localProfile.pronouns || undefined,
        bio: localProfile.bio || undefined,
        about: localProfile.about || undefined,
        birthday: localProfile.birthday || undefined,
        location: localProfile.location || undefined,
        occupation: localProfile.occupation || undefined,
        website: localProfile.website || undefined,
        phone: localProfile.phone || undefined,
        email: localProfile.email || undefined,
        socialTwitter: localProfile.socialTwitter || undefined,
        socialInstagram: localProfile.socialInstagram || undefined,
        socialLinkedin: localProfile.socialLinkedin || undefined,
        onboarded: localProfile.onboarded,
        privacy: localProfile.privacy,
      };

      // Sync to server (last-write-wins based on server timestamp)
      const apiProfile: ApiProfile = await updateProfile(apiUpdate);

      // Convert back to domain format (use defaults for undefined fields)
      const syncedProfile: Profile = {
        name: apiProfile.name ?? DEFAULT_PROFILE.name,
        username: apiProfile.username ?? DEFAULT_PROFILE.username,
        avatarColor: apiProfile.avatarColor ?? DEFAULT_PROFILE.avatarColor,
        avatarUri: apiProfile.avatarUri ?? DEFAULT_PROFILE.avatarUri,
        pronouns: apiProfile.pronouns ?? DEFAULT_PROFILE.pronouns,
        bio: apiProfile.bio ?? DEFAULT_PROFILE.bio,
        about: apiProfile.about ?? DEFAULT_PROFILE.about,
        birthday: apiProfile.birthday ?? DEFAULT_PROFILE.birthday,
        location: apiProfile.location ?? DEFAULT_PROFILE.location,
        occupation: apiProfile.occupation ?? DEFAULT_PROFILE.occupation,
        website: apiProfile.website ?? DEFAULT_PROFILE.website,
        phone: apiProfile.phone ?? DEFAULT_PROFILE.phone,
        email: apiProfile.email ?? DEFAULT_PROFILE.email,
        socialTwitter: apiProfile.socialTwitter ?? DEFAULT_PROFILE.socialTwitter,
        socialInstagram: apiProfile.socialInstagram ?? DEFAULT_PROFILE.socialInstagram,
        socialLinkedin: apiProfile.socialLinkedin ?? DEFAULT_PROFILE.socialLinkedin,
        onboarded: apiProfile.onboarded ?? DEFAULT_PROFILE.onboarded,
        privacy: apiProfile.privacy ?? DEFAULT_PROFILE.privacy,
      };

      // Save synced profile locally
      return await this.save(syncedProfile);
    } catch (error) {
      // Network or server error - preserve local-first behavior
      return {
        success: false,
        error: {
          type: 'storage-error',
          message: error instanceof Error ? error.message : 'Sync failed - local data preserved',
        },
      };
    }
  }
}

// Factory function
export function createProfileRepository(): ProfileRepository {
  return new AsyncStorageProfileRepository();
}
