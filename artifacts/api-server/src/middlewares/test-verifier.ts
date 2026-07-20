import type {
  AuthenticatedActor,
  AuthFailure,
  AuthVerifier,
} from "../application/identity/actor";
import { err, ok, type Result } from "@workspace/domain-core";

/**
 * Deterministic `AuthVerifier` for tests. Maps bearer token strings directly
 * to actors so route tests can exercise authenticated boundaries without
 * depending on an external identity provider.
 */
export function createTestAuthVerifier(
  tokens: Record<string, AuthenticatedActor>,
): AuthVerifier {
  return {
    async verify(credential): Promise<Result<AuthenticatedActor, AuthFailure>> {
      const actor = tokens[credential];
      if (actor) return ok(actor);
      return err({
        kind: "invalid-credentials",
        reason: `Token "${credential}" is not recognized by the test verifier`,
      });
    },
  };
}
