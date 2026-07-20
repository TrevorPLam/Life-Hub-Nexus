# Identity Provider Decision Record

**Status:** Draft — pending provider selection (T-016)
**Date:** 2026-07-20

## 1. Purpose

This document records the configuration contract required by the API server's `AuthVerifier` port and the evaluation criteria for selecting a production identity provider. It is intentionally provider-neutral: no provider is selected here; the final selection and non-secret configuration values are supplied in T-016.02.

## 2. Decision context

- The API server already exposes an `AuthVerifier` port (`artifacts/api-server/src/application/identity/actor.ts`) and authentication middleware (`artifacts/api-server/src/middlewares/auth.ts`).
- A `placeholder-verifier` rejects every token until T-016 wires a real adapter.
- A `test-verifier` maps bearer tokens to actors for route and use-case tests.
- `AuthenticatedActor` currently carries a single `userId: EntityId<"user">` value.
- The OpenAPI contract declares `bearerAuth` with `bearerFormat: JWT`.
- Profile persistence uses `id` as the user identifier from the identity context, and account deletion must permanently remove profile data with no retention.

## 3. AuthVerifier contract

The production adapter must implement:

```ts
interface AuthVerifier {
  verify(credential: string): Promise<Result<AuthenticatedActor, AuthFailure>>;
}
```

- **Input:** a single bearer token string extracted from the `Authorization: Bearer <token>` header.
- **Output:** a `Result<AuthenticatedActor, AuthFailure>`.
- **Responsibilities:**
  - Validate signature, issuer, audience, and expiration.
  - Map the verified identity to `AuthenticatedActor.userId`.
  - Return `invalid-credentials` for any validation failure.
  - Never read `X-User-Id` or any client-supplied owner header.
  - Keep provider SDK types and implementation details private to the adapter.

The middleware additionally rejects any request that includes an `X-User-Id` header.

## 4. Required provider capabilities

A provider must support all of the following for Life Hub Nexus:

| Capability | Requirement | Rationale |
|------------|-------------|-----------|
| Email/password authentication | Required | Primary user onboarding flow |
| Multi-device sync | Required | Users may switch between phone, tablet, and future web clients |
| Permanent account deletion | Required | Privacy policy and context-map deletion policy demand no retention of deleted profile data |
| Mobile deep links / custom URL schemes | Required | Native mobile auth redirects and password-reset flows |
| Future web client support | Required | The architecture anticipates a web deployment |
| JWT issuance with RS256 | Strongly preferred | Matches `.env.example` default and stateless server verification |
| Token revocation / session control | Strongly preferred | Multi-device security |
| MFA / passkey readiness | Preferred | Security posture for personal life-operations data |
| Programmatic user management | Preferred | Server-side deletion and conflict handling |

## 5. Non-secret configuration contract

Only non-secret values are stored in `.env.example` and tracked documentation. Secrets (client secrets, signing keys, service-account JSON) must remain in the provider dashboard or an untracked local `.env` file.

| Variable | Purpose | Example / placeholder |
|----------|---------|----------------------|
| `AUTH_ISSUER_URL` | Base URL of the identity issuer; used for discovery and `iss` validation | `https://example-issuer.local/` |
| `AUTH_AUDIENCE` | Intended recipient of the token; used for `aud` validation | `https://api.lifehubnexus.example` |
| `AUTH_CLIENT_ID` | Public client identifier registered with the provider | `dev-client-id` |
| `AUTH_TOKEN_ALGORITHM` | Expected signing algorithm | `RS256` |

Provider-specific additions (kept as comments until selection):

- `AUTH_REDIRECT_URI` — OAuth2 / OIDC redirect URI used by mobile and web clients.
- `AUTH_TOKEN_ISSUER` — Explicit issuer string when it differs from `AUTH_ISSUER_URL`.
- `AUTH_JWKS_URI` — JWKS endpoint, normally derived from discovery but may be pinned.
- `AUTH_DEEP_LINK_SCHEME` — Custom URL scheme for mobile auth callbacks (e.g. `lifehubnexus://auth/callback`).

## 6. Evaluation criteria

| Criterion | Weight | Questions to answer |
|-----------|--------|---------------------|
| Email/password support | High | Does the provider offer email/password sign-up, sign-in, and password reset? |
| Token format | High | Does it issue signed JWTs (ideally RS256) that the API can verify without calling the provider on every request? |
| Discovery / standards | High | Does it support OpenID Connect discovery or publish a stable JWKS endpoint? |
| Multi-device sessions | High | Can users sign in on multiple devices and revoke individual sessions? |
| Mobile deep linking | High | Does it support custom URL schemes / universal links for auth redirects? |
| Permanent deletion | High | Does the provider delete the account and allow downstream systems to be notified (webhooks / stream events) so profile and local cache can be purged with no retention? |
| Cost / limits | Medium | Free-tier limits, MAU pricing, and whether costs scale with a personal app |
| Self-hosting vs SaaS | Medium | Operational burden, data residency, and update maintenance |
| MFA / passkeys | Medium | Availability and roadmap |
| Web client readiness | Medium | SDK support for a future web deployment |
| Vendor lock-in | Low | Migration path to another provider or self-hosted solution |

## 7. Provider category shortlist

No final selection is made here. The categories below satisfy the criteria to varying degrees:

### 7.1 Managed SaaS (Auth0, Clerk, Firebase Authentication)

- **Pros:** Fast setup, hosted UI, SDKs for React Native and web, OIDC/JWKS support, multi-device sessions, password reset, deep-link support.
- **Cons:** Ongoing cost, external dependency, data residency concerns, potential vendor lock-in.
- **Notes:** Clerk and Auth0 both support custom domains and webhooks. Firebase Auth has generous free tier and strong mobile SDKs but a more Google-centric ecosystem.

### 7.2 Keycloak / self-hosted OIDC

- **Pros:** Full control, open source, no per-user cost, supports email/password, OIDC, JWT, event/webhook streams for deletion.
- **Cons:** Operational burden, requires hosting and updates, mobile SDKs less polished.
- **Notes:** Strong fit if the project later needs self-hosted data sovereignty.

### 7.3 Supabase Auth / PocketBase

- **Pros:** Built-in Postgres auth, email/password, JWT, GoTrue standard, easy webhooks, generous free tier.
- **Cons:** Tightly coupled to the chosen backend stack, migration to standalone OIDC may require work.
- **Notes:** Supabase Auth is a managed OpenID/OAuth2 service with good mobile support.

### 7.4 Cloud identity (AWS Cognito, Azure AD B2C, Google Identity Platform)

- **Pros:** Enterprise-grade, scalable, supports OIDC/OAuth2, MFA.
- **Cons:** Complex configuration, cost escalators, steep learning curve, deep-link configuration can be verbose.
- **Notes:** Overkill for an early-stage app unless the team already uses the ecosystem.

## 8. Account deletion and data-retention constraints

- Profile deletion must be **permanent**; the `profiles` table row is removed and no backup is retained by the application.
- The identity provider is the source of truth for account existence; the Profile bounded context removes its data when an account deletion is propagated.
- The provider or adapter must offer a reliable signal (webhook, event stream, or scheduled reconciliation) that the server can consume to enforce no-retention deletion.
- The `AuthenticatedActor` contract intentionally carries minimal claims so that deletion of identity data does not leave orphaned profile records.

## 9. Anti-corruption layer requirements

- Provider-specific claims, SDKs, and token formats are confined to the adapter implementation.
- The adapter maps provider claims to `AuthenticatedActor` and `AuthFailure` only.
- No route, use case, or Drizzle code may import a provider SDK.
- No provider token, secret, or refresh token is logged or returned in API responses.
- The existing `X-User-Id` rejection remains in effect; the adapter does not introduce alternative client identity channels.

## 10. Mobile and web redirect constraints

- The provider must accept a custom deep-link scheme for mobile authentication callbacks.
- A future web client will use a secure HTTPS redirect origin.
- Both redirect origins must be registered with the provider before tokens can be issued.
- The redirect URI must not expose tokens to third-party applications; the mobile app should exchange authorization codes using PKCE where the provider supports it.

## 11. Next steps

1. **T-016.02 (HUMAN):** Select one provider category and create the development application/client. Provide only non-secret values: issuer URL, audience, client ID, approved redirect/deep-link origins, and any public JWKS or discovery URL.
2. **T-016.03 (AGENT):** With the selected provider, update this decision record, `.env.example`, and `replit.md`; implement the `AuthVerifier` adapter behind the existing port; verify no secret is committed; run the API typecheck.

## 12. Related files

- `artifacts/api-server/src/application/identity/actor.ts`
- `artifacts/api-server/src/middlewares/auth.ts`
- `artifacts/api-server/src/middlewares/placeholder-verifier.ts`
- `artifacts/api-server/src/middlewares/test-verifier.ts`
- `.env.example`
- `docs/architecture/context-map.md` (Identity and Profile bounded contexts)
