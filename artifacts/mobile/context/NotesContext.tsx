import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lifeos/notes';

export interface Folder {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  tags: string[];
  linkedTaskIds: string[];
  linkedPersonIds: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const genId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const SEED_FOLDERS: Folder[] = [
  { id: 'folder-1', name: 'Personal', color: '#8B5CF6' },
  { id: 'folder-2', name: 'Work', color: '#3B82F6' },
  { id: 'folder-3', name: 'Ideas', color: '#10B981' },
];

const SEED_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Welcome to Life OS',
    content: `# Welcome to Life OS\n\nThis is your personal life operating system. Here you can:\n\n- **Manage tasks** in the Work module\n- **Track events** in Calendar\n- **Write notes** right here\n- **Monitor budget** in Finance\n- **Nurture relationships** in People\n\nEverything connects. Link a task to a note, a note to a person, a person to a calendar event.`,
    folderId: 'folder-1',
    tags: ['getting-started'],
    linkedTaskIds: [],
    linkedPersonIds: [],
    isPinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    title: 'Q4 Goals',
    content: `# Q4 Goals\n\n## Professional\n- Launch new product feature\n- Grow team by 2 engineers\n- Hit revenue targets\n\n## Personal\n- Read 3 books\n- Exercise 4x/week\n- Travel to a new country`,
    folderId: 'folder-2',
    tags: ['goals', 'quarterly'],
    linkedTaskIds: ['task-1'],
    linkedPersonIds: [],
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-3',
    title: 'Book recommendations',
    content: `# Books to Read\n\n- The Almanack of Naval Ravikant\n- Deep Work by Cal Newport\n- Atomic Habits by James Clear\n- The Psychology of Money`,
    folderId: 'folder-1',
    tags: ['books', 'learning'],
    linkedTaskIds: [],
    linkedPersonIds: [],
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface NotesContextValue {
  notes: Note[];
  folders: Folder[];
  loading: boolean;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getNote: (id: string) => Note | undefined;
  addFolder: (folder: Omit<Folder, 'id'>) => void;
  getNotesForFolder: (folderId?: string) => Note[];
  searchNotes: (query: string) => Note[];
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>(SEED_FOLDERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const { notes: n, folders: f } = JSON.parse(raw);
          setNotes(n || SEED_NOTES);
          setFolders(f || SEED_FOLDERS);
        } catch { setNotes(SEED_NOTES); }
      } else {
        setNotes(SEED_NOTES);
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback((n: Note[], f: Folder[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ notes: n, folders: f }));
  }, []);

  const addNote = useCallback((note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const now = new Date().toISOString();
    const newNote: Note = { ...note, id: genId(), createdAt: now, updatedAt: now };
    setNotes(prev => { const u = [newNote, ...prev]; save(u, folders); return u; });
    return newNote;
  }, [folders, save]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => {
      const u = prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);
      save(u, folders);
      return u;
    });
  }, [folders, save]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => { const u = prev.filter(n => n.id !== id); save(u, folders); return u; });
  }, [folders, save]);

  const getNote = useCallback((id: string) => notes.find(n => n.id === id), [notes]);

  const addFolder = useCallback((folder: Omit<Folder, 'id'>) => {
    setFolders(prev => { const u = [...prev, { ...folder, id: genId() }]; save(notes, u); return u; });
  }, [notes, save]);

  const getNotesForFolder = useCallback((folderId?: string) => {
    if (!folderId) return notes;
    return notes.filter(n => n.folderId === folderId);
  }, [notes]);

  const searchNotes = useCallback((query: string) => {
    const q = query.toLowerCase();
    return notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.includes(q)));
  }, [notes]);

  return (
    <NotesContext.Provider value={{ notes, folders, loading, addNote, updateNote, deleteNote, getNote, addFolder, getNotesForFolder, searchNotes }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
