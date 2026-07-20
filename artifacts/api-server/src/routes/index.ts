import { Router, type IRouter } from "express";
import { createAuthMiddleware } from "../middlewares/auth";
import type { AuthVerifier } from "../application/identity/actor";
import healthRouter from "./health";
import profileRouter from "./profile";

export function createApiRouter(verifier: AuthVerifier): IRouter {
  const router: IRouter = Router();

  // Health check stays unauthenticated.
  router.use(healthRouter);

  // Profile routes require a verified actor identity.
  router.use(createAuthMiddleware(verifier), profileRouter);

  return router;
}
