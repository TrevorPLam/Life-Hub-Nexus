import { 
  cleanupReferencesOnTaskDelete,
  cleanupReferencesOnEventDelete,
  cleanupReferencesOnNoteDelete,
  cleanupReferencesOnPersonDelete,
  cleanupReferencesOnTransactionDelete,
} from '../domain/references/EntityReferencePolicy';
import { Task } from '../context/WorkContext';
import { CalendarEvent } from '../context/CalendarContext';
import { Note } from '../context/NotesContext';
import { Person } from '../context/PeopleContext';
import { Transaction } from '../context/BudgetContext';

describe('EntityReferencePolicy', () => {
  describe('Given a task is deleted', () => {
    it('When the task has inbound references, Then the task ID is removed from all linked arrays', () => {
      // Given
      const taskId = 'task-1';
      const tasks: Task[] = [
        { id: 'task-2', title: 'Other Task', description: '', status: 'todo', priority: 'medium', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
        { id: 'task-3', title: 'Another Task', description: '', status: 'todo', priority: 'low', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
      ];
      const events: CalendarEvent[] = [
        { id: 'event-1', title: 'Event 1', description: '', startDate: '', endDate: '', allDay: false, color: '#000', recurrence: 'none', linkedTaskIds: [taskId], linkedPersonIds: [], createdAt: '' },
        { id: 'event-2', title: 'Event 2', description: '', startDate: '', endDate: '', allDay: false, color: '#000', recurrence: 'none', linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];
      const notes: Note[] = [
        { id: 'note-1', title: 'Note 1', content: '', tags: [], linkedTaskIds: [taskId], linkedPersonIds: [], isPinned: false, createdAt: '', updatedAt: '' },
        { id: 'note-2', title: 'Note 2', content: '', tags: [], linkedTaskIds: [], linkedPersonIds: [], isPinned: false, createdAt: '', updatedAt: '' },
      ];
      const people: Person[] = [
        { id: 'person-1', name: 'Person 1', email: '', phone: '', birthday: '', company: '', role: '', notes: '', avatarColor: '#000', interactions: [], linkedTaskIds: [taskId], linkedEventIds: [], linkedNoteIds: [], stayInTouchDays: 0, lastInteractionDate: '', createdAt: '' },
        { id: 'person-2', name: 'Person 2', email: '', phone: '', birthday: '', company: '', role: '', notes: '', avatarColor: '#000', interactions: [], linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], stayInTouchDays: 0, lastInteractionDate: '', createdAt: '' },
      ];
      const transactions: Transaction[] = [
        { id: 'tx-1', title: 'Transaction 1', amount: 100, type: 'expense', category: 'Food', date: '', notes: '', recurring: false, linkedTaskIds: [taskId], linkedPersonIds: [], createdAt: '' },
        { id: 'tx-2', title: 'Transaction 2', amount: 200, type: 'income', category: 'Salary', date: '', notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];

      // When
      const result = cleanupReferencesOnTaskDelete(taskId, { tasks, events, notes, people, transactions });

      // Then
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
      // Given
      const taskId = 'task-1';
      const tasks: Task[] = [
        { id: 'task-2', title: 'Other Task', description: '', status: 'todo', priority: 'medium', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
      ];
      const events: CalendarEvent[] = [
        { id: 'event-1', title: 'Event 1', description: '', startDate: '', endDate: '', allDay: false, color: '#000', recurrence: 'none', linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];
      const notes: Note[] = [
        { id: 'note-1', title: 'Note 1', content: '', tags: [], linkedTaskIds: [], linkedPersonIds: [], isPinned: false, createdAt: '', updatedAt: '' },
      ];
      const people: Person[] = [
        { id: 'person-1', name: 'Person 1', email: '', phone: '', birthday: '', company: '', role: '', notes: '', avatarColor: '#000', interactions: [], linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], stayInTouchDays: 0, lastInteractionDate: '', createdAt: '' },
      ];
      const transactions: Transaction[] = [
        { id: 'tx-1', title: 'Transaction 1', amount: 100, type: 'expense', category: 'Food', date: '', notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];

      // When
      const result = cleanupReferencesOnTaskDelete(taskId, { tasks, events, notes, people, transactions });

      // Then
      expect(result.events).toEqual(events);
      expect(result.notes).toEqual(notes);
      expect(result.people).toEqual(people);
      expect(result.transactions).toEqual(transactions);
    });
  });

  describe('Given an event is deleted', () => {
    it('When the event has inbound references, Then the event ID is removed from all linked arrays', () => {
      // Given
      const eventId = 'event-1';
      const tasks: Task[] = [
        { id: 'task-1', title: 'Task 1', description: '', status: 'todo', priority: 'medium', subtaskIds: [], tags: [], linkedEventIds: [eventId], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
        { id: 'task-2', title: 'Task 2', description: '', status: 'todo', priority: 'low', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
      ];
      const events: CalendarEvent[] = [
        { id: 'event-2', title: 'Event 2', description: '', startDate: '', endDate: '', allDay: false, color: '#000', recurrence: 'none', linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];
      const people: Person[] = [
        { id: 'person-1', name: 'Person 1', email: '', phone: '', birthday: '', company: '', role: '', notes: '', avatarColor: '#000', interactions: [], linkedTaskIds: [], linkedEventIds: [eventId], linkedNoteIds: [], stayInTouchDays: 0, lastInteractionDate: '', createdAt: '' },
        { id: 'person-2', name: 'Person 2', email: '', phone: '', birthday: '', company: '', role: '', notes: '', avatarColor: '#000', interactions: [], linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], stayInTouchDays: 0, lastInteractionDate: '', createdAt: '' },
      ];

      // When
      const result = cleanupReferencesOnEventDelete(eventId, { tasks, events, people });

      // Then
      expect(result.tasks[0].linkedEventIds).not.toContain(eventId);
      expect(result.tasks[1].linkedEventIds).toEqual([]);
      expect(result.people[0].linkedEventIds).not.toContain(eventId);
      expect(result.people[1].linkedEventIds).toEqual([]);
    });

    it('When the event has no inbound references, Then all collections remain unchanged', () => {
      // Given
      const eventId = 'event-1';
      const tasks: Task[] = [
        { id: 'task-1', title: 'Task 1', description: '', status: 'todo', priority: 'medium', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
      ];
      const events: CalendarEvent[] = [
        { id: 'event-2', title: 'Event 2', description: '', startDate: '', endDate: '', allDay: false, color: '#000', recurrence: 'none', linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];
      const people: Person[] = [
        { id: 'person-1', name: 'Person 1', email: '', phone: '', birthday: '', company: '', role: '', notes: '', avatarColor: '#000', interactions: [], linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], stayInTouchDays: 0, lastInteractionDate: '', createdAt: '' },
      ];

      // When
      const result = cleanupReferencesOnEventDelete(eventId, { tasks, events, people });

      // Then
      expect(result.tasks).toEqual(tasks);
      expect(result.events).toEqual(events);
      expect(result.people).toEqual(people);
    });
  });

  describe('Given a note is deleted', () => {
    it('When the note has inbound references, Then the note ID is removed from all linked arrays', () => {
      // Given
      const noteId = 'note-1';
      const tasks: Task[] = [
        { id: 'task-1', title: 'Task 1', description: '', status: 'todo', priority: 'medium', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [noteId], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
        { id: 'task-2', title: 'Task 2', description: '', status: 'todo', priority: 'low', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
      ];
      const notes: Note[] = [
        { id: 'note-2', title: 'Note 2', content: '', tags: [], linkedTaskIds: [], linkedPersonIds: [], isPinned: false, createdAt: '', updatedAt: '' },
      ];
      const people: Person[] = [
        { id: 'person-1', name: 'Person 1', email: '', phone: '', birthday: '', company: '', role: '', notes: '', avatarColor: '#000', interactions: [], linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [noteId], stayInTouchDays: 0, lastInteractionDate: '', createdAt: '' },
        { id: 'person-2', name: 'Person 2', email: '', phone: '', birthday: '', company: '', role: '', notes: '', avatarColor: '#000', interactions: [], linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], stayInTouchDays: 0, lastInteractionDate: '', createdAt: '' },
      ];

      // When
      const result = cleanupReferencesOnNoteDelete(noteId, { tasks, notes, people });

      // Then
      expect(result.tasks[0].linkedNoteIds).not.toContain(noteId);
      expect(result.tasks[1].linkedNoteIds).toEqual([]);
      expect(result.people[0].linkedNoteIds).not.toContain(noteId);
      expect(result.people[1].linkedNoteIds).toEqual([]);
    });

    it('When the note has no inbound references, Then all collections remain unchanged', () => {
      // Given
      const noteId = 'note-1';
      const tasks: Task[] = [
        { id: 'task-1', title: 'Task 1', description: '', status: 'todo', priority: 'medium', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
      ];
      const notes: Note[] = [
        { id: 'note-2', title: 'Note 2', content: '', tags: [], linkedTaskIds: [], linkedPersonIds: [], isPinned: false, createdAt: '', updatedAt: '' },
      ];
      const people: Person[] = [
        { id: 'person-1', name: 'Person 1', email: '', phone: '', birthday: '', company: '', role: '', notes: '', avatarColor: '#000', interactions: [], linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], stayInTouchDays: 0, lastInteractionDate: '', createdAt: '' },
      ];

      // When
      const result = cleanupReferencesOnNoteDelete(noteId, { tasks, notes, people });

      // Then
      expect(result.tasks).toEqual(tasks);
      expect(result.notes).toEqual(notes);
      expect(result.people).toEqual(people);
    });
  });

  describe('Given a person is deleted', () => {
    it('When the person has inbound references, Then the person ID is removed from all linked arrays', () => {
      // Given
      const personId = 'person-1';
      const tasks: Task[] = [
        { id: 'task-1', title: 'Task 1', description: '', status: 'todo', priority: 'medium', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [personId], linkedTransactionIds: [], createdAt: '' },
        { id: 'task-2', title: 'Task 2', description: '', status: 'todo', priority: 'low', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
      ];
      const events: CalendarEvent[] = [
        { id: 'event-1', title: 'Event 1', description: '', startDate: '', endDate: '', allDay: false, color: '#000', recurrence: 'none', linkedTaskIds: [], linkedPersonIds: [personId], createdAt: '' },
        { id: 'event-2', title: 'Event 2', description: '', startDate: '', endDate: '', allDay: false, color: '#000', recurrence: 'none', linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];
      const notes: Note[] = [
        { id: 'note-1', title: 'Note 1', content: '', tags: [], linkedTaskIds: [], linkedPersonIds: [personId], isPinned: false, createdAt: '', updatedAt: '' },
        { id: 'note-2', title: 'Note 2', content: '', tags: [], linkedTaskIds: [], linkedPersonIds: [], isPinned: false, createdAt: '', updatedAt: '' },
      ];
      const people: Person[] = [
        { id: 'person-2', name: 'Person 2', email: '', phone: '', birthday: '', company: '', role: '', notes: '', avatarColor: '#000', interactions: [], linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], stayInTouchDays: 0, lastInteractionDate: '', createdAt: '' },
      ];
      const transactions: Transaction[] = [
        { id: 'tx-1', title: 'Transaction 1', amount: 100, type: 'expense', category: 'Food', date: '', notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [personId], createdAt: '' },
        { id: 'tx-2', title: 'Transaction 2', amount: 200, type: 'income', category: 'Salary', date: '', notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];

      // When
      const result = cleanupReferencesOnPersonDelete(personId, { tasks, events, notes, people, transactions });

      // Then
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
      // Given
      const personId = 'person-1';
      const tasks: Task[] = [
        { id: 'task-1', title: 'Task 1', description: '', status: 'todo', priority: 'medium', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
      ];
      const events: CalendarEvent[] = [
        { id: 'event-1', title: 'Event 1', description: '', startDate: '', endDate: '', allDay: false, color: '#000', recurrence: 'none', linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];
      const notes: Note[] = [
        { id: 'note-1', title: 'Note 1', content: '', tags: [], linkedTaskIds: [], linkedPersonIds: [], isPinned: false, createdAt: '', updatedAt: '' },
      ];
      const people: Person[] = [
        { id: 'person-2', name: 'Person 2', email: '', phone: '', birthday: '', company: '', role: '', notes: '', avatarColor: '#000', interactions: [], linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [], stayInTouchDays: 0, lastInteractionDate: '', createdAt: '' },
      ];
      const transactions: Transaction[] = [
        { id: 'tx-1', title: 'Transaction 1', amount: 100, type: 'expense', category: 'Food', date: '', notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];

      // When
      const result = cleanupReferencesOnPersonDelete(personId, { tasks, events, notes, people, transactions });

      // Then
      expect(result.tasks).toEqual(tasks);
      expect(result.events).toEqual(events);
      expect(result.notes).toEqual(notes);
      expect(result.people).toEqual(people);
      expect(result.transactions).toEqual(transactions);
    });
  });

  describe('Given a transaction is deleted', () => {
    it('When the transaction has inbound references, Then the transaction ID is removed from all linked arrays', () => {
      // Given
      const transactionId = 'tx-1';
      const tasks: Task[] = [
        { id: 'task-1', title: 'Task 1', description: '', status: 'todo', priority: 'medium', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [transactionId], createdAt: '' },
        { id: 'task-2', title: 'Task 2', description: '', status: 'todo', priority: 'low', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
      ];
      const transactions: Transaction[] = [
        { id: 'tx-2', title: 'Transaction 2', amount: 200, type: 'income', category: 'Salary', date: '', notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];

      // When
      const result = cleanupReferencesOnTransactionDelete(transactionId, { tasks, transactions });

      // Then
      expect(result.tasks[0].linkedTransactionIds).not.toContain(transactionId);
      expect(result.tasks[1].linkedTransactionIds).toEqual([]);
    });

    it('When the transaction has no inbound references, Then all collections remain unchanged', () => {
      // Given
      const transactionId = 'tx-1';
      const tasks: Task[] = [
        { id: 'task-1', title: 'Task 1', description: '', status: 'todo', priority: 'medium', subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [], createdAt: '' },
      ];
      const transactions: Transaction[] = [
        { id: 'tx-2', title: 'Transaction 2', amount: 200, type: 'income', category: 'Salary', date: '', notes: '', recurring: false, linkedTaskIds: [], linkedPersonIds: [], createdAt: '' },
      ];

      // When
      const result = cleanupReferencesOnTransactionDelete(transactionId, { tasks, transactions });

      // Then
      expect(result.tasks).toEqual(tasks);
      expect(result.transactions).toEqual(transactions);
    });
  });
});
