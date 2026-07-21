// Given/When/Then tests for the authenticated profile HTTP adapter.
// These tests prove that profile routes translate HTTP to the application
// use cases, enforce authentication, reject client-owned identity headers,
// and return status codes that match the OpenAPI contract.
import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import express from "express";
import { type Clock, systemClock } from "@workspace/domain-core";
import { createApiRouter } from "./index";
import { createTestAuthVerifier } from "../middlewares/test-verifier";
import { createActor, type AuthenticatedActor } from "../application/identity/actor";
import {
  type Profile,
  type ProfileRepository,
  createDefaultProfile,
  createUserId,
} from "../application/profile/ProfileRepository";

const VALID_TOKEN = "valid-token";
const INVALID_TOKEN = "invalid-token";
const USER_A = "user-a";
const USER_B = "user-b";

function makeActor(userId: string): AuthenticatedActor {
  return createActor(userId);
}

function makeClock(base = 1_000_000_000_000): Clock {
  let calls = 0;
  return {
    now: () => new Date(base + ++calls * 60_000),
  };
}

function makeProfile(
  userId: string,
  overrides: Partial<Omit<Profile, "id" | "createdAt" | "updatedAt">> = {},
  now = new Date(1_000_000_000),
): Profile {
  const id = createUserId(userId);
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
    async getByUserId(userId) {
      const profile = store.get(userId);
      if (!profile) return { ok: false, error: { kind: "not-found" } };
      return { ok: true, value: profile };
    },
    async save(profile) {
      store.set(profile.id, profile);
      return { ok: true, value: profile };
    },
    async deleteByUserId(userId) {
      store.delete(userId);
      return { ok: true, value: undefined };
    },
  };
}

function createTestApp(deps: { repo?: ProfileRepository; clock?: Clock } = {}) {
  const app = express();
  app.use(express.json());
  const verifier = createTestAuthVerifier({
    [VALID_TOKEN]: makeActor(USER_A),
  });
  app.use(
    "/api",
    createApiRouter(verifier, {
      repo: deps.repo ?? makeInMemoryProfileRepository(),
      clock: deps.clock ?? systemClock,
    }),
  );
  return app;
}

describe("Profile API Routes", () => {
  describe("GET /api/profile", () => {
    it("Given an authenticated user with a profile, when requesting their profile, then returns their profile data", async () => {
      const repo = makeInMemoryProfileRepository([
        makeProfile(USER_A, { name: "Alice" }),
      ]);
      const app = createTestApp({ repo });

      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(USER_A);
      expect(response.body.name).toBe("Alice");
      expect(response.body.privacy).toEqual({
        bio: "public",
        birthday: "friends",
        location: "public",
        occupation: "public",
        website: "public",
        phone: "private",
        email: "private",
        about: "public",
        pronouns: "public",
        socialLinks: "public",
      });
    });

    it("Given an authenticated user without a profile, when requesting their profile, then returns 404", async () => {
      const app = createTestApp({ repo: makeInMemoryProfileRepository() });

      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Profile not found");
    });

    it("Given no authentication, when requesting profile, then returns 401", async () => {
      const app = createTestApp();

      const response = await request(app).get("/api/profile");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("Given an invalid bearer token, when requesting profile, then returns 401", async () => {
      const app = createTestApp();

      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${INVALID_TOKEN}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("Given a request with a client-owned X-User-Id header, when requesting profile, then returns 401", async () => {
      const app = createTestApp();

      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .set("X-User-Id", USER_B);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("Given two users have profiles, when user A requests their profile, then only user A's data is returned", async () => {
      const repo = makeInMemoryProfileRepository([
        makeProfile(USER_A, { name: "Alice" }),
        makeProfile(USER_B, { name: "Bob" }),
      ]);
      const app = createTestApp({ repo });

      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Alice");
    });
  });

  describe("PUT /api/profile", () => {
    it("Given a valid update for an existing profile, when updating, then returns the updated profile and persists changes", async () => {
      const clock = makeClock();
      const repo = makeInMemoryProfileRepository([
        makeProfile(USER_A, { name: "Alice" }, clock.now()),
      ]);
      const app = createTestApp({ repo, clock });

      const response = await request(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ name: "Alice Updated" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Alice Updated");
      expect(response.body.id).toBe(USER_A);

      const stored = await repo.getByUserId(createUserId(USER_A));
      expect(stored.ok).toBe(true);
      if (stored.ok) {
        expect(stored.value.name).toBe("Alice Updated");
      }
    });

    it("Given no existing profile, when updating with valid data, then creates a new profile", async () => {
      const app = createTestApp();

      const response = await request(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ name: "New User" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("New User");
      expect(response.body.id).toBe(USER_A);
    });

    it("Given an invalid request body, when updating, then returns 400 validation error", async () => {
      const app = createTestApp();

      const response = await request(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ onboarded: "yes" });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/onboarded/);
    });

    it("Given a stale updatedAt timestamp, when updating, then returns 409 conflict", async () => {
      const existingUpdatedAt = new Date(1_000_000_000);
      const repo = makeInMemoryProfileRepository([
        makeProfile(USER_A, { name: "Alice" }, existingUpdatedAt),
      ]);
      const app = createTestApp({ repo });

      const response = await request(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({
          name: "Alice Updated",
          updatedAt: new Date(existingUpdatedAt.getTime() - 1).toISOString(),
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/modified/);
    });

    it("Given no authentication, when updating profile, then returns 401", async () => {
      const app = createTestApp();

      const response = await request(app)
        .put("/api/profile")
        .send({ name: "Hacked" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("Given a request with a client-owned X-User-Id header, when updating profile, then returns 401", async () => {
      const app = createTestApp();

      const response = await request(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .set("X-User-Id", USER_B)
        .send({ name: "Hacked" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });
  });

  describe("DELETE /api/profile", () => {
    it("Given an existing profile, when deleting, then returns 204 and subsequent retrieval is not found", async () => {
      const repo = makeInMemoryProfileRepository([
        makeProfile(USER_A, { name: "Alice" }),
      ]);
      const app = createTestApp({ repo });

      const response = await request(app)
        .delete("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(204);

      const getResponse = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);

      expect(getResponse.status).toBe(404);
    });

    it("Given no existing profile, when deleting, then returns 404", async () => {
      const app = createTestApp();

      const response = await request(app)
        .delete("/api/profile")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Profile not found");
    });

    it("Given no authentication, when deleting profile, then returns 401", async () => {
      const app = createTestApp();

      const response = await request(app).delete("/api/profile");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });
  });
});
