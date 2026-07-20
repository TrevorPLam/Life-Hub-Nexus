// Deep module for profile persistence with anti-corruption layer
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

// Factory function
export function createProfileRepository(): ProfileRepository {
  return new AsyncStorageProfileRepository();
}
