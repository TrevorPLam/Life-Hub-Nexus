// Shared domain primitives: branded identifiers, result type, clock, and id generator.
// This module is runtime-neutral and does not import React Native, Node-only, or UI types.

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

/**
 * Attaches a compile-time tag to a primitive value so that different logical
 * types (e.g. a TaskId and a NoteId) cannot be used interchangeably.
 */
export type Brand<T, TTag extends string> = T & {
  readonly __brand: TTag;
};

/**
 * A strongly-typed entity identifier. Two `EntityId`s with different tags are
 * incompatible at compile time while remaining plain strings at runtime.
 */
export type EntityId<TTag extends string = string> = Brand<
  string,
  `entity:${TTag}`
>;

/**
 * Creates an {@link EntityId} from a raw string value. The tag is used only for
 * type-level differentiation and is erased at runtime.
 */
export function createEntityId<TTag extends string>(
  value: string,
  _tag: TTag,
): EntityId<TTag> {
  return value as EntityId<TTag>;
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

/**
 * Explicit success/failure discriminated union. Keeps expected failures
 * visible in the function signature without using exceptions.
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Constructs a successful {@link Result}.
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Constructs a failed {@link Result}.
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------

/**
 * Port for reading the current time. Production adapters delegate to the
 * runtime clock; test adapters return a fixed, deterministic value.
 */
export interface Clock {
  now(): Date;
}

/**
 * Production clock backed by the runtime `Date` implementation.
 */
export const systemClock: Clock = {
  now: () => new Date(),
};

/**
 * Test clock that always returns a defensive copy of the supplied fixed time.
 */
export function createFixedClock(fixed: Date): Clock {
  return {
    now: () => new Date(fixed),
  };
}

// ---------------------------------------------------------------------------
// Id generator
// ---------------------------------------------------------------------------

/**
 * Port for generating identifiers. Domain code depends on this interface so
 * tests can replace random/time-based generation with deterministic sequences.
 */
export interface IdGenerator {
  nextId(): string;
}

/**
 * Creates a deterministic {@link IdGenerator} that emits sequential identifiers.
 * The counter starts at `start` (default `0`) and the `prefix` is prepended to
 * each generated value.
 */
export function createSequenceIdGenerator(options?: {
  readonly prefix?: string;
  readonly start?: number;
}): IdGenerator {
  const prefix = options?.prefix ?? "";
  let counter = options?.start ?? 0;

  return {
    nextId: () => {
      counter += 1;
      return `${prefix}${counter}`;
    },
  };
}
