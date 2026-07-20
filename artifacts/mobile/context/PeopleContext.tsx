import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lifeos/people';

export type InteractionType = 'call' | 'message' | 'meeting' | 'email' | 'note';

export interface Interaction {
  id: string;
  type: InteractionType;
  description: string;
  date: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string; // MM-DD format
  company: string;
  role: string;
  notes: string;
  avatarColor: string;
  interactions: Interaction[];
  linkedTaskIds: string[];
  linkedEventIds: string[];
  linkedNoteIds: string[];
  stayInTouchDays: number;
  lastInteractionDate: string;
  createdAt: string;
}

const genId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#F97316', '#10B981', '#F43F5E', '#14B8A6', '#F59E0B', '#6366F1'];

const today = new Date();
const thisMM = String(today.getMonth() + 1).padStart(2, '0');
const todayDD = String(today.getDate()).padStart(2, '0');
const tomorrowDD = String(today.getDate() + 1).padStart(2, '0');

const SEED_PEOPLE: Person[] = [
  {
    id: 'person-1',
    name: 'Alex Chen',
    email: 'alex@example.com',
    phone: '+1 (555) 234-5678',
    birthday: `${thisMM}-${tomorrowDD}`,
    company: 'Acme Corp',
    role: 'Product Manager',
    notes: 'Met at the design conference in 2023. Great product sense.',
    avatarColor: '#3B82F6',
    interactions: [
      { id: 'int-1', type: 'meeting', description: 'Coffee chat about Q4 roadmap', date: new Date(today.getTime() - 7 * 86400000).toISOString() },
      { id: 'int-2', type: 'message', description: 'Shared design resources', date: new Date(today.getTime() - 3 * 86400000).toISOString() },
    ],
    linkedTaskIds: [],
    linkedEventIds: ['event-2'],
    linkedNoteIds: [],
    stayInTouchDays: 14,
    lastInteractionDate: new Date(today.getTime() - 3 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'person-2',
    name: 'Sarah Miller',
    email: 'sarah@example.com',
    phone: '+1 (555) 345-6789',
    birthday: `04-15`,
    company: 'Stripe',
    role: 'Engineering Lead',
    notes: 'Former colleague. Expert in distributed systems.',
    avatarColor: '#F43F5E',
    interactions: [
      { id: 'int-3', type: 'call', description: 'Caught up on career moves', date: new Date(today.getTime() - 21 * 86400000).toISOString() },
    ],
    linkedTaskIds: [],
    linkedEventIds: [],
    linkedNoteIds: [],
    stayInTouchDays: 30,
    lastInteractionDate: new Date(today.getTime() - 21 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'person-3',
    name: 'Marcus Johnson',
    email: 'marcus@example.com',
    phone: '+1 (555) 456-7890',
    birthday: `07-22`,
    company: 'Self-employed',
    role: 'Designer',
    notes: 'Freelance collaborator. Amazing visual storyteller.',
    avatarColor: '#10B981',
    interactions: [
      { id: 'int-4', type: 'meeting', description: 'Design review session', date: new Date(today.getTime() - 14 * 86400000).toISOString() },
    ],
    linkedTaskIds: ['task-2'],
    linkedEventIds: [],
    linkedNoteIds: [],
    stayInTouchDays: 21,
    lastInteractionDate: new Date(today.getTime() - 14 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export { AVATAR_COLORS };

interface PeopleContextValue {
  people: Person[];
  loading: boolean;
  addPerson: (person: Omit<Person, 'id' | 'createdAt' | 'interactions'>) => Person;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  getPerson: (id: string) => Person | undefined;
  addInteraction: (personId: string, interaction: Omit<Interaction, 'id'>) => void;
  getTodayBirthdays: () => Person[];
  getOverdueTouchups: () => Person[];
}

const PeopleContext = createContext<PeopleContextValue | null>(null);

export function PeopleProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setPeople(JSON.parse(raw)); } catch { setPeople(SEED_PEOPLE); }
      } else {
        setPeople(SEED_PEOPLE);
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback((u: Person[]) => { setPeople(u); AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)); }, []);

  const addPerson = useCallback((person: Omit<Person, 'id' | 'createdAt' | 'interactions'>): Person => {
    const newPerson: Person = { ...person, id: genId(), interactions: [], createdAt: new Date().toISOString() };
    setPeople(prev => { const u = [...prev, newPerson]; AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)); return u; });
    return newPerson;
  }, []);

  const updatePerson = useCallback((id: string, updates: Partial<Person>) => {
    setPeople(prev => { const u = prev.map(p => p.id === id ? { ...p, ...updates } : p); AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)); return u; });
  }, []);

  const deletePerson = useCallback(async (id: string) => {
    setPeople(prev => { const u = prev.filter(p => p.id !== id); AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)); return u; });
    // Clean up references in other contexts
    try {
      const { cleanupPersonReferences } = await import('../domain/references/ReferenceCleanupService');
      const result = await cleanupPersonReferences(id);
      if (!result.success) {
        console.error('Failed to cleanup person references:', result.error.message);
      }
    } catch (error) {
      console.error('Failed to cleanup person references:', error);
    }
  }, []);

  const getPerson = useCallback((id: string) => people.find(p => p.id === id), [people]);

  const addInteraction = useCallback((personId: string, interaction: Omit<Interaction, 'id'>) => {
    const newInt: Interaction = { ...interaction, id: genId() };
    setPeople(prev => {
      const u = prev.map(p => p.id === personId ? {
        ...p,
        interactions: [newInt, ...p.interactions],
        lastInteractionDate: interaction.date,
      } : p);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return u;
    });
  }, []);

  const getTodayBirthdays = useCallback(() => {
    const now = new Date();
    const todayKey = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return people.filter(p => p.birthday === todayKey || p.birthday === `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate() + 1).padStart(2, '0')}`);
  }, [people]);

  const getOverdueTouchups = useCallback(() => {
    const now = Date.now();
    return people.filter(p => {
      if (!p.stayInTouchDays || !p.lastInteractionDate) return false;
      const daysSince = (now - new Date(p.lastInteractionDate).getTime()) / 86400000;
      return daysSince > p.stayInTouchDays;
    });
  }, [people]);

  return (
    <PeopleContext.Provider value={{ people, loading, addPerson, updatePerson, deletePerson, getPerson, addInteraction, getTodayBirthdays, getOverdueTouchups }}>
      {children}
    </PeopleContext.Provider>
  );
}

export function usePeople() {
  const ctx = useContext(PeopleContext);
  if (!ctx) throw new Error('usePeople must be used within PeopleProvider');
  return ctx;
}
