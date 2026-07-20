# Life Hub Nexus

A local-first, modular life-operations mobile app and API monolith. Currently at an architecture baseline: the mobile app persists profile data locally, and the API server exposes health and mock profile routes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — build and run the API server (requires `PORT` env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec (verified; Orval v8.21.0)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/mobile test -- --runInBand` — run mobile pure-domain tests
- `pnpm --filter @workspace/api-server test -- --runInBand` — run API server route tests
- `pnpm --filter @workspace/mobile exec node --test server/serve.test.js` — run mobile preview server security tests (verified; 12/12 pass)
- `pnpm --filter @workspace/mobile run serve` — run mobile preview server (requires static-build/)
- Required env: `DATABASE_URL` — Postgres connection string
- API server env: `PORT` — HTTP port
- Mobile preview server env: `TRUSTED_ORIGINS` — comma-separated allowlist of trusted domains (optional, enables origin validation)
- Mobile preview server env: `BASE_PATH` — optional base path for static assets (default `/`)
- Mobile build env: `REPLIT_INTERNAL_APP_DOMAIN`, `REPLIT_DEV_DOMAIN`, or `EXPO_PUBLIC_DOMAIN`

## Platform Support

- **Windows PowerShell:** All commands work natively; preinstall script uses Node.js for pnpm enforcement
- **Linux/Replit:** All commands work natively; post-merge hook runs dependency installation only
- **Database updates:** Must be run explicitly via `pnpm --filter @workspace/db run push` - not automated during merge

## Testing Conventions

- **Test runner:** Jest 29.7 with ts-jest for TypeScript support
- **Mobile tests:** Pure domain logic in `artifacts/mobile/__tests__/**/*.test.ts` - no React/AsyncStorage dependencies
- **API tests:** Route tests in `artifacts/api-server/src/**/*.test.ts` - use deterministic factories
- **Configuration:** Jest configs are `.cjs` files to support ES module packages
- **Exclusions:** Test files are excluded from TypeScript compilation (handled by Jest)
- **CI:** GitHub Actions workflow installs with frozen lockfile, runs typecheck, then runs both test suites

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- **Profile persistence:** `artifacts/mobile/domain/profile/ProfileRepository.ts` - deep module with anti-corruption layer for AsyncStorage
- **Profile context:** `artifacts/mobile/context/AppContext.tsx` - consumes repository, exposes load/save failure state
- **Profile tests:** `artifacts/mobile/__tests__/profile-repository.test.ts` - Given/When/Then tests for repository behavior

## Architecture decisions

- **Profile persistence boundary:** Deep module pattern with anti-corruption layer - AsyncStorage details encapsulated in `ProfileRepository.ts`, exposing only domain types and result types
- **Profile migration:** Versioned DTO with automatic migration from legacy format (no version field) to current versioned structure
- **Error observability:** Repository returns discriminated union results (success/error) that UI can react to, with recoverable outcomes for invalid data
- **Mobile preview server security:** Secure adapter boundary with HTML encoding, trusted origin validation, path traversal protection, and SRI for external scripts. Server validates host headers against optional allowlist (TRUSTED_ORIGINS env var), encodes all template values, serves local QR library with integrity hash, and adds security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy).
- **Profile sync bounded contexts:**
  - **Identity context:** Owns user authentication (email/password), session management, and user ID generation. Responsible for validating credentials and issuing auth tokens.
  - **Profile context:** Owns profile data model, validation rules, and business logic. Manages profile CRUD operations scoped to authenticated user ID.
  - **Local Device Cache context:** Owns offline storage (AsyncStorage), conflict detection, and sync orchestration. Implements optimistic updates and last-write-wins conflict resolution based on server timestamps.

## Profile sync BDD scenarios

- **Profile creation:** Given an authenticated user, when creating a profile, then the profile is stored on the server with the user's ID as owner and synced to local cache.
- **Profile retrieval:** Given an authenticated user, when requesting their profile, then the server returns only their own profile data and local cache is updated.
- **Profile update:** Given an authenticated user, when updating their profile, then the change is persisted on the server with owner validation and synced to local cache.
- **Profile deletion:** Given an authenticated user, when deleting their profile, then the server permanently removes their profile data (no retention) and local cache is cleared.
- **Offline edit:** Given a user with cached profile data, when editing while offline, then changes are persisted locally and queued for sync when connection is restored.
- **Conflict handling:** Given concurrent edits from multiple devices, when syncing, then the server's version with the latest timestamp wins (last-write-wins) and the local cache is updated to match.

## Product

Life Hub Nexus is intended to become a secure, local-first life-operations app for managing profile, tasks, calendar events, notes, people, budgets, and social references, with server sync driven by authenticated identity.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Mobile static build requires deployment domain:** `pnpm --filter @workspace/mobile run build` requires `REPLIT_INTERNAL_APP_DOMAIN`, `REPLIT_DEV_DOMAIN`, or `EXPO_PUBLIC_DOMAIN` environment variable to be set. This is expected for production builds on Replit or similar platforms.
- **API routes are mock-only:** Profile endpoints in `artifacts/api-server/src/routes/` return deterministic in-memory data. They are not backed by `lib/db` yet.
- **No `.env.example` yet:** Environment variable names are documented in `README.md`.
- **Formatting/linting scripts missing:** `pnpm run format:check` and `pnpm run lint` do not exist at the root yet.
- **Codegen is source-owned:** `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/` are produced by `pnpm --filter @workspace/api-spec run codegen`. Do not edit them by hand.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
