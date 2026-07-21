// Given/When/Then tests for the profile application boundary.
// These tests prove owner isolation, validation, conflict semantics, and
// permanent deletion without touching a real database.
import { beforeEach, describe, expect, it } from "@jest/globals";
import { type Clock, type EntityId, createEntityId, err, ok } from "@workspace/domain-core";
import { createActor, type AuthenticatedActor } from "../identity/actor";
import {
  type Profile,
  type ProfileError,
  type ProfileRepository,
  createDefaultProfile,
  createUserId,
} from "./ProfileRepository";
import { deleteProfile, getProfile, updateProfile } from "./profile";

function makeActor(userId: string): AuthenticatedActor {
  return createActor(userId);
}

function makeIncrementingClock(base = 1_000_000_000): Clock {
  let calls = 1;
  return {
    now: () => new Date(base + calls++ * 60_000),
  };
}

function makeProfile(
  userId: string,
  overrides: Partial<Omit<Profile, "id" | "createdAt" | "updatedAt">> = {},
): Profile {
  const id = createUserId(userId);
  const now = new Date(1_000_000_000);
  return {
    ...createDefaultProfile(id, now),
    ...overrides,
    id,
    createdAt: now,
    updatedAt: now,
  };
}

function makeInMemoryProfileRepository(initialProfiles: Profile[] = []): ProfileRepository {
  const store = new Map<string, Profile>();
  for (const profile of initialProfiles) {
    store.set(profile.id, profile);
  }

  return {
    async getByUserId(userId: EntityId<"user">) {
      const profile = store.get(userId);
      if (!profile) return err({ kind: "not-found" });
      return ok(profile);
    },
    async save(profile: Profile) {
      store.set(profile.id, profile);
      return ok(profile);
    },
    async deleteByUserId(userId: EntityId<"user">) {
      store.delete(userId);
      return ok(undefined);
    },
  };
}

describe("Profile application boundary", () => {
  describe("getProfile", () => {
    it("Given no profile for the actor, when retrieving, then returns not-found", async () => {
      const repo = makeInMemoryProfileRepository();

      const result = await getProfile(makeActor("user-123"), { repo });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("not-found");
      }
    });

    it("Given a profile exists for the actor, when retrieving, then returns their profile", async () => {
      const profile = makeProfile("user-123", { name: "Alice" });
      const repo = makeInMemoryProfileRepository([profile]);

      const result = await getProfile(makeActor("user-123"), { repo });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(profile.id);
        expect(result.value.name).toBe("Alice");
      }
    });

    it("Given profiles for two users, when actor A retrieves, then only A's profile is returned", async () => {
      const alice = makeProfile("user-a", { name: "Alice" });
      const bob = makeProfile("user-b", { name: "Bob" });
      const repo = makeInMemoryProfileRepository([alice, bob]);

      const result = await getProfile(makeActor("user-a"), { repo });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe("Alice");
      }
    });
  });

  describe("updateProfile", () => {
    it("Given a valid update for an existing profile, when updating, then it persists and returns the updated profile", async () => {
      const clock = makeIncrementingClock();
      const profile = makeProfile("user-123", { name: "Alice" });
      const repo = makeInMemoryProfileRepository([profile]);

      const result = await updateProfile(
        makeActor("user-123"),
        { name: "Alice Updated" },
        { repo, clock },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe("Alice Updated");
        expect(result.value.updatedAt.getTime()).toBeGreaterThan(profile.updatedAt.getTime());
      }
      const stored = await repo.getByUserId(createUserId("user-123"));
      expect(stored.ok).toBe(true);
      if (stored.ok) {
        expect(stored.value.name).toBe("Alice Updated");
      }
    });

    it("Given actor A and actor B have profiles, when A updates, then B's profile is unchanged", async () => {
      const clock = makeIncrementingClock();
      const alice = makeProfile("user-a", { name: "Alice" });
      const bob = makeProfile("user-b", { name: "Bob" });
      const repo = makeInMemoryProfileRepository([alice, bob]);

      const result = await updateProfile(
        makeActor("user-a"),
        { name: "Alicia" },
        { repo, clock },
      );

      expect(result.ok).toBe(true);
      const bobResult = await repo.getByUserId(createUserId("user-b"));
      expect(bobResult.ok).toBe(true);
      if (bobResult.ok) {
        expect(bobResult.value.name).toBe("Bob");
      }
    });

    it("Given an invalid privacy value, when updating, then returns validation error", async () => {
      const clock = makeIncrementingClock();
      const repo = makeInMemoryProfileRepository([makeProfile("user-123")]);

      const result = await updateProfile(
        makeActor("user-123"),
        { privacy: { bio: "everyone" } } as Record<string, unknown>,
        { repo, clock },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("validation");
      }
    });

    it("Given onboarded is not a boolean, when updating, then returns validation error", async () => {
      const clock = makeIncrementingClock();
      const repo = makeInMemoryProfileRepository([makeProfile("user-123")]);

      const result = await updateProfile(
        makeActor("user-123"),
        { onboarded: "yes" } as Record<string, unknown>,
        { repo, clock },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("validation");
      }
    });

    it("Given a stale updatedAt, when updating, then returns conflict", async () => {
      const clock = makeIncrementingClock();
      const profile = makeProfile("user-123", { name: "Alice" });
      const repo = makeInMemoryProfileRepository([profile]);

      const result = await updateProfile(
        makeActor("user-123"),
        {
          name: "Alice Updated",
          updatedAt: new Date(profile.updatedAt.getTime() - 1),
        },
        { repo, clock },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("conflict");
      }
      const stored = await repo.getByUserId(createUserId("user-123"));
      expect(stored.ok).toBe(true);
      if (stored.ok) {
        expect(stored.value.name).toBe("Alice");
      }
    });

    it("Given no profile exists, when updating with valid data, then creates a new profile", async () => {
      const clock = makeIncrementingClock();
      const repo = makeInMemoryProfileRepository();

      const result = await updateProfile(
        makeActor("user-123"),
        { name: "New User" },
        { repo, clock },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe("New User");
        expect(result.value.username).toBe("");
      }
      const stored = await repo.getByUserId(createUserId("user-123"));
      expect(stored.ok).toBe(true);
    });
  });

  describe("deleteProfile", () => {
    it("Given an existing profile, when deleting, then it is permanently removed and subsequent retrieval is not-found", async () => {
      const repo = makeInMemoryProfileRepository([
        makeProfile("user-123", { name: "Alice" }),
      ]);

      const deleteResult = await deleteProfile(makeActor("user-123"), { repo });

      expect(deleteResult.ok).toBe(true);
      const getResult = await getProfile(makeActor("user-123"), { repo });
      expect(getResult.ok).toBe(false);
      if (!getResult.ok) {
        expect(getResult.error.kind).toBe("not-found");
      }
    });

    it("Given two profiles, when deleting A, then B's profile remains", async () => {
      const repo = makeInMemoryProfileRepository([
        makeProfile("user-a"),
        makeProfile("user-b"),
      ]);

      await deleteProfile(makeActor("user-a"), { repo });

      const bobResult = await repo.getByUserId(createUserId("user-b"));
      expect(bobResult.ok).toBe(true);
    });
  });
});
