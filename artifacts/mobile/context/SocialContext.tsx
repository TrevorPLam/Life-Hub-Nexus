import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lifeos/social';

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  liked: boolean;
  createdAt: string;
}

export interface SocialUser {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatarColor: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatarColor: string;
}

const genId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const MY_ID = 'me';

const SEED_USERS: SocialUser[] = [
  { id: 'user-1', name: 'Jordan Lee', username: 'jordanlee', bio: 'Builder. Reader. Thinker.', avatarColor: '#3B82F6', followersCount: 234, followingCount: 89, isFollowing: true },
  { id: 'user-2', name: 'Riley Park', username: 'rileypark', bio: 'Product designer | Coffee lover', avatarColor: '#F43F5E', followersCount: 512, followingCount: 103, isFollowing: true },
  { id: 'user-3', name: 'Taylor Wong', username: 'taylorwong', bio: 'Engineer @ startup. Making things.', avatarColor: '#10B981', followersCount: 178, followingCount: 67, isFollowing: false },
  { id: 'user-4', name: 'Sam Rivera', username: 'samrivera', bio: 'Investor, advisor, dad.', avatarColor: '#F97316', followersCount: 1243, followingCount: 201, isFollowing: false },
];

const now = new Date();
const SEED_POSTS: SocialPost[] = [
  { id: 'post-1', authorId: 'user-1', authorName: 'Jordan Lee', authorColor: '#3B82F6', content: 'Just finished my morning review. 3 tasks done before 9am. Starting the day with momentum is everything.', likesCount: 24, commentsCount: 3, liked: false, createdAt: new Date(now.getTime() - 1 * 3600000).toISOString() },
  { id: 'post-2', authorId: 'user-2', authorName: 'Riley Park', authorColor: '#F43F5E', content: 'Redesigned my weekly review process. Instead of reviewing tasks, I review energy. What gave me energy this week? What drained it? Game changer.', likesCount: 87, commentsCount: 12, liked: true, createdAt: new Date(now.getTime() - 3 * 3600000).toISOString() },
  { id: 'post-3', authorId: 'user-1', authorName: 'Jordan Lee', authorColor: '#3B82F6', content: 'Reading Deep Work again. Some books deserve multiple reads at different life stages.', likesCount: 41, commentsCount: 7, liked: false, createdAt: new Date(now.getTime() - 6 * 3600000).toISOString() },
  { id: 'post-4', authorId: 'user-2', authorName: 'Riley Park', authorColor: '#F43F5E', content: 'The best productivity system is the one you actually use. Shipped over every perfect system that stays in a Notion doc.', likesCount: 156, commentsCount: 23, liked: true, createdAt: new Date(now.getTime() - 24 * 3600000).toISOString() },
  { id: 'post-5', authorId: 'user-3', authorName: 'Taylor Wong', authorColor: '#10B981', content: 'Interesting thread on building second brains. The key insight: capture is worthless without retrieval. Build for retrieval from day one.', likesCount: 63, commentsCount: 9, liked: false, createdAt: new Date(now.getTime() - 36 * 3600000).toISOString() },
];

const DEFAULT_PROFILE: UserProfile = {
  id: MY_ID,
  name: 'You',
  username: 'myprofile',
  bio: 'Living intentionally.',
  avatarColor: '#6366F1',
};

interface SocialContextValue {
  posts: SocialPost[];
  suggestedUsers: SocialUser[];
  profile: UserProfile;
  loading: boolean;
  addPost: (content: string) => void;
  toggleLike: (postId: string) => void;
  followUser: (userId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  getMyPosts: () => SocialPost[];
}

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SocialUser[]>(SEED_USERS);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const data = JSON.parse(raw);
          setPosts(data.posts || SEED_POSTS);
          setSuggestedUsers(data.users || SEED_USERS);
          setProfile(data.profile || DEFAULT_PROFILE);
        } catch { setPosts(SEED_POSTS); }
      } else {
        setPosts(SEED_POSTS);
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback((p: SocialPost[], u: SocialUser[], prof: UserProfile) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ posts: p, users: u, profile: prof }));
  }, []);

  const addPost = useCallback((content: string) => {
    const newPost: SocialPost = {
      id: genId(), authorId: MY_ID, authorName: profile.name, authorColor: profile.avatarColor,
      content, likesCount: 0, commentsCount: 0, liked: false, createdAt: new Date().toISOString(),
    };
    setPosts(prev => { const u = [newPost, ...prev]; save(u, suggestedUsers, profile); return u; });
  }, [profile, suggestedUsers, save]);

  const toggleLike = useCallback((postId: string) => {
    setPosts(prev => {
      const u = prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1 } : p);
      save(u, suggestedUsers, profile);
      return u;
    });
  }, [suggestedUsers, profile, save]);

  const followUser = useCallback((userId: string) => {
    setSuggestedUsers(prev => {
      const u = prev.map(u => u.id === userId ? { ...u, isFollowing: !u.isFollowing, followersCount: u.isFollowing ? u.followersCount - 1 : u.followersCount + 1 } : u);
      save(posts, u, profile);
      return u;
    });
  }, [posts, profile, save]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => { const u = { ...prev, ...updates }; save(posts, suggestedUsers, u); return u; });
  }, [posts, suggestedUsers, save]);

  const getMyPosts = useCallback(() => posts.filter(p => p.authorId === MY_ID), [posts]);

  return (
    <SocialContext.Provider value={{ posts, suggestedUsers, profile, loading, addPost, toggleLike, followUser, updateProfile, getMyPosts }}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used within SocialProvider');
  return ctx;
}
