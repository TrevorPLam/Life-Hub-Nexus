import { Router, type IRouter } from "express";
import type { Clock } from "@workspace/domain-core";
import { createAuthMiddleware } from "../middlewares/auth";
import type { AuthVerifier } from "../application/identity/actor";
import type { ProfileRepository } from "../application/profile/ProfileRepository";
import healthRouter from "./health";
import { createProfileRouter, type ProfileRouterDependencies } from "./profile";

export interface ApiRouterDependencies {
  repo: ProfileRepository;
  clock: Clock;
}

export function createApiRouter(
  verifier: AuthVerifier,
  deps: ApiRouterDependencies,
): IRouter {
  const router: IRouter = Router();

  // Health check stays unauthenticated.
  router.use(healthRouter);

  // Profile routes require a verified actor identity.
  router.use(
    createAuthMiddleware(verifier),
    createProfileRouter(deps as ProfileRouterDependencies),
  );

  return router;
}
