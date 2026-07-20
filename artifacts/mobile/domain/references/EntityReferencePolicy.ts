/**
 * Entity Reference Policy
 *
 * A domain service that enforces reference integrity across entity aggregates.
 * Operates on feature-neutral DTOs so it can be consumed by any persistence
 * adapter without importing React contexts or storage details.
 *
 * This follows DDD aggregate boundary principles:
 * - References are by identity only (IDs, not object references)
 * - Cleanup is eventual consistency across aggregates
 * - Each aggregate maintains its own consistency boundary
 *
 * The policy is pure: it transforms input collections without side effects,
 * making it testable and predictable.
 */

export interface TaskDto {
  id: string;
  linkedEventIds: string[];
  linkedNoteIds: string[];
  linkedPersonIds: string[];
  linkedTransactionIds: string[];
}

export interface EventDto {
  id: string;
  linkedTaskIds: string[];
  linkedPersonIds: string[];
}

export interface NoteDto {
  id: string;
  linkedTaskIds: string[];
  linkedPersonIds: string[];
}

export interface PersonDto {
  id: string;
  linkedTaskIds: string[];
  linkedEventIds: string[];
  linkedNoteIds: string[];
  linkedTransactionIds: string[];
}

export interface TransactionDto {
  id: string;
  linkedTaskIds: string[];
  linkedPersonIds: string[];
}

export interface EntityCollections {
  tasks: TaskDto[];
  events: EventDto[];
  notes: NoteDto[];
  people: PersonDto[];
  transactions: TransactionDto[];
}

export type TaskCollections = EntityCollections;

export type EventCollections = Pick<EntityCollections, 'tasks' | 'events' | 'people'>;

export type NoteCollections = Pick<EntityCollections, 'tasks' | 'notes' | 'people'>;

export type PersonCollections = EntityCollections;

export type TransactionCollections = Pick<EntityCollections, 'tasks' | 'transactions'>;

/**
 * Removes a task ID from all inbound linked arrays across the system.
 * 
 * Given a deleted task ID, this function removes that ID from:
 * - Events.linkedTaskIds
 * - Notes.linkedTaskIds
 * - People.linkedTaskIds
 * - Transactions.linkedTaskIds
 * 
 * @param taskId - The ID of the deleted task
 * @param collections - All entity collections that may reference tasks
 * @returns Updated collections with the task ID removed from inbound references
 */
export function cleanupReferencesOnTaskDelete(
  taskId: string,
  collections: TaskCollections
): TaskCollections {
  const { tasks, events, notes, people, transactions } = collections;

  return {
    tasks,
    events: events.map(event => ({
      ...event,
      linkedTaskIds: event.linkedTaskIds.filter(id => id !== taskId),
    })),
    notes: notes.map(note => ({
      ...note,
      linkedTaskIds: note.linkedTaskIds.filter(id => id !== taskId),
    })),
    people: people.map(person => ({
      ...person,
      linkedTaskIds: person.linkedTaskIds.filter(id => id !== taskId),
    })),
    transactions: transactions.map(transaction => ({
      ...transaction,
      linkedTaskIds: transaction.linkedTaskIds.filter(id => id !== taskId),
    })),
  };
}

/**
 * Removes an event ID from all inbound linked arrays across the system.
 * 
 * Given a deleted event ID, this function removes that ID from:
 * - Tasks.linkedEventIds
 * - People.linkedEventIds
 * 
 * @param eventId - The ID of the deleted event
 * @param collections - All entity collections that may reference events
 * @returns Updated collections with the event ID removed from inbound references
 */
export function cleanupReferencesOnEventDelete(
  eventId: string,
  collections: EventCollections
): EventCollections {
  const { tasks, events, people } = collections;

  return {
    tasks: tasks.map(task => ({
      ...task,
      linkedEventIds: task.linkedEventIds.filter(id => id !== eventId),
    })),
    events,
    people: people.map(person => ({
      ...person,
      linkedEventIds: person.linkedEventIds.filter(id => id !== eventId),
    })),
  };
}

/**
 * Removes a note ID from all inbound linked arrays across the system.
 * 
 * Given a deleted note ID, this function removes that ID from:
 * - Tasks.linkedNoteIds
 * - People.linkedNoteIds
 * 
 * @param noteId - The ID of the deleted note
 * @param collections - All entity collections that may reference notes
 * @returns Updated collections with the note ID removed from inbound references
 */
export function cleanupReferencesOnNoteDelete(
  noteId: string,
  collections: NoteCollections
): NoteCollections {
  const { tasks, notes, people } = collections;

  return {
    tasks: tasks.map(task => ({
      ...task,
      linkedNoteIds: task.linkedNoteIds.filter(id => id !== noteId),
    })),
    notes,
    people: people.map(person => ({
      ...person,
      linkedNoteIds: person.linkedNoteIds.filter(id => id !== noteId),
    })),
  };
}

/**
 * Removes a person ID from all inbound linked arrays across the system.
 * 
 * Given a deleted person ID, this function removes that ID from:
 * - Tasks.linkedPersonIds
 * - Events.linkedPersonIds
 * - Notes.linkedPersonIds
 * - Transactions.linkedPersonIds
 * 
 * @param personId - The ID of the deleted person
 * @param collections - All entity collections that may reference people
 * @returns Updated collections with the person ID removed from inbound references
 */
export function cleanupReferencesOnPersonDelete(
  personId: string,
  collections: PersonCollections
): PersonCollections {
  const { tasks, events, notes, people, transactions } = collections;

  return {
    tasks: tasks.map(task => ({
      ...task,
      linkedPersonIds: task.linkedPersonIds.filter(id => id !== personId),
    })),
    events: events.map(event => ({
      ...event,
      linkedPersonIds: event.linkedPersonIds.filter(id => id !== personId),
    })),
    notes: notes.map(note => ({
      ...note,
      linkedPersonIds: note.linkedPersonIds.filter(id => id !== personId),
    })),
    people,
    transactions: transactions.map(transaction => ({
      ...transaction,
      linkedPersonIds: transaction.linkedPersonIds.filter(id => id !== personId),
    })),
  };
}

/**
 * Removes a transaction ID from all inbound linked arrays across the system.
 * 
 * Given a deleted transaction ID, this function removes that ID from:
 * - Tasks.linkedTransactionIds
 * 
 * @param transactionId - The ID of the deleted transaction
 * @param collections - All entity collections that may reference transactions
 * @returns Updated collections with the transaction ID removed from inbound references
 */
export function cleanupReferencesOnTransactionDelete(
  transactionId: string,
  collections: TransactionCollections
): TransactionCollections {
  const { tasks, transactions } = collections;

  return {
    tasks: tasks.map(task => ({
      ...task,
      linkedTransactionIds: task.linkedTransactionIds.filter(id => id !== transactionId),
    })),
    transactions,
  };
}
