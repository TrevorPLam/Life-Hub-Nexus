import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lifeos/tasks';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  parentId?: string;
  subtaskIds: string[];
  tags: string[];
  linkedEventIds: string[];
  linkedNoteIds: string[];
  linkedPersonIds: string[];
  linkedTransactionIds: string[];
  createdAt: string;
  completedAt?: string;
}

const genId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const SEED_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Q4 Planning',
    description: 'Plan goals and milestones for Q4',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    subtaskIds: ['task-3', 'task-4'],
    tags: ['work', 'planning'],
    linkedEventIds: [],
    linkedNoteIds: [],
    linkedPersonIds: [],
    linkedTransactionIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Review design mockups',
    description: 'Go through the new product designs with the team',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    subtaskIds: [],
    tags: ['design'],
    linkedEventIds: [],
    linkedNoteIds: [],
    linkedPersonIds: [],
    linkedTransactionIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Define OKRs',
    description: 'Set objectives and key results',
    status: 'done',
    priority: 'high',
    parentId: 'task-1',
    subtaskIds: [],
    tags: ['planning'],
    linkedEventIds: [],
    linkedNoteIds: [],
    linkedPersonIds: [],
    linkedTransactionIds: [],
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Budget allocation',
    description: 'Allocate budget for each team',
    status: 'todo',
    priority: 'medium',
    parentId: 'task-1',
    subtaskIds: [],
    tags: ['planning', 'budget'],
    linkedEventIds: [],
    linkedNoteIds: [],
    linkedPersonIds: [],
    linkedTransactionIds: [],
    createdAt: new Date().toISOString(),
  },
];

interface WorkContextValue {
  tasks: Task[];
  loading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  getTask: (id: string) => Task | undefined;
  getRootTasks: () => Task[];
  getSubtasks: (parentId: string) => Task[];
  linkItem: (taskId: string, type: 'event' | 'note' | 'person' | 'transaction', itemId: string) => void;
  unlinkItem: (taskId: string, type: 'event' | 'note' | 'person' | 'transaction', itemId: string) => void;
}

const WorkContext = createContext<WorkContextValue | null>(null);

export function WorkProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setTasks(JSON.parse(raw)); } catch { setTasks(SEED_TASKS); }
      } else {
        setTasks(SEED_TASKS);
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback((updated: Task[]) => {
    setTasks(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = { ...task, id: genId(), createdAt: new Date().toISOString() };
    setTasks(prev => {
      let updated = [...prev, newTask];
      if (newTask.parentId) {
        updated = updated.map(t =>
          t.id === newTask.parentId ? { ...t, subtaskIds: [...t.subtaskIds, newTask.id] } : t
        );
      }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      let updated = prev.filter(t => t.id !== id && t.parentId !== id);
      if (task?.parentId) {
        updated = updated.map(t =>
          t.id === task.parentId ? { ...t, subtaskIds: t.subtaskIds.filter(sid => sid !== id) } : t
        );
      }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    // Clean up references in other contexts
    try {
      const { cleanupTaskReferences } = await import('../domain/references/ReferenceCleanupService');
      await cleanupTaskReferences(id);
    } catch (error) {
      console.error('Failed to cleanup task references:', error);
    }
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id !== id) return t;
        const done = t.status !== 'done';
        return { ...t, status: done ? 'done' : 'todo' as TaskStatus, completedAt: done ? new Date().toISOString() : undefined };
      });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getTask = useCallback((id: string) => tasks.find(t => t.id === id), [tasks]);
  const getRootTasks = useCallback(() => tasks.filter(t => !t.parentId), [tasks]);
  const getSubtasks = useCallback((parentId: string) => tasks.filter(t => t.parentId === parentId), [tasks]);

  const linkItem = useCallback((taskId: string, type: 'event' | 'note' | 'person' | 'transaction', itemId: string) => {
    const key = type === 'event' ? 'linkedEventIds' : type === 'note' ? 'linkedNoteIds' : type === 'person' ? 'linkedPersonIds' : 'linkedTransactionIds';
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId && !t[key].includes(itemId) ? { ...t, [key]: [...t[key], itemId] } : t);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const unlinkItem = useCallback((taskId: string, type: 'event' | 'note' | 'person' | 'transaction', itemId: string) => {
    const key = type === 'event' ? 'linkedEventIds' : type === 'note' ? 'linkedNoteIds' : type === 'person' ? 'linkedPersonIds' : 'linkedTransactionIds';
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, [key]: t[key].filter((id: string) => id !== itemId) } : t);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <WorkContext.Provider value={{ tasks, loading, addTask, updateTask, deleteTask, toggleComplete, getTask, getRootTasks, getSubtasks, linkItem, unlinkItem }}>
      {children}
    </WorkContext.Provider>
  );
}

export function useWork() {
  const ctx = useContext(WorkContext);
  if (!ctx) throw new Error('useWork must be used within WorkProvider');
  return ctx;
}
