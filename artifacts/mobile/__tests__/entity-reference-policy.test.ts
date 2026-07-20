import {
  cleanupReferencesOnTaskDelete,
  cleanupReferencesOnEventDelete,
  cleanupReferencesOnNoteDelete,
  cleanupReferencesOnPersonDelete,
  cleanupReferencesOnTransactionDelete,
  TaskDto,
  EventDto,
  NoteDto,
  PersonDto,
  TransactionDto,
} from '../domain/references/EntityReferencePolicy';

describe('EntityReferencePolicy', () => {
  describe('Given a task is deleted', () => {
    it('When the task has inbound references, Then the task ID is removed from all linked arrays', () => {
      const taskId = 'task-1';
      const tasks: TaskDto[] = [
        { id: 'task-2', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
        { id: 'task-3', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
      ];
      const events: EventDto[] = [
        { id: 'event-1', linkedTaskIds: [taskId], linkedPersonIds: [] },
        { id: 'event-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const notes: NoteDto[] = [
        { id: 'note-1', linkedTaskIds: [taskId], linkedPersonIds: [] },
        { id: 'note-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const people: PersonDto[] = [
        { id: 'person-1', linkedTaskIds: [taskId], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
        { id: 'person-2', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
      ];
      const transactions: TransactionDto[] = [
        { id: 'tx-1', linkedTaskIds: [taskId], linkedPersonIds: [] },
        { id: 'tx-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];

      const result = cleanupReferencesOnTaskDelete(taskId, { tasks, events, notes, people, transactions });

      expect(result.events[0].linkedTaskIds).not.toContain(taskId);
      expect(result.events[1].linkedTaskIds).toEqual([]);
      expect(result.notes[0].linkedTaskIds).not.toContain(taskId);
      expect(result.notes[1].linkedTaskIds).toEqual([]);
      expect(result.people[0].linkedTaskIds).not.toContain(taskId);
      expect(result.people[1].linkedTaskIds).toEqual([]);
      expect(result.transactions[0].linkedTaskIds).not.toContain(taskId);
      expect(result.transactions[1].linkedTaskIds).toEqual([]);
    });

    it('When the task has no inbound references, Then all collections remain unchanged', () => {
      const taskId = 'task-1';
      const tasks: TaskDto[] = [
        { id: 'task-2', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
      ];
      const events: EventDto[] = [
        { id: 'event-1', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const notes: NoteDto[] = [
        { id: 'note-1', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const people: PersonDto[] = [
        { id: 'person-1', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
      ];
      const transactions: TransactionDto[] = [
        { id: 'tx-1', linkedTaskIds: [], linkedPersonIds: [] },
      ];

      const result = cleanupReferencesOnTaskDelete(taskId, { tasks, events, notes, people, transactions });

      expect(result.events).toEqual(events);
      expect(result.notes).toEqual(notes);
      expect(result.people).toEqual(people);
      expect(result.transactions).toEqual(transactions);
    });
  });

  describe('Given an event is deleted', () => {
    it('When the event has inbound references, Then the event ID is removed from all linked arrays', () => {
      const eventId = 'event-1';
      const tasks: TaskDto[] = [
        { id: 'task-1', linkedEventIds: [eventId], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
        { id: 'task-2', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
      ];
      const events: EventDto[] = [
        { id: 'event-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const people: PersonDto[] = [
        { id: 'person-1', linkedTaskIds: [], linkedEventIds: [eventId], linkedNoteIds: [], linkedTransactionIds: [] },
        { id: 'person-2', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
      ];

      const result = cleanupReferencesOnEventDelete(eventId, { tasks, events, people });

      expect(result.tasks[0].linkedEventIds).not.toContain(eventId);
      expect(result.tasks[1].linkedEventIds).toEqual([]);
      expect(result.people[0].linkedEventIds).not.toContain(eventId);
      expect(result.people[1].linkedEventIds).toEqual([]);
    });

    it('When the event has no inbound references, Then all collections remain unchanged', () => {
      const eventId = 'event-1';
      const tasks: TaskDto[] = [
        { id: 'task-1', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
      ];
      const events: EventDto[] = [
        { id: 'event-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const people: PersonDto[] = [
        { id: 'person-1', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
      ];

      const result = cleanupReferencesOnEventDelete(eventId, { tasks, events, people });

      expect(result.tasks).toEqual(tasks);
      expect(result.events).toEqual(events);
      expect(result.people).toEqual(people);
    });
  });

  describe('Given a note is deleted', () => {
    it('When the note has inbound references, Then the note ID is removed from all linked arrays', () => {
      const noteId = 'note-1';
      const tasks: TaskDto[] = [
        { id: 'task-1', linkedEventIds: [], linkedNoteIds: [noteId], linkedPersonIds: [], linkedTransactionIds: [] },
        { id: 'task-2', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
      ];
      const notes: NoteDto[] = [
        { id: 'note-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const people: PersonDto[] = [
        { id: 'person-1', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [noteId], linkedTransactionIds: [] },
        { id: 'person-2', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
      ];

      const result = cleanupReferencesOnNoteDelete(noteId, { tasks, notes, people });

      expect(result.tasks[0].linkedNoteIds).not.toContain(noteId);
      expect(result.tasks[1].linkedNoteIds).toEqual([]);
      expect(result.people[0].linkedNoteIds).not.toContain(noteId);
      expect(result.people[1].linkedNoteIds).toEqual([]);
    });

    it('When the note has no inbound references, Then all collections remain unchanged', () => {
      const noteId = 'note-1';
      const tasks: TaskDto[] = [
        { id: 'task-1', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
      ];
      const notes: NoteDto[] = [
        { id: 'note-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const people: PersonDto[] = [
        { id: 'person-1', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
      ];

      const result = cleanupReferencesOnNoteDelete(noteId, { tasks, notes, people });

      expect(result.tasks).toEqual(tasks);
      expect(result.notes).toEqual(notes);
      expect(result.people).toEqual(people);
    });
  });

  describe('Given a person is deleted', () => {
    it('When the person has inbound references, Then the person ID is removed from all linked arrays', () => {
      const personId = 'person-1';
      const tasks: TaskDto[] = [
        { id: 'task-1', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [personId], linkedTransactionIds: [] },
        { id: 'task-2', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
      ];
      const events: EventDto[] = [
        { id: 'event-1', linkedTaskIds: [], linkedPersonIds: [personId] },
        { id: 'event-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const notes: NoteDto[] = [
        { id: 'note-1', linkedTaskIds: [], linkedPersonIds: [personId] },
        { id: 'note-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const people: PersonDto[] = [
        { id: 'person-2', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
      ];
      const transactions: TransactionDto[] = [
        { id: 'tx-1', linkedTaskIds: [], linkedPersonIds: [personId] },
        { id: 'tx-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];

      const result = cleanupReferencesOnPersonDelete(personId, { tasks, events, notes, people, transactions });

      expect(result.tasks[0].linkedPersonIds).not.toContain(personId);
      expect(result.tasks[1].linkedPersonIds).toEqual([]);
      expect(result.events[0].linkedPersonIds).not.toContain(personId);
      expect(result.events[1].linkedPersonIds).toEqual([]);
      expect(result.notes[0].linkedPersonIds).not.toContain(personId);
      expect(result.notes[1].linkedPersonIds).toEqual([]);
      expect(result.transactions[0].linkedPersonIds).not.toContain(personId);
      expect(result.transactions[1].linkedPersonIds).toEqual([]);
    });

    it('When the person has no inbound references, Then all collections remain unchanged', () => {
      const personId = 'person-1';
      const tasks: TaskDto[] = [
        { id: 'task-1', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
      ];
      const events: EventDto[] = [
        { id: 'event-1', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const notes: NoteDto[] = [
        { id: 'note-1', linkedTaskIds: [], linkedPersonIds: [] },
      ];
      const people: PersonDto[] = [
        { id: 'person-2', linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], linkedTransactionIds: [] },
      ];
      const transactions: TransactionDto[] = [
        { id: 'tx-1', linkedTaskIds: [], linkedPersonIds: [] },
      ];

      const result = cleanupReferencesOnPersonDelete(personId, { tasks, events, notes, people, transactions });

      expect(result.tasks).toEqual(tasks);
      expect(result.events).toEqual(events);
      expect(result.notes).toEqual(notes);
      expect(result.people).toEqual(people);
      expect(result.transactions).toEqual(transactions);
    });
  });

  describe('Given a transaction is deleted', () => {
    it('When the transaction has inbound references, Then the transaction ID is removed from all linked arrays', () => {
      const transactionId = 'tx-1';
      const tasks: TaskDto[] = [
        { id: 'task-1', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [transactionId] },
        { id: 'task-2', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
      ];
      const transactions: TransactionDto[] = [
        { id: 'tx-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];

      const result = cleanupReferencesOnTransactionDelete(transactionId, { tasks, transactions });

      expect(result.tasks[0].linkedTransactionIds).not.toContain(transactionId);
      expect(result.tasks[1].linkedTransactionIds).toEqual([]);
    });

    it('When the transaction has no inbound references, Then all collections remain unchanged', () => {
      const transactionId = 'tx-1';
      const tasks: TaskDto[] = [
        { id: 'task-1', linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] },
      ];
      const transactions: TransactionDto[] = [
        { id: 'tx-2', linkedTaskIds: [], linkedPersonIds: [] },
      ];

      const result = cleanupReferencesOnTransactionDelete(transactionId, { tasks, transactions });

      expect(result.tasks).toEqual(tasks);
      expect(result.transactions).toEqual(transactions);
    });
  });
});
