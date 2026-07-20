/**
 * Identity context boundary for the API server.
 *
 * An `AuthenticatedActor` is produced only by an `AuthVerifier` adapter and
 * consumed by application use cases. Route code never fabricates an actor
 * from raw request headers or payloads.
 */

import {
  createEntityId,
  err,
  type EntityId,
  ok,
  type Result,
} from "@workspace/domain-core";

export type AuthenticatedActor = {
  readonly userId: EntityId<"user">;
};

export type AuthFailure =
  | { readonly kind: "missing-credentials" }
  | { readonly kind: "invalid-credentials"; readonly reason: string }
  | { readonly kind: "rejected-identity-header"; readonly header: string };

export interface AuthVerifier {
  /**
   * Verifies a bearer token credential and returns the authenticated actor.
   * This port is the only production component that inspects credentials;
   * provider-specific SDKs live behind an adapter.
   */
  verify(
    credential: string,
  ): Promise<Result<AuthenticatedActor, AuthFailure>>;
}

export function createActor(userId: string): AuthenticatedActor {
  return { userId: createEntityId(userId, "user") };
}
