import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cleanupReferencesOnTaskDelete,
  cleanupReferencesOnEventDelete,
  cleanupReferencesOnNoteDelete,
  cleanupReferencesOnPersonDelete,
  cleanupReferencesOnTransactionDelete,
  TaskCollections,
  EventCollections,
  NoteCollections,
  PersonCollections,
  TransactionCollections,
} from './EntityReferencePolicy';
import { Task } from '../../context/WorkContext';
import { CalendarEvent } from '../../context/CalendarContext';
import { Note } from '../../context/NotesContext';
import { Person } from '../../context/PeopleContext';
import { Transaction } from '../../context/BudgetContext';

/**
 * Reference Cleanup Service
 * 
 * A service that coordinates reference cleanup across entity collections
 * by reading from AsyncStorage, applying cleanup, and writing back.
 * 
 * This approach keeps contexts decoupled while ensuring consistent
 * reference integrity when entities are deleted.
 */

const STORAGE_KEYS = {
  tasks: '@lifeos/tasks',
  events: '@lifeos/events',
  notes: '@lifeos/notes',
  people: '@lifeos/people',
  budget: '@lifeos/budget',
  budgets: '@lifeos/budget_limits',
};

async function safeParse<T>(raw: string | null, defaultValue: T): Promise<T> {
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

async function loadAllCollections(): Promise<{
  tasks: Task[];
  events: CalendarEvent[];
  notes: Note[];
  people: Person[];
  transactions: Transaction[];
}> {
  const [tasksRaw, eventsRaw, notesRaw, peopleRaw, budgetRaw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.tasks),
    AsyncStorage.getItem(STORAGE_KEYS.events),
    AsyncStorage.getItem(STORAGE_KEYS.notes),
    AsyncStorage.getItem(STORAGE_KEYS.people),
    AsyncStorage.getItem(STORAGE_KEYS.budget),
  ]);

  const budget = await safeParse<{ notes: Note[]; folders: any[] }>(budgetRaw, { notes: [], folders: [] });
  const transactions = await safeParse<Transaction[]>(budgetRaw, []);

  return {
    tasks: await safeParse<Task[]>(tasksRaw, []),
    events: await safeParse<CalendarEvent[]>(eventsRaw, []),
    notes: budget.notes || (await safeParse<Note[]>(notesRaw, [])),
    people: await safeParse<Person[]>(peopleRaw, []),
    transactions: await safeParse<Transaction[]>(budgetRaw, []),
  };
}

async function saveCollection<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

/**
 * Cleans up references when a task is deleted.
 * Reads all collections from AsyncStorage, removes the task ID from
 * inbound references, and writes back the updated collections.
 */
export async function cleanupTaskReferences(taskId: string): Promise<void> {
  const collections = await loadAllCollections();

  const taskCollections: TaskCollections = {
    tasks: collections.tasks,
    events: collections.events,
    notes: collections.notes,
    people: collections.people,
    transactions: collections.transactions,
  };

  const result = cleanupReferencesOnTaskDelete(taskId, taskCollections);

  await Promise.all([
    saveCollection(STORAGE_KEYS.events, result.events),
    saveCollection(STORAGE_KEYS.notes, result.notes),
    saveCollection(STORAGE_KEYS.people, result.people),
    saveCollection(STORAGE_KEYS.budget, result.transactions),
  ]);
}

/**
 * Cleans up references when an event is deleted.
 */
export async function cleanupEventReferences(eventId: string): Promise<void> {
  const collections = await loadAllCollections();

  const eventCollections: EventCollections = {
    tasks: collections.tasks,
    events: collections.events,
    people: collections.people,
  };

  const result = cleanupReferencesOnEventDelete(eventId, eventCollections);

  await Promise.all([
    saveCollection(STORAGE_KEYS.tasks, result.tasks),
    saveCollection(STORAGE_KEYS.people, result.people),
  ]);
}

/**
 * Cleans up references when a note is deleted.
 */
export async function cleanupNoteReferences(noteId: string): Promise<void> {
  const collections = await loadAllCollections();

  const noteCollections: NoteCollections = {
    tasks: collections.tasks,
    notes: collections.notes,
    people: collections.people,
  };

  const result = cleanupReferencesOnNoteDelete(noteId, noteCollections);

  await Promise.all([
    saveCollection(STORAGE_KEYS.tasks, result.tasks),
    saveCollection(STORAGE_KEYS.people, result.people),
  ]);
}

/**
 * Cleans up references when a person is deleted.
 */
export async function cleanupPersonReferences(personId: string): Promise<void> {
  const collections = await loadAllCollections();

  const personCollections: PersonCollections = {
    tasks: collections.tasks,
    events: collections.events,
    notes: collections.notes,
    people: collections.people,
    transactions: collections.transactions,
  };

  const result = cleanupReferencesOnPersonDelete(personId, personCollections);

  await Promise.all([
    saveCollection(STORAGE_KEYS.tasks, result.tasks),
    saveCollection(STORAGE_KEYS.events, result.events),
    saveCollection(STORAGE_KEYS.notes, result.notes),
    saveCollection(STORAGE_KEYS.budget, result.transactions),
  ]);
}

/**
 * Cleans up references when a transaction is deleted.
 */
export async function cleanupTransactionReferences(transactionId: string): Promise<void> {
  const collections = await loadAllCollections();

  const transactionCollections: TransactionCollections = {
    tasks: collections.tasks,
    transactions: collections.transactions,
  };

  const result = cleanupReferencesOnTransactionDelete(transactionId, transactionCollections);

  await saveCollection(STORAGE_KEYS.tasks, result.tasks);
}
