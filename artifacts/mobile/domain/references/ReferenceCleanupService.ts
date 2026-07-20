import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cleanupReferencesOnTaskDelete,
  cleanupReferencesOnEventDelete,
  cleanupReferencesOnNoteDelete,
  cleanupReferencesOnPersonDelete,
  cleanupReferencesOnTransactionDelete,
  type EntityCollections,
  type TaskDto,
  type EventDto,
  type NoteDto,
  type PersonDto,
  type TransactionDto,
} from './EntityReferencePolicy';

/**
 * Reference Cleanup Service
 *
 * Coordinates reference cleanup by reading entity collections through a
 * persistence port, applying the pure EntityReferencePolicy, and writing the
 * changed collections back. The AsyncStorage adapter is an anti-corruption
 * layer that validates each stored shape before the policy sees it and returns
 * typed outcomes instead of swallowing errors.
 *
 * Notes on current AsyncStorage boundary:
 * - Storage keys are private to the adapter.
 * - Notes are stored under '@lifeos/notes' as `{ notes: Note[], folders: unknown[] }`;
 *   the adapter extracts the notes array for the policy and preserves folders on write.
 * - Transactions are stored under '@lifeos/budget' as a raw array.
 * - Cleanup is not atomic: each changed collection is written separately.
 *   A future SQLite store can replace this adapter and provide a single transaction.
 */

const STORAGE_KEYS = {
  tasks: '@lifeos/tasks',
  events: '@lifeos/events',
  notes: '@lifeos/notes',
  people: '@lifeos/people',
  budget: '@lifeos/budget',
} as const;

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function ensureStringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (!isStringArray(value)) {
    throw new ValidationError(`Expected ${field} to be an array of strings`);
  }
  return value;
}

function assertObject(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new ValidationError('Expected an object');
  }
}

function parseJson(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError('Malformed JSON in storage');
  }
}

function parseArray<T extends Record<string, unknown>>(
  raw: string | null,
  label: string,
  validate: (item: unknown) => T
): T[] {
  const parsed = parseJson(raw);
  if (parsed === null) return [];
  if (!Array.isArray(parsed)) {
    throw new ValidationError(`${label} storage entry is not an array`);
  }
  return parsed.map(validate);
}

function validateTask(item: unknown): TaskDto & Record<string, unknown> {
  assertObject(item);
  const id = item.id;
  if (typeof id !== 'string') {
    throw new ValidationError('Task missing or invalid id');
  }
  return {
    ...item,
    id,
    linkedEventIds: ensureStringArray(item.linkedEventIds, 'linkedEventIds'),
    linkedNoteIds: ensureStringArray(item.linkedNoteIds, 'linkedNoteIds'),
    linkedPersonIds: ensureStringArray(item.linkedPersonIds, 'linkedPersonIds'),
    linkedTransactionIds: ensureStringArray(item.linkedTransactionIds, 'linkedTransactionIds'),
  } as TaskDto & Record<string, unknown>;
}

function validateEvent(item: unknown): EventDto & Record<string, unknown> {
  assertObject(item);
  const id = item.id;
  if (typeof id !== 'string') {
    throw new ValidationError('Event missing or invalid id');
  }
  return {
    ...item,
    id,
    linkedTaskIds: ensureStringArray(item.linkedTaskIds, 'linkedTaskIds'),
    linkedPersonIds: ensureStringArray(item.linkedPersonIds, 'linkedPersonIds'),
  } as EventDto & Record<string, unknown>;
}

function validateNote(item: unknown): NoteDto & Record<string, unknown> {
  assertObject(item);
  const id = item.id;
  if (typeof id !== 'string') {
    throw new ValidationError('Note missing or invalid id');
  }
  return {
    ...item,
    id,
    linkedTaskIds: ensureStringArray(item.linkedTaskIds, 'linkedTaskIds'),
    linkedPersonIds: ensureStringArray(item.linkedPersonIds, 'linkedPersonIds'),
  } as NoteDto & Record<string, unknown>;
}

function validatePerson(item: unknown): PersonDto & Record<string, unknown> {
  assertObject(item);
  const id = item.id;
  if (typeof id !== 'string') {
    throw new ValidationError('Person missing or invalid id');
  }
  return {
    ...item,
    id,
    linkedTaskIds: ensureStringArray(item.linkedTaskIds, 'linkedTaskIds'),
    linkedEventIds: ensureStringArray(item.linkedEventIds, 'linkedEventIds'),
    linkedNoteIds: ensureStringArray(item.linkedNoteIds, 'linkedNoteIds'),
    linkedTransactionIds: ensureStringArray(item.linkedTransactionIds, 'linkedTransactionIds'),
  } as PersonDto & Record<string, unknown>;
}

function validateTransaction(item: unknown): TransactionDto & Record<string, unknown> {
  assertObject(item);
  const id = item.id;
  if (typeof id !== 'string') {
    throw new ValidationError('Transaction missing or invalid id');
  }
  return {
    ...item,
    id,
    linkedTaskIds: ensureStringArray(item.linkedTaskIds, 'linkedTaskIds'),
    linkedPersonIds: ensureStringArray(item.linkedPersonIds, 'linkedPersonIds'),
  } as TransactionDto & Record<string, unknown>;
}

type NoteEnvelope = { notes: (NoteDto & Record<string, unknown>)[]; folders: unknown[] };

function validateNoteEnvelope(parsed: unknown): NoteEnvelope {
  assertObject(parsed);
  const notes = parsed.notes;
  if (!Array.isArray(notes)) {
    throw new ValidationError('Notes envelope missing notes array');
  }
  const folders = parsed.folders;
  if (folders !== undefined && !Array.isArray(folders)) {
    throw new ValidationError('Notes envelope folders is not an array');
  }
  return {
    notes: notes.map(validateNote),
    folders: Array.isArray(folders) ? folders : [],
  };
}

function parseNotesEnvelope(raw: string | null): NoteEnvelope {
  const parsed = parseJson(raw);
  if (parsed === null) return { notes: [], folders: [] };
  return validateNoteEnvelope(parsed);
}

export type CleanupResult =
  | { success: true }
  | { success: false; error: { type: 'storage-error' | 'invalid-data'; message: string } };

type LoadResult =
  | { success: true; collections: EntityCollections }
  | { success: false; error: { type: 'storage-error' | 'invalid-data'; message: string } };

export interface ReferenceCollectionStore {
  loadAll(): Promise<LoadResult>;
  save(collections: Partial<EntityCollections>): Promise<CleanupResult>;
}

export function createAsyncStorageReferenceCollectionStore(): ReferenceCollectionStore {
  return {
    async loadAll(): Promise<LoadResult> {
      try {
        const [tasksRaw, eventsRaw, notesRaw, peopleRaw, budgetRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.tasks),
          AsyncStorage.getItem(STORAGE_KEYS.events),
          AsyncStorage.getItem(STORAGE_KEYS.notes),
          AsyncStorage.getItem(STORAGE_KEYS.people),
          AsyncStorage.getItem(STORAGE_KEYS.budget),
        ]);

        return {
          success: true,
          collections: {
            tasks: parseArray(tasksRaw, 'tasks', validateTask),
            events: parseArray(eventsRaw, 'events', validateEvent),
            notes: parseNotesEnvelope(notesRaw).notes,
            people: parseArray(peopleRaw, 'people', validatePerson),
            transactions: parseArray(budgetRaw, 'transactions', validateTransaction),
          },
        };
      } catch (error) {
        if (error instanceof ValidationError) {
          return { success: false, error: { type: 'invalid-data', message: error.message } };
        }
        const message = error instanceof Error ? error.message : 'Unknown storage error';
        return { success: false, error: { type: 'storage-error', message } };
      }
    },

    async save(collections: Partial<EntityCollections>): Promise<CleanupResult> {
      try {
        const writes: Promise<void>[] = [];

        if (collections.tasks !== undefined) {
          writes.push(AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(collections.tasks)));
        }
        if (collections.events !== undefined) {
          writes.push(AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify(collections.events)));
        }
        if (collections.people !== undefined) {
          writes.push(AsyncStorage.setItem(STORAGE_KEYS.people, JSON.stringify(collections.people)));
        }
        if (collections.transactions !== undefined) {
          writes.push(AsyncStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(collections.transactions)));
        }
        if (collections.notes !== undefined) {
          const existingRaw = await AsyncStorage.getItem(STORAGE_KEYS.notes);
          const existing = parseNotesEnvelope(existingRaw);
          const updated = { ...existing, notes: collections.notes };
          writes.push(AsyncStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(updated)));
        }

        await Promise.all(writes);
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown storage error';
        return { success: false, error: { type: 'storage-error', message } };
      }
    },
  };
}

export async function cleanupTaskReferences(
  taskId: string,
  store: ReferenceCollectionStore = createAsyncStorageReferenceCollectionStore()
): Promise<CleanupResult> {
  const load = await store.loadAll();
  if (!load.success) return load;

  const result = cleanupReferencesOnTaskDelete(taskId, load.collections);
  return store.save({
    events: result.events,
    notes: result.notes,
    people: result.people,
    transactions: result.transactions,
  });
}

export async function cleanupEventReferences(
  eventId: string,
  store: ReferenceCollectionStore = createAsyncStorageReferenceCollectionStore()
): Promise<CleanupResult> {
  const load = await store.loadAll();
  if (!load.success) return load;

  const result = cleanupReferencesOnEventDelete(eventId, load.collections);
  return store.save({ tasks: result.tasks, people: result.people });
}

export async function cleanupNoteReferences(
  noteId: string,
  store: ReferenceCollectionStore = createAsyncStorageReferenceCollectionStore()
): Promise<CleanupResult> {
  const load = await store.loadAll();
  if (!load.success) return load;

  const result = cleanupReferencesOnNoteDelete(noteId, load.collections);
  return store.save({ tasks: result.tasks, people: result.people });
}

export async function cleanupPersonReferences(
  personId: string,
  store: ReferenceCollectionStore = createAsyncStorageReferenceCollectionStore()
): Promise<CleanupResult> {
  const load = await store.loadAll();
  if (!load.success) return load;

  const result = cleanupReferencesOnPersonDelete(personId, load.collections);
  return store.save({
    tasks: result.tasks,
    events: result.events,
    notes: result.notes,
    transactions: result.transactions,
  });
}

export async function cleanupTransactionReferences(
  transactionId: string,
  store: ReferenceCollectionStore = createAsyncStorageReferenceCollectionStore()
): Promise<CleanupResult> {
  const load = await store.loadAll();
  if (!load.success) return load;

  const result = cleanupReferencesOnTransactionDelete(transactionId, load.collections);
  return store.save({ tasks: result.tasks });
}
