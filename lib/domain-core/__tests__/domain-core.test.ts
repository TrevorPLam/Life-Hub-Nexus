import {
  createEntityId,
  createFixedClock,
  createSequenceIdGenerator,
  err,
  ok,
  systemClock,
} from "../src/index.js";

describe("EntityId branding", () => {
  it("Given a raw value and a tag, when createEntityId is called, then it returns the raw value as an EntityId", () => {
    const taskId = createEntityId("task-123", "task");

    expect(taskId).toBe("task-123");
    expect(typeof taskId).toBe("string");
  });

  it("Given two tags and the same raw value, when createEntityId is called for each, then the runtime values are identical strings", () => {
    // The compile-time tags make EntityId<"task"> and EntityId<"note">
    // incompatible types, but at runtime both are plain strings with zero cost.
    const taskId = createEntityId("shared-id", "task");
    const noteId = createEntityId("shared-id", "note");

    expect(taskId).toBe(noteId);
  });
});

describe("Result type", () => {
  it("Given a value, when ok() is called, then it returns a success Result containing the value", () => {
    const result = ok(42);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it("Given an error value, when err() is called, then it returns a failure Result containing the error", () => {
    const error = { type: "missing", message: "not found" } as const;
    const result = err(error);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toEqual(error);
    }
  });
});

describe("Clock", () => {
  it("Given a fixed point in time, when a fixed clock is created, then now() returns that exact time", () => {
    const time = new Date("2024-01-15T08:00:00.000Z");
    const clock = createFixedClock(time);

    expect(clock.now().toISOString()).toBe(time.toISOString());
  });

  it("Given the system clock, when now() is called, then it returns a Date within the current wall-clock interval", () => {
    const before = Date.now();
    const now = systemClock.now().getTime();
    const after = Date.now();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after);
  });
});

describe("IdGenerator", () => {
  it("Given a sequence generator, when nextId is called repeatedly, then it returns deterministic sequential identifiers", () => {
    const generator = createSequenceIdGenerator({ prefix: "id-", start: 0 });

    expect(generator.nextId()).toBe("id-1");
    expect(generator.nextId()).toBe("id-2");
    expect(generator.nextId()).toBe("id-3");
  });

  it("Given two sequence generators, when nextId is called on each, then each generator maintains its own independent counter", () => {
    const first = createSequenceIdGenerator({ prefix: "a-", start: 0 });
    const second = createSequenceIdGenerator({ prefix: "b-", start: 0 });

    expect(first.nextId()).toBe("a-1");
    expect(second.nextId()).toBe("b-1");
    expect(first.nextId()).toBe("a-2");
    expect(second.nextId()).toBe("b-2");
  });
});
