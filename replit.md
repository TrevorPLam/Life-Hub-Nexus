# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/mobile test -- --runInBand` — run mobile pure-domain tests
- `pnpm --filter @workspace/api-server test -- --runInBand` — run API server route tests
- Required env: `DATABASE_URL` — Postgres connection string

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

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
