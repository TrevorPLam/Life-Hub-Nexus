import type { NextFunction, Request, RequestHandler, Response } from "express";
import type {
  AuthenticatedActor,
  AuthFailure,
  AuthVerifier,
} from "../application/identity/actor";

declare global {
  namespace Express {
    interface Request {
      actor?: AuthenticatedActor;
    }
  }
}

const BEARER_PREFIX = "Bearer ";

function reject(res: Response, failure: AuthFailure): void {
  // Do not forward failure details to clients; keep the API surface opaque.
  res.status(401).json({ error: "Unauthorized" });
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== "string") return null;
  if (!authHeader.startsWith(BEARER_PREFIX)) return null;
  const token = authHeader.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

function hasRejectedIdentityHeader(req: Request): boolean {
  // The server owns actor identity; it must never accept a client-supplied
  // user ID header such as X-User-Id.
  return req.headers["x-user-id"] !== undefined;
}

export function createAuthMiddleware(verifier: AuthVerifier): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (hasRejectedIdentityHeader(req)) {
        reject(res, {
          kind: "rejected-identity-header",
          header: "x-user-id",
        });
        return;
      }

      const token = extractBearerToken(req);
      if (!token) {
        reject(res, { kind: "missing-credentials" });
        return;
      }

      const result = await verifier.verify(token);
      if (!result.ok) {
        reject(res, result.error);
        return;
      }

      req.actor = result.value;
      next();
    } catch (error) {
      next(error);
    }
  };
}
