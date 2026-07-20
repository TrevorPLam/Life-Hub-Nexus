import type { AuthFailure, AuthVerifier } from "../application/identity/actor";
import { err } from "@workspace/domain-core";

/**
 * Production placeholder `AuthVerifier` that always fails.
 *
 * This satisfies the server identity boundary until T-016 wires a real
 * identity provider adapter (e.g. JWT/OAuth2).
 */
export function createPlaceholderAuthVerifier(): AuthVerifier {
  return {
    async verify(_credential) {
      const failure: AuthFailure = {
        kind: "invalid-credentials",
        reason:
          "Production identity provider has not been configured (blocked by T-016)",
      };
      return err(failure);
    },
  };
}
