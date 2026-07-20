import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lifeos/events';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  allDay: boolean;
  color: string;
  recurrence: Recurrence;
  linkedTaskIds: string[];
  linkedPersonIds: string[];
  createdAt: string;
}

const genId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 5);

const SEED_EVENTS: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Team standup',
    description: 'Daily sync with the team',
    startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(),
    allDay: false,
    color: '#3B82F6',
    recurrence: 'daily',
    linkedTaskIds: [],
    linkedPersonIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'event-2',
    title: 'Lunch with Alex',
    description: 'Catch up over lunch',
    startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30).toISOString(),
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 30).toISOString(),
    allDay: false,
    color: '#8B5CF6',
    recurrence: 'none',
    linkedTaskIds: [],
    linkedPersonIds: ['person-1'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'event-3',
    title: 'Product review',
    description: 'Review Q4 product roadmap',
    startDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0).toISOString(),
    endDate: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0).toISOString(),
    allDay: false,
    color: '#F97316',
    recurrence: 'none',
    linkedTaskIds: ['task-1'],
    linkedPersonIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'event-4',
    title: 'Offsite planning',
    description: 'Full day team offsite',
    startDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 9, 0).toISOString(),
    endDate: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 18, 0).toISOString(),
    allDay: true,
    color: '#10B981',
    recurrence: 'none',
    linkedTaskIds: [],
    linkedPersonIds: [],
    createdAt: new Date().toISOString(),
  },
];

interface CalendarContextValue {
  events: CalendarEvent[];
  loading: boolean;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEvent: (id: string) => CalendarEvent | undefined;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getUpcomingEvents: (count?: number) => CalendarEvent[];
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

/** Check if a recurring event appears on a given date */
function occursOnDate(event: CalendarEvent, date: Date): boolean {
  const startDate = new Date(event.startDate);

  // Normalize to midnight for date comparisons
  const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Must be on or after the event's start date
  if (dateMidnight < startMidnight) return false;

  const rec = event.recurrence ?? 'none';

  if (rec === 'none') {
    return startDate.toDateString() === date.toDateString();
  }

  if (rec === 'daily') {
    return true;
  }

  if (rec === 'weekly') {
    return date.getDay() === startDate.getDay();
  }

  if (rec === 'biweekly') {
    const diffMs = dateMidnight.getTime() - startMidnight.getTime();
    const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    return date.getDay() === startDate.getDay() && diffWeeks % 2 === 0;
  }

  if (rec === 'monthly') {
    return date.getDate() === startDate.getDate();
  }

  return false;
}

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          // Migrate old events without recurrence field
          const migrated = parsed.map((e: any) => ({ recurrence: 'none', ...e }));
          setEvents(migrated);
        } catch {
          setEvents(SEED_EVENTS);
        }
      } else {
        setEvents(SEED_EVENTS);
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback((updated: CalendarEvent[]) => {
    setEvents(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id' | 'createdAt'>): CalendarEvent => {
    const newEvent: CalendarEvent = { ...event, id: genId(), createdAt: new Date().toISOString() };
    setEvents(prev => {
      const u = [...prev, newEvent];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return u;
    });
    return newEvent;
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => {
      const u = prev.map(e => (e.id === id ? { ...e, ...updates } : e));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return u;
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => {
      const u = prev.filter(e => e.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return u;
    });
  }, []);

  const getEvent = useCallback((id: string) => events.find(e => e.id === id), [events]);

  const getEventsForDate = useCallback(
    (date: Date) =>
      events
        .filter(e => occursOnDate(e, date))
        .sort((a, b) => {
          if (a.allDay && !b.allDay) return -1;
          if (!a.allDay && b.allDay) return 1;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }),
    [events],
  );

  const getUpcomingEvents = useCallback(
    (count = 5) => {
      const now = new Date();
      return events
        .filter(e => new Date(e.startDate) >= now || (e.recurrence ?? 'none') !== 'none')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, count);
    },
    [events],
  );

  return (
    <CalendarContext.Provider
      value={{ events, loading, addEvent, updateEvent, deleteEvent, getEvent, getEventsForDate, getUpcomingEvents }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be used within CalendarProvider');
  return ctx;
}
