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
 * Reference Cleanup Orchestrator
 * 
 * A narrow orchestration boundary that coordinates reference cleanup
 * across context providers when entities are deleted.
 * 
 * This orchestrator accepts callback functions to fetch current state
 * from each context and returns the updated state that should be applied.
 * This keeps contexts decoupled while ensuring consistent reference cleanup.
 */

export interface ContextStateAccessors {
  getTasks: () => Task[];
  getEvents: () => CalendarEvent[];
  getNotes: () => Note[];
  getPeople: () => Person[];
  getTransactions: () => Transaction[];
}

export interface CleanupResult {
  updatedTasks?: Task[];
  updatedEvents?: CalendarEvent[];
  updatedNotes?: Note[];
  updatedPeople?: Person[];
  updatedTransactions?: Transaction[];
}

/**
 * Orchestrates reference cleanup when a task is deleted.
 * 
 * @param taskId - The ID of the task being deleted
 * @param accessors - Functions to fetch current state from all contexts
 * @returns Updated collections that should be applied to their respective contexts
 */
export function orchestrateTaskDeleteCleanup(
  taskId: string,
  accessors: ContextStateAccessors
): CleanupResult {
  const collections: TaskCollections = {
    tasks: accessors.getTasks(),
    events: accessors.getEvents(),
    notes: accessors.getNotes(),
    people: accessors.getPeople(),
    transactions: accessors.getTransactions(),
  };

  const result = cleanupReferencesOnTaskDelete(taskId, collections);

  return {
    updatedEvents: result.events,
    updatedNotes: result.notes,
    updatedPeople: result.people,
    updatedTransactions: result.transactions,
  };
}

/**
 * Orchestrates reference cleanup when an event is deleted.
 * 
 * @param eventId - The ID of the event being deleted
 * @param accessors - Functions to fetch current state from all contexts
 * @returns Updated collections that should be applied to their respective contexts
 */
export function orchestrateEventDeleteCleanup(
  eventId: string,
  accessors: ContextStateAccessors
): CleanupResult {
  const collections: EventCollections = {
    tasks: accessors.getTasks(),
    events: accessors.getEvents(),
    people: accessors.getPeople(),
  };

  const result = cleanupReferencesOnEventDelete(eventId, collections);

  return {
    updatedTasks: result.tasks,
    updatedPeople: result.people,
  };
}

/**
 * Orchestrates reference cleanup when a note is deleted.
 * 
 * @param noteId - The ID of the note being deleted
 * @param accessors - Functions to fetch current state from all contexts
 * @returns Updated collections that should be applied to their respective contexts
 */
export function orchestrateNoteDeleteCleanup(
  noteId: string,
  accessors: ContextStateAccessors
): CleanupResult {
  const collections: NoteCollections = {
    tasks: accessors.getTasks(),
    notes: accessors.getNotes(),
    people: accessors.getPeople(),
  };

  const result = cleanupReferencesOnNoteDelete(noteId, collections);

  return {
    updatedTasks: result.tasks,
    updatedPeople: result.people,
  };
}

/**
 * Orchestrates reference cleanup when a person is deleted.
 * 
 * @param personId - The ID of the person being deleted
 * @param accessors - Functions to fetch current state from all contexts
 * @returns Updated collections that should be applied to their respective contexts
 */
export function orchestratePersonDeleteCleanup(
  personId: string,
  accessors: ContextStateAccessors
): CleanupResult {
  const collections: PersonCollections = {
    tasks: accessors.getTasks(),
    events: accessors.getEvents(),
    notes: accessors.getNotes(),
    people: accessors.getPeople(),
    transactions: accessors.getTransactions(),
  };

  const result = cleanupReferencesOnPersonDelete(personId, collections);

  return {
    updatedTasks: result.tasks,
    updatedEvents: result.events,
    updatedNotes: result.notes,
    updatedTransactions: result.transactions,
  };
}

/**
 * Orchestrates reference cleanup when a transaction is deleted.
 * 
 * @param transactionId - The ID of the transaction being deleted
 * @param accessors - Functions to fetch current state from all contexts
 * @returns Updated collections that should be applied to their respective contexts
 */
export function orchestrateTransactionDeleteCleanup(
  transactionId: string,
  accessors: ContextStateAccessors
): CleanupResult {
  const collections: TransactionCollections = {
    tasks: accessors.getTasks(),
    transactions: accessors.getTransactions(),
  };

  const result = cleanupReferencesOnTransactionDelete(transactionId, collections);

  return {
    updatedTasks: result.tasks,
  };
}
