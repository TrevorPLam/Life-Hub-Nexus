# Life Hub Nexus

A local-first, modular life-operations application — starting with a mobile
prototype and a local/remote Profile API, then expanding across Identity,
Planning, Calendar, Knowledge, People, Finance, Relationships, Notifications,
Sync, and Search.

> **Baseline status:** This repo is at an architecture-baseline stage. The API
> server has working health and mock profile routes behind an authenticated
> identity boundary; the mobile app stores profile data locally in `AsyncStorage`;
> generated API clients and Zod schemas are owned by Orval.

## Quick start

```powershell
# 1. Install dependencies (pnpm is required)
pnpm install

# 2. Run typechecks and tests
pnpm run typecheck
pnpm --filter @workspace/mobile test -- --runInBand
pnpm --filter @workspace/api-server test -- --runInBand
```

## Workspace packages

| Package | Role | Main entry |
|---|---|---|
| `artifacts/mobile` | Expo React Native app (local-first, preview server) | `expo-router/entry` |
| `artifacts/api-server` | Express 5 API monolith | `src/index.ts` |
| `artifacts/mockup-sandbox` | Vite/React UI prototype sandbox | `src/main.tsx` |
| `lib/db` | Drizzle ORM PostgreSQL schemas and connection | `src/index.ts` |
| `lib/api-spec` | OpenAPI spec and Orval codegen | `openapi.yaml`, `orval.config.ts` |
| `lib/api-client-react` | Generated TanStack Query React client | `src/index.ts` |
| `lib/api-zod` | Generated Zod schemas and types | `src/index.ts` |
| `scripts` | Utility scripts | `src/hello.ts` |

## Common commands

```powershell
# Full typecheck
pnpm run typecheck

# Run API server (requires PORT; DATABASE_URL is currently unused by mock routes)
pnpm --filter @workspace/api-server run dev

# Run mobile preview server (requires static-build/)
pnpm --filter @workspace/mobile run serve

# Regenerate API clients and schemas from OpenAPI
pnpm --filter @workspace/api-spec run codegen

# Push database schema (development only)
pnpm --filter @workspace/db run push
```

## Environment variables

| Variable | Required by | Purpose |
|---|---|---|
| `DATABASE_URL` | `lib/db`, `api-server` dev/db commands | PostgreSQL connection string |
| `PORT` | `api-server` start | HTTP server port |
| `AUTH_ISSUER_URL` | `api-server` (T-016) | Identity provider issuer URL |
| `AUTH_AUDIENCE` | `api-server` (T-016) | Expected JWT audience |
| `AUTH_CLIENT_ID` | `api-server` (T-016) | OAuth2 / OIDC client ID |
| `AUTH_TOKEN_ALGORITHM` | `api-server` (T-016) | JWT signing algorithm (e.g. `RS256`) |
| `TRUSTED_ORIGINS` | `mobile` preview server | Optional comma-separated allowed origin allowlist |
| `BASE_PATH` | `mobile` preview server | Optional base path for static assets (default `/`) |
| `REPLIT_EXPO_DEV_DOMAIN` | `mobile` dev script | Expo dev proxy domain |
| `REPLIT_DEV_DOMAIN` | `mobile` dev script | Dev domain for Expo |
| `REPL_ID` | `mobile` dev script | Replit repl identifier |
| `EXPO_PUBLIC_DOMAIN` | `mobile` build | Public domain for production build |

See `.env.example` for a copy-ready template.

## Architecture notes

- **Monorepo:** pnpm workspaces with a shared `pnpm-workspace.yaml` catalog and
  TypeScript project references in `tsconfig.json`.
- **Bounded contexts:** Profile is the first implemented context. Mobile
  contexts for Work, Calendar, Notes, Budget, People, and Social exist as
  React contexts but are not yet backed by the server.
- **Generated code:** `lib/api-client-react/src/generated/` and
  `lib/api-zod/src/generated/` are owned by Orval. Do not hand-edit them; run
  `pnpm --filter @workspace/api-spec run codegen` instead.
- **Local-first:** Mobile `ProfileRepository` uses `AsyncStorage` today; SQLite
  is the intended future authoritative device store.

## Current limitations

- The API server profile routes are currently in-memory mocks; they do not
  persist to the PostgreSQL database.
- Authentication is implemented as a server-side boundary: a bearer token is
  verified by an `AuthVerifier` port and the resulting `AuthenticatedActor` is
  injected into protected routes. Client-owned `X-User-Id` headers are rejected.
  A placeholder verifier rejects all tokens until T-016 wires a real identity
  provider.
- `lib/db` defines a `profiles` table, but no migration or runtime integration
  exists yet.
- The mobile build (`pnpm --filter @workspace/mobile run build`) requires a
  deployment domain (`REPLIT_INTERNAL_APP_DOMAIN`, `REPLIT_DEV_DOMAIN`, or
  `EXPO_PUBLIC_DOMAIN`).
- No formatter/lint scripts exist at the root yet; `pnpm run format:check` and
  `pnpm run lint` are not available until T-020.

## Validation

Targeted validation commands used for this baseline:

```powershell
pnpm run typecheck
pnpm --filter @workspace/mobile test -- --runInBand
pnpm --filter @workspace/api-server test -- --runInBand
```

All three passed with the current code.
