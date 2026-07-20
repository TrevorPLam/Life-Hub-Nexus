// Profile repository tests - Given/When/Then structure
import { ProfileRepository, createProfileRepository } from '../domain/profile/ProfileRepository';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('ProfileRepository', () => {
  let repository: ProfileRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = createProfileRepository();
  });

  describe('Given no stored profile', () => {
    it('When loading, Then defaults are returned', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await repository.load();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe('');
        expect(result.data.onboarded).toBe(false);
        expect(result.data.avatarColor).toBe('#6366F1');
      }
    });
  });

  describe('Given legacy valid JSON', () => {
    it('When loading, Then missing fields are migrated', async () => {
      const legacyProfile = {
        name: 'Legacy User',
        username: 'legacy',
        // Missing: avatarUri, pronouns, about, birthday, location, occupation, website, phone, email, social links
        onboarded: true,
        privacy: {
          bio: 'public',
          birthday: 'friends',
          // Missing other privacy fields
        },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(legacyProfile));

      const result = await repository.load();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Legacy User');
        expect(result.data.username).toBe('legacy');
        expect(result.data.avatarUri).toBe(''); // migrated default
        expect(result.data.pronouns).toBe(''); // migrated default
        expect(result.data.privacy.birthday).toBe('friends');
        expect(result.data.privacy.phone).toBe('private'); // migrated default
      }
    });
  });

  describe('Given malformed JSON', () => {
    it('When loading, Then a recoverable invalid-data result is returned', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid json {{{');

      const result = await repository.load();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.type).toBe('invalid-data');
      }
    });
  });

  describe('Given a storage failure', () => {
    it('When saving, Then an error result is returned', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage full'));

      const result = await repository.save({
        name: 'Test User',
        username: 'test',
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
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.type).toBe('storage-error');
      }
    });
  });

  describe('Given valid profile data', () => {
    it('When saving, Then succeeds and returns success result', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await repository.save({
        name: 'Test User',
        username: 'test',
        avatarColor: '#6366F1',
        avatarUri: '',
        pronouns: 'they/them',
        bio: 'Test bio',
        about: 'Test about',
        birthday: '1990-01-01',
        location: 'Test Location',
        occupation: 'Test Occupation',
        website: 'https://example.com',
        phone: '',
        email: 'test@example.com',
        socialTwitter: '',
        socialInstagram: '',
        socialLinkedin: '',
        onboarded: true,
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
      });

      expect(result.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@lifeos/profile',
        expect.stringContaining('"name":"Test User"')
      );
    });
  });
});
