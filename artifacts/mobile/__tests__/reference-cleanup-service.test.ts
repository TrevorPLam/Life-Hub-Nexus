import {
  cleanupTaskReferences,
  cleanupEventReferences,
  cleanupNoteReferences,
  cleanupPersonReferences,
  cleanupTransactionReferences,
  CleanupResult,
} from '../domain/references/ReferenceCleanupService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

type StorageState = Record<string, string | null>;

function givenStorage(state: StorageState) {
  const mutableState: StorageState = { ...state };
  (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
    return Promise.resolve(mutableState[key] ?? null);
  });
  (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
    mutableState[key] = value;
    return Promise.resolve(undefined);
  });
  return mutableState;
}

function storageCollection<T>(items: T[], wrapper?: { notes: T[]; folders: unknown[] }) {
  if (wrapper) {
    return JSON.stringify(wrapper);
  }
  return JSON.stringify(items);
}

function noteEnvelope(notes: unknown[], folders: unknown[] = []) {
  return JSON.stringify({ notes, folders });
}

function readStoredSetItem(key: string) {
  const calls = (AsyncStorage.setItem as jest.Mock).mock.calls as [string, string][];
  const found = calls.find(([k]) => k === key);
  return found ? JSON.parse(found[1]) : undefined;
}

describe('ReferenceCleanupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    givenStorage({});
  });

  describe('Given a task is deleted', () => {
    it('When the task has inbound references, Then the task ID is removed from events, notes, people and transactions and notes folders are preserved', async () => {
      const taskId = 'task-1';
      givenStorage({
        '@lifeos/tasks': storageCollection([
          { id: 'task-2', title: 'Other Task', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
        ]),
        '@lifeos/events': storageCollection([
          { id: 'event-1', title: 'Event 1', linkedTaskIds: [taskId], linkedPersonIds: [] },
          { id: 'event-2', title: 'Event 2', linkedTaskIds: [], linkedPersonIds: [] },
        ]),
        '@lifeos/notes': noteEnvelope(
          [
            { id: 'note-1', title: 'Note 1', linkedTaskIds: [taskId], linkedPersonIds: [] },
            { id: 'note-2', title: 'Note 2', linkedTaskIds: [], linkedPersonIds: [] },
          ],
          [{ id: 'folder-1', name: 'Folder 1' }]
        ),
        '@lifeos/people': storageCollection([
          { id: 'person-1', name: 'Person 1', linkedTaskIds: [taskId], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
          { id: 'person-2', name: 'Person 2', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
        ]),
        '@lifeos/budget': storageCollection([
          { id: 'tx-1', title: 'Transaction 1', linkedTaskIds: [taskId], linkedPersonIds: [] },
          { id: 'tx-2', title: 'Transaction 2', linkedTaskIds: [], linkedPersonIds: [] },
        ]),
      });

      const result: CleanupResult = await cleanupTaskReferences(taskId);

      expect(result).toEqual({ success: true });

      const storedEvents = readStoredSetItem('@lifeos/events');
      expect(storedEvents[0].linkedTaskIds).not.toContain(taskId);
      expect(storedEvents[1].linkedTaskIds).toEqual([]);

      const storedNotes = readStoredSetItem('@lifeos/notes');
      expect(storedNotes.notes[0].linkedTaskIds).not.toContain(taskId);
      expect(storedNotes.notes[1].linkedTaskIds).toEqual([]);
      expect(storedNotes.folders).toEqual([{ id: 'folder-1', name: 'Folder 1' }]);

      const storedPeople = readStoredSetItem('@lifeos/people');
      expect(storedPeople[0].linkedTaskIds).not.toContain(taskId);
      expect(storedPeople[1].linkedTaskIds).toEqual([]);

      const storedTransactions = readStoredSetItem('@lifeos/budget');
      expect(storedTransactions[0].linkedTaskIds).not.toContain(taskId);
      expect(storedTransactions[1].linkedTaskIds).toEqual([]);

      expect(readStoredSetItem('@lifeos/tasks')).toBeUndefined();
    });

    it('When storage contains malformed JSON, Then a recoverable invalid-data result is returned and nothing is written', async () => {
      givenStorage({
        '@lifeos/tasks': JSON.stringify([{ id: 'task-1', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] }]),
        '@lifeos/events': 'not valid json',
        '@lifeos/notes': noteEnvelope([]),
        '@lifeos/people': '[]',
        '@lifeos/budget': '[]',
      });

      const result: CleanupResult = await cleanupTaskReferences('task-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('invalid-data');
      }
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Given an event is deleted', () => {
    it('When the event has inbound references, Then the event ID is removed from tasks and people and unrelated collections are preserved', async () => {
      const eventId = 'event-1';
      givenStorage({
        '@lifeos/tasks': storageCollection([
          { id: 'task-1', title: 'Task 1', linkedEventIds: [eventId], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
          { id: 'task-2', title: 'Task 2', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
        ]),
        '@lifeos/events': storageCollection([
          { id: 'event-2', title: 'Event 2', linkedTaskIds: [], linkedPersonIds: [] },
        ]),
        '@lifeos/notes': noteEnvelope([
          { id: 'note-1', title: 'Note 1', linkedTaskIds: [], linkedPersonIds: [] },
        ]),
        '@lifeos/people': storageCollection([
          { id: 'person-1', name: 'Person 1', linkedTaskIds: [], linkedEventIds: [eventId], linkedNoteIds: [], linkedTransactionIds: [] },
          { id: 'person-2', name: 'Person 2', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
        ]),
        '@lifeos/budget': storageCollection([
          { id: 'tx-1', title: 'Transaction 1', linkedTaskIds: [], linkedPersonIds: [] },
        ]),
      });

      const result = await cleanupEventReferences(eventId);

      expect(result).toEqual({ success: true });

      const storedTasks = readStoredSetItem('@lifeos/tasks');
      expect(storedTasks[0].linkedEventIds).not.toContain(eventId);
      expect(storedTasks[1].linkedEventIds).toEqual([]);

      const storedPeople = readStoredSetItem('@lifeos/people');
      expect(storedPeople[0].linkedEventIds).not.toContain(eventId);
      expect(storedPeople[1].linkedEventIds).toEqual([]);

      expect(readStoredSetItem('@lifeos/events')).toBeUndefined();
      expect(readStoredSetItem('@lifeos/notes')).toBeUndefined();
      expect(readStoredSetItem('@lifeos/budget')).toBeUndefined();
    });
  });

  describe('Given a note is deleted', () => {
    it('When the note has inbound references, Then the note ID is removed from tasks and people', async () => {
      const noteId = 'note-1';
      givenStorage({
        '@lifeos/tasks': storageCollection([
          { id: 'task-1', title: 'Task 1', linkedEventIds: [], linkedNoteIds: [noteId], linkedPersonIds: [], linkedTransactionIds: [] },
          { id: 'task-2', title: 'Task 2', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
        ]),
        '@lifeos/events': storageCollection([
          { id: 'event-1', title: 'Event 1', linkedTaskIds: [], linkedPersonIds: [] },
        ]),
        '@lifeos/notes': noteEnvelope([
          { id: 'note-2', title: 'Note 2', linkedTaskIds: [], linkedPersonIds: [] },
        ]),
        '@lifeos/people': storageCollection([
          { id: 'person-1', name: 'Person 1', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [noteId], linkedTransactionIds: [] },
          { id: 'person-2', name: 'Person 2', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
        ]),
        '@lifeos/budget': storageCollection([]),
      });

      const result = await cleanupNoteReferences(noteId);

      expect(result).toEqual({ success: true });

      const storedTasks = readStoredSetItem('@lifeos/tasks');
      expect(storedTasks[0].linkedNoteIds).not.toContain(noteId);
      expect(storedTasks[1].linkedNoteIds).toEqual([]);

      const storedPeople = readStoredSetItem('@lifeos/people');
      expect(storedPeople[0].linkedNoteIds).not.toContain(noteId);
      expect(storedPeople[1].linkedNoteIds).toEqual([]);

      expect(readStoredSetItem('@lifeos/notes')).toBeUndefined();
    });
  });

  describe('Given a person is deleted', () => {
    it('When the person has inbound references, Then the person ID is removed from tasks, events, notes and transactions', async () => {
      const personId = 'person-1';
      givenStorage({
        '@lifeos/tasks': storageCollection([
          { id: 'task-1', title: 'Task 1', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [personId], linkedTransactionIds: [] },
          { id: 'task-2', title: 'Task 2', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
        ]),
        '@lifeos/events': storageCollection([
          { id: 'event-1', title: 'Event 1', linkedTaskIds: [], linkedPersonIds: [personId] },
          { id: 'event-2', title: 'Event 2', linkedTaskIds: [], linkedPersonIds: [] },
        ]),
        '@lifeos/notes': noteEnvelope(
          [
            { id: 'note-1', title: 'Note 1', linkedTaskIds: [], linkedPersonIds: [personId] },
            { id: 'note-2', title: 'Note 2', linkedTaskIds: [], linkedPersonIds: [] },
          ],
          []
        ),
        '@lifeos/people': storageCollection([
          { id: 'person-2', name: 'Person 2', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
        ]),
        '@lifeos/budget': storageCollection([
          { id: 'tx-1', title: 'Transaction 1', linkedTaskIds: [], linkedPersonIds: [personId] },
          { id: 'tx-2', title: 'Transaction 2', linkedTaskIds: [], linkedPersonIds: [] },
        ]),
      });

      const result = await cleanupPersonReferences(personId);

      expect(result).toEqual({ success: true });

      const storedTasks = readStoredSetItem('@lifeos/tasks');
      expect(storedTasks[0].linkedPersonIds).not.toContain(personId);
      expect(storedTasks[1].linkedPersonIds).toEqual([]);

      const storedEvents = readStoredSetItem('@lifeos/events');
      expect(storedEvents[0].linkedPersonIds).not.toContain(personId);
      expect(storedEvents[1].linkedPersonIds).toEqual([]);

      const storedNotes = readStoredSetItem('@lifeos/notes');
      expect(storedNotes.notes[0].linkedPersonIds).not.toContain(personId);
      expect(storedNotes.notes[1].linkedPersonIds).toEqual([]);

      const storedTransactions = readStoredSetItem('@lifeos/budget');
      expect(storedTransactions[0].linkedPersonIds).not.toContain(personId);
      expect(storedTransactions[1].linkedPersonIds).toEqual([]);

      expect(readStoredSetItem('@lifeos/people')).toBeUndefined();
    });
  });

  describe('Given a transaction is deleted', () => {
    it('When the transaction has inbound references, Then the transaction ID is removed from tasks', async () => {
      const transactionId = 'tx-1';
      givenStorage({
        '@lifeos/tasks': storageCollection([
          { id: 'task-1', title: 'Task 1', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [transactionId] },
          { id: 'task-2', title: 'Task 2', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
        ]),
        '@lifeos/events': storageCollection([]),
        '@lifeos/notes': noteEnvelope([]),
        '@lifeos/people': storageCollection([]),
        '@lifeos/budget': storageCollection([
          { id: 'tx-2', title: 'Transaction 2', linkedTaskIds: [], linkedPersonIds: [] },
        ]),
      });

      const result = await cleanupTransactionReferences(transactionId);

      expect(result).toEqual({ success: true });

      const storedTasks = readStoredSetItem('@lifeos/tasks');
      expect(storedTasks[0].linkedTransactionIds).not.toContain(transactionId);
      expect(storedTasks[1].linkedTransactionIds).toEqual([]);

      expect(readStoredSetItem('@lifeos/budget')).toBeUndefined();
    });
  });

  describe('Given a stored collection has the wrong shape', () => {
    it('When tasks is not an array, Then a recoverable invalid-data result is returned', async () => {
      givenStorage({
        '@lifeos/tasks': JSON.stringify({ notAnArray: true }),
        '@lifeos/events': '[]',
        '@lifeos/notes': noteEnvelope([]),
        '@lifeos/people': '[]',
        '@lifeos/budget': '[]',
      });

      const result = await cleanupTransactionReferences('tx-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('invalid-data');
      }
    });

    it('When notes is not an object envelope, Then a recoverable invalid-data result is returned', async () => {
      givenStorage({
        '@lifeos/tasks': '[]',
        '@lifeos/events': '[]',
        '@lifeos/notes': JSON.stringify([{ id: 'note-1' }]),
        '@lifeos/people': '[]',
        '@lifeos/budget': '[]',
      });

      const result = await cleanupTaskReferences('task-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('invalid-data');
      }
    });
  });

  describe('Given storage write fails', () => {
    it('When setItem rejects, Then a storage-error result is returned', async () => {
      givenStorage({
        '@lifeos/tasks': storageCollection([]),
        '@lifeos/events': storageCollection([]),
        '@lifeos/notes': noteEnvelope([]),
        '@lifeos/people': storageCollection([]),
        '@lifeos/budget': storageCollection([]),
      });
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage full'));

      const result = await cleanupTaskReferences('task-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('storage-error');
      }
    });
  });
});
