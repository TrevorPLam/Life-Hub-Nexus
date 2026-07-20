import express from "express";
import request from "supertest";
import { describe, expect, it } from "@jest/globals";
import { createActor, type AuthVerifier } from "../application/identity/actor";
import { createAuthMiddleware } from "./auth";
import { createPlaceholderAuthVerifier } from "./placeholder-verifier";
import { createTestAuthVerifier } from "./test-verifier";

const VALID_TOKEN = "valid-token";
const testActor = createActor("user-123");

function createTestApp(verifier: AuthVerifier) {
  const app = express();
  app.use(express.json());
  app.use(createAuthMiddleware(verifier));
  app.get("/test", (req, res) => {
    const actor = req.actor;
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json({ userId: actor.userId });
  });
  return app;
}

describe("Authentication middleware", () => {
  const verifier = createTestAuthVerifier({ [VALID_TOKEN]: testActor });

  it("Given no Authorization header, when a request reaches a protected route, then it returns 401", async () => {
    const response = await request(createTestApp(verifier)).get("/test");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("Given an Authorization header without a Bearer prefix, when a request reaches a protected route, then it returns 401", async () => {
    const response = await request(createTestApp(verifier))
      .get("/test")
      .set("Authorization", "Basic token");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("Given an invalid bearer token, when a request reaches a protected route, then it returns 401", async () => {
    const response = await request(createTestApp(verifier))
      .get("/test")
      .set("Authorization", "Bearer invalid-token");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("Given a valid bearer token, when a request reaches a protected route, then it attaches the verified actor and proceeds", async () => {
    const response = await request(createTestApp(verifier))
      .get("/test")
      .set("Authorization", `Bearer ${VALID_TOKEN}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: "user-123" });
  });

  it("Given an X-User-Id header alongside a valid token, when a request reaches a protected route, then it returns 401 and ignores the header", async () => {
    const response = await request(createTestApp(verifier))
      .get("/test")
      .set("Authorization", `Bearer ${VALID_TOKEN}`)
      .set("X-User-Id", "user-456");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
    expect(response.body).not.toHaveProperty("userId");
  });

  it("Given the placeholder verifier, when any token is presented, then it returns 401", async () => {
    const response = await request(
      createTestApp(createPlaceholderAuthVerifier()),
    )
      .get("/test")
      .set("Authorization", "Bearer any-token");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });
});
