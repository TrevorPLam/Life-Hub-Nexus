# Architecture and Delivery Backlog

## Purpose

This backlog is the executable plan for evolving Life Hub Nexus from a mobile prototype into a secure, local-first, modular life-operations application. Complete parent tasks in order unless a task is explicitly marked `BLOCKED`.

## Task Format and Working Rules

- **Status values:** `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
- **Ownership:** `AGENT` performs all repository research, code changes, tests, command execution, and documentation updates. `HUMAN` is used only for an external account, credential, legal, or irreversible product decision that cannot be made from repository evidence.
- **Research gate:** The first subtask of every parent task verifies current files, imports, call sites, generated-code ownership, and commands. If findings invalidate the parent task, update this file and `replit.md` before implementation.
- **SDD:** Each task states observable behavior, boundaries, dependencies, and verification before implementation begins.
- **DDD:** A feature owns its domain rules and persistence model. Cross-feature interaction occurs through narrow contracts, not imports of another feature's UI state.
- **TDD and BDD:** For behavioral changes, write focused failing Given/When/Then tests first. Implement the smallest change that passes. Refactor only while focused tests remain green.
- **Deep modules:** Public APIs remain small. Storage keys, DTOs, migrations, network details, and framework mechanics stay private behind repositories and use cases.
- **Generated code:** Never manually edit generated files under `lib/api-client-react/src/generated/` or `lib/api-zod/src/generated/`.
- **Completion:** Mark a parent task `DONE` only after its listed validation commands pass and its required documentation is updated.
- **Scope control:** A parent task is deliberately small. Create a new parent task rather than broadening implementation scope.

## Architecture Direction

- Keep one deployable API and one mobile app as a modular monolith.
- Organize application code by bounded context: Identity, Profile, Planning, Calendar, Knowledge, People, Finance, Relationships, Notifications, Sync, and Search.
- Use repositories and use cases as feature boundaries; do not add direct `AsyncStorage` access in UI components or React contexts.
- Introduce an explicit relationship model rather than adding new `linked<Entity>Ids` fields.
- Treat SQLite-backed local storage as the future authoritative device store. Treat remote APIs as synchronization adapters, not the UI's primary state container.
- Authenticate every server request using verified credentials. The server derives actor identity from those credentials and never trusts a client-supplied owner header.

---

## [x] T-010 | STATUS: DONE | Establish the current architecture baseline

**Purpose:** Record the actual repository state after the backlog reset so future work is based on verified evidence rather than prior assumptions.

**Related file paths:** `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `artifacts/mobile/package.json`, `artifacts/api-server/package.json`, `lib/*/package.json`, `.github/workflows/quality.yml`, `replit.md`, `README.md`.

**Definition of done:** The workspace layout, package roles, supported commands, test status, generated-code ownership, known architectural limitations, and missing onboarding documents are recorded accurately.

**Out of scope:** Source-code refactoring, dependency upgrades, database mutation, API behavior changes, or product feature work.

**Rules to follow:** Use existing package scripts when possible; do not run database push commands; do not install packages; capture command failures verbatim; distinguish confirmed findings from assumptions.

**Advanced coding pattern:** Executable architecture decision record. Documentation is an operational contract that describes current truth and explicit next decisions.

**Anti-patterns:** Treating prior task notes as current truth; running broad builds when a targeted command answers the question; adding a README that claims unverified behavior.

**Imports/exports:** No application imports or exports change.

**Depends on:** None.

**Blocks:** T-011, T-012, T-013, T-014, T-015, T-016, T-017.

**Targeted validation commands:**

```powershell
pnpm run typecheck
pnpm --filter @workspace/mobile test -- --runInBand
pnpm --filter @workspace/api-server test -- --runInBand
```

### Subtasks

- [x] T-010.01 | AGENT | Target: repository root | Inspected workspace manifests, TypeScript project references, CI workflow, source entry points, and current Git status. Recorded package ownership and identified generated directories.
- [x] T-010.02 | AGENT | Target: `artifacts/mobile/`, `artifacts/api-server/`, `lib/` | Ran targeted validation commands. All passed; no failures to classify.
- [x] T-010.03 | AGENT | Target: `replit.md`, `README.md` | Updated `replit.md` with verified commands and current limitations. Created `README.md` with setup, architecture map, environment-variable inventory, and validation commands. Did not claim mock API is production-ready.
- [x] T-010.04 | AGENT | Target: `TODO.md` | Recorded validation outcomes in the Task Completion Notes section and marked T-010 complete.

---

## [x] T-011 | STATUS: DONE | Define bounded contexts and module dependency rules

**Purpose:** Establish stable ownership boundaries before additional life-operation modules are implemented.

**Related file paths:** `artifacts/mobile/app/_layout.tsx`, `artifacts/mobile/context/`, `artifacts/mobile/domain/`, `lib/db/src/schema/`, `lib/api-spec/openapi.yaml`, `replit.md`, `docs/architecture/context-map.md`.

**Definition of done:** A versioned context map defines each initial bounded context, its owned entities, allowed dependencies, integration contracts, and deletion/data-retention responsibilities. The mobile composition root has a documented provider policy.

**Out of scope:** Moving existing features, creating new database tables, implementing authentication, or introducing microservices.

**Rules to follow:** Model ownership by business capability, not screen layout or database table; permit duplicate representations across contexts when their meaning differs; document every shared concept and translation point; retain a modular monolith deployment model.

**Advanced coding pattern:** DDD bounded contexts and context mapping. Each context exposes a small published language and protects its internal model.

**Anti-patterns:** A universal entity type shared by all modules; importing another feature's context or screen to reuse domain types; declaring microservices before boundaries are proven; coupling modules through global mutable state.

**Imports/exports:** No production imports or exports change. Documentation may define intended future public APIs only.

**Depends on:** T-010.

**Blocks:** T-012, T-013, T-014, T-016.

**Targeted validation commands:**

```powershell
pnpm run typecheck
```

### Subtasks

- [x] T-011.01 | AGENT | Target: `artifacts/mobile/app/_layout.tsx`, `artifacts/mobile/context/`, `artifacts/mobile/domain/` | Mapped current ownership of profile, tasks, calendar, notes, people, finance, social, references, persistence, and navigation. Identified all direct cross-context imports and storage keys: `@lifeos/profile`, `@lifeos/tasks`, `@lifeos/events`, `@lifeos/notes`, `@lifeos/people`, `@lifeos/budget`, `@lifeos/budget_limits`, `@lifeos/social`.
- [x] T-011.02 | AGENT | Target: `docs/architecture/context-map.md` | Created `docs/architecture/context-map.md` covering Identity, Profile, Planning, Calendar, Knowledge, People, Finance, Relationships, Notifications, Sync, and Search. Each context includes owned data, inbound/outbound contracts, deletion policy, and local/sync status.
- [x] T-011.03 | AGENT | Target: `docs/architecture/context-map.md`, `replit.md` | Defined module dependency rules for mobile and API server layering in `docs/architecture/context-map.md` and referenced them in `replit.md` architecture decisions. Presentation depends on Application/Domain; Application depends on Domain and repository interfaces; Data adapters implement repository interfaces; Domain never imports React, Expo, AsyncStorage, or Express.
- [x] T-011.04 | AGENT | Target: `TODO.md`, `replit.md` | Verified the map against actual imports and storage keys. Recorded exceptions as migration debt in `docs/architecture/context-map.md` (e.g. `domain/references` importing context types, contexts using `AsyncStorage` directly, mock profile route, missing Identity/Search/Notifications modules). Marked T-011 complete.

---

## [x] T-012 | STATUS: DONE | Create shared domain primitives without feature migration

**Purpose:** Add the smallest shared foundation needed for future feature modules without prematurely moving existing entities.

**Related file paths:** `lib/`, `tsconfig.json`, `artifacts/mobile/domain/`, `artifacts/api-server/src/`, `docs/architecture/context-map.md`, `replit.md`.

**Definition of done:** A small shared package exposes branded identifiers, a result type, a clock interface, and an ID-generator interface with deterministic test adapters. No existing feature is migrated in this task.

**Out of scope:** SQLite adoption, authentication, changing stored entity IDs, rewriting contexts, adding a dependency-injection framework, or adding domain entities.

**Rules to follow:** Keep the public API minimal; make modules runtime-neutral; use interfaces for clocks and IDs; do not expose implementation-specific types; avoid a generic utility dumping ground.

**Advanced coding pattern:** Deep module and ports-and-adapters. The package exposes domain-safe ports while runtime adapters remain private to consuming applications.

**Anti-patterns:** Importing React Native or Node APIs into shared domain code; exporting internal helper functions; using `any`; globally replacing IDs without migration and compatibility tests.

**Imports/exports:** Export only `EntityId` branding helpers, `Result`, `Clock`, `IdGenerator`, and test-safe deterministic implementations. Do not export storage or UI types.

**Depends on:** T-011.

**Blocks:** T-013, T-014, T-016.

**Targeted validation commands:**

```powershell
pnpm --filter @workspace/domain-core test -- --runInBand
pnpm --filter @workspace/domain-core run typecheck
pnpm run typecheck
```

### Subtasks

- [x] T-012.01 | AGENT | Target: `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `lib/` | Research existing workspace package conventions, build/typecheck behavior, runtime module resolution, and test configuration. Confirmed a new package can be referenced without changing generated API code.
- [x] T-012.02 | AGENT | Target: `lib/domain-core/__tests__/` | Wrote Given/When/Then tests for deterministic ID generation, branded ID construction, successful and failed result values, and a fixed clock. Tests are independent of React Native and Node globals.
- [x] T-012.03 | AGENT | Target: `lib/domain-core/src/`, `lib/domain-core/package.json`, `lib/domain-core/tsconfig.json` | Created the package and implemented the smallest public API that passes the focused tests. Added build, typecheck, and test scripts consistent with workspace conventions.
- [x] T-012.04 | AGENT | Target: `tsconfig.json`, `replit.md`, `TODO.md` | Added the required project reference and documented the public package boundary. Ran targeted tests and typechecks; recorded results below.

---

## [x] T-013 | STATUS: DONE | Specify the relationship capability and deletion semantics

**Purpose:** Replace ad hoc cross-module link assumptions with one explicit, feature-neutral relationship contract before implementation.

**Related file paths:** `artifacts/mobile/context/WorkContext.tsx`, `artifacts/mobile/context/CalendarContext.tsx`, `artifacts/mobile/context/NotesContext.tsx`, `artifacts/mobile/context/PeopleContext.tsx`, `artifacts/mobile/context/BudgetContext.tsx`, `artifacts/mobile/domain/references/`, `lib/db/src/schema/`, `docs/architecture/relationships.md`, `replit.md`.

**Definition of done:** A relationship specification defines link identity, source/target types, relation types, ownership, query semantics, authorization expectations, and behavior when either endpoint is deleted. Every existing `linked*Ids` field is mapped to the target model.

**Out of scope:** Removing `linked*Ids` fields, creating SQLite tables, changing database schemas, implementing sync, or changing visible UI.

**Rules to follow:** Do not assume every deletion cascades; distinguish structural ownership from optional associations; avoid polymorphic foreign-key claims that PostgreSQL cannot enforce directly; preserve user intent where practical.

**Advanced coding pattern:** DDD relationship bounded context with an anti-corruption layer between feature entities and generic link records.

**Anti-patterns:** Adding another `linked<Entity>Ids` property; hardcoding every source-target pair in a cleanup service; deleting independent records because a relationship was removed; using UI contexts as the relationship source of truth.

**Imports/exports:** No production imports or exports change. The specification may define proposed `RelationshipRepository` and `RelationshipPolicy` interfaces without implementing them.

**Depends on:** T-011.

**Blocks:** T-014, T-016.

**Targeted validation commands:**

```powershell
pnpm --filter @workspace/mobile exec jest --runInBand artifacts/mobile/__tests__/entity-reference-policy.test.ts
pnpm run typecheck
```

### Subtasks

- [x] T-013.01 | AGENT | Target: all mobile context files listed above, `artifacts/mobile/domain/references/` | Inventoried every link field, link creator, UI consumer, deletion operation, AsyncStorage key, and existing reference-cleanup test. Found storage-shape inconsistencies in `ReferenceCleanupService` (notes loaded from budget key, malformed data silently defaulted, `ReferenceCleanupOrchestrator` unused).
- [x] T-013.02 | AGENT | Target: `docs/architecture/relationships.md` | Wrote a relationship matrix mapping all `linked*Ids` fields to source/target contexts, cardinality, relation type, owner, deletion behavior, sync requirement, and future database representation.
- [x] T-013.03 | AGENT | Target: `docs/architecture/relationships.md`, `replit.md` | Defined `RelationshipRepository` (`create`, `remove`, `listByEntity`, `removeForEntity`) and `RelationshipPolicy` (`canLink`, `onSourceDeleted`, `onTargetDeleted`) contracts. Documented transactional vs eventual semantics. Added a pointer in `replit.md`.
- [x] T-013.04 | AGENT | Target: `TODO.md` | Ran the focused `entity-reference-policy` test (10/10 passed) and full `pnpm run typecheck` (passed). Recorded mismatches between specified and current behavior in `docs/architecture/relationships.md` section 9 as prerequisites for T-014. Marked T-013 complete without production changes.

---

## [x] T-014 | STATUS: DONE | Isolate existing relationship cleanup behind a tested boundary

**Purpose:** Remove direct imports from relationship domain code to React context modules and make current cleanup behavior observable before migrating storage technology.

**Related file paths:** `artifacts/mobile/domain/references/EntityReferencePolicy.ts`, `artifacts/mobile/domain/references/ReferenceCleanupService.ts`, `artifacts/mobile/__tests__/entity-reference-policy.test.ts`, `artifacts/mobile/__tests__/reference-cleanup-service.test.ts`, `artifacts/mobile/context/`, `replit.md`.

**Definition of done:** Relationship policy consumes feature-neutral entity DTOs, a storage adapter owns AsyncStorage access, cleanup failures are returned to callers, and focused tests cover stored-shape compatibility and every existing deletion direction.

**Out of scope:** SQLite adoption, generic relationship-record migration, provider redesign, UI redesign, or server synchronization.

**Rules to follow:** Preserve documented current behavior unless a test exposes a data-corruption defect; do not silently substitute unrelated data collections; never use `any`; do not import React contexts into domain policy code.

**Advanced coding pattern:** Hexagonal architecture. A pure relationship policy operates on feature-neutral data; an AsyncStorage adapter is the replaceable outer port.

**Anti-patterns:** Dynamic-importing another feature's context to mutate its state; reading and writing unrelated storage keys; swallowing cleanup failure after a destructive operation; coupling domain tests to AsyncStorage.

**Imports/exports:** Export only feature-neutral DTOs, pure policy functions, repository interfaces, and structured result types. Keep storage keys and parsing helpers private to the adapter.

**Depends on:** T-012, T-013.

**Blocks:** T-016.

**Targeted validation commands:**

```powershell
pnpm --filter @workspace/mobile exec jest --runInBand artifacts/mobile/__tests__/entity-reference-policy.test.ts artifacts/mobile/__tests__/reference-cleanup-service.test.ts
pnpm --filter @workspace/mobile run typecheck
```

### Subtasks

- [x] T-014.01 | AGENT | Target: `artifacts/mobile/domain/references/`, listed context files, existing tests | Analyze storage shapes and cleanup call sites. Confirm the current budget, notes, events, people, and task serialization formats before writing tests. Use the mismatches documented in `docs/architecture/relationships.md` section 9 as the initial defect list.
- [x] T-014.02 | AGENT | Target: `artifacts/mobile/__tests__/reference-cleanup-service.test.ts` | Write failing Given/When/Then tests for task, event, note, person, and transaction deletion. Assert that the correct storage collection changes, unrelated collections are preserved, malformed data returns a recoverable failure, and no context import is required.
- [x] T-014.03 | AGENT | Target: `artifacts/mobile/domain/references/EntityReferencePolicy.ts`, `artifacts/mobile/domain/references/ReferenceCleanupService.ts` | Refactor policy types into feature-neutral DTOs and introduce a small persistence port. Implement an AsyncStorage adapter that validates each stored shape and returns typed outcomes.
- [x] T-014.04 | AGENT | Target: `artifacts/mobile/context/`, `replit.md`, `TODO.md` | Update deletion callers to handle the structured result without direct persistence imports. Run only the focused tests and mobile typecheck. Document the temporary AsyncStorage boundary and remaining atomicity limitation.

---

## [x] T-015 | STATUS: DONE | Establish authenticated server identity boundary

**Purpose:** Replace mock request identity with a verified server-side authentication seam before any additional personal-data API is created.

**Related file paths:** `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/`, `artifacts/api-server/src/middlewares/`, `lib/api-spec/openapi.yaml`, `lib/api-client-react/src/custom-fetch.ts`, `artifacts/mobile/`, `.env.example`, `replit.md`.

**Definition of done:** The API has a tested authentication middleware interface; protected routes receive an actor identity from verified credentials; client-owned identity headers are rejected or ignored; environment variables are documented without secrets.

**Out of scope:** Implementing a full account-registration UI, selecting a production identity vendor, password reset flows, database persistence for every module, or deploying credentials.

**Rules to follow:** Do not invent token verification behavior; do not trust `X-User-Id`; do not log tokens, passwords, or personal data; keep provider-specific logic behind an adapter; use a test verifier only in test composition.

**Advanced coding pattern:** Ports-and-adapters with an authenticated actor context. Routes adapt HTTP to use cases; use cases receive an actor, never raw request headers.

**Anti-patterns:** Checking only that an Authorization header starts with `Bearer`; accepting a user ID from payload or headers; storing auth tokens in AsyncStorage; exposing provider SDK types throughout route code.

**Imports/exports:** Export `AuthenticatedActor`, `AuthVerifier`, and authentication middleware factory. Keep JWT/provider parsing private to the adapter.

**Depends on:** T-010, T-011.

**Blocks:** T-016 and every new server-backed personal-data module.

**Targeted validation commands:**

```powershell
pnpm --filter @workspace/api-server exec jest --runInBand artifacts/api-server/src/middlewares/auth.test.ts artifacts/api-server/src/routes/profile.test.ts
pnpm --filter @workspace/api-server run typecheck
```

### Subtasks

- [x] T-015.01 | AGENT | Target: `artifacts/api-server/src/routes/`, `artifacts/api-server/src/app.ts`, `lib/api-spec/openapi.yaml`, `lib/api-client-react/src/custom-fetch.ts` | Research all current auth assumptions, client configuration call sites, and profile route access paths. Confirmed no production provider SDK is wired yet; placeholder verifier is used until T-016.
- [x] T-015.02 | AGENT | Target: `artifacts/api-server/src/middlewares/auth.test.ts` | Wrote Given/When/Then tests for missing credentials, invalid credentials, verified actor injection, rejection of `X-User-Id`, and route access under a test verifier.
- [x] T-015.03 | AGENT | Target: `artifacts/api-server/src/middlewares/`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/` | Implemented `AuthVerifier` port, `createAuthMiddleware`, `createTestAuthVerifier`, `createPlaceholderAuthVerifier`, and updated profile routes to consume `req.actor`.
- [x] T-015.04 | AGENT | Target: `.env.example`, `replit.md`, `TODO.md` | Created `.env.example` with non-secret placeholder values, updated `replit.md`, and ran focused tests and typecheck.

---

## [!] T-016 | STATUS: BLOCKED | Select the production identity provider and obtain non-secret integration configuration

**Purpose:** Make the external identity decision needed to replace the test authentication verifier with a production-capable adapter.

**Related file paths:** `.env.example`, `replit.md`, `docs/architecture/identity-decision.md`.

**Definition of done:** A provider and supported flows are selected; required issuer, audience, redirect/deep-link, environment, retention, and account-recovery constraints are documented; no secrets are committed.

**Out of scope:** Creating provider accounts on behalf of the developer, sharing credentials in chat or source control, implementing routes, or deploying the application.

**Rules to follow:** The decision must support email/password authentication, multi-device sync, permanent deletion of deleted profile data, mobile deep links, and future web clients. Do not put secrets in documentation, `TODO.md`, or Git.

**Advanced coding pattern:** Anti-corruption layer. Provider-specific credentials and claims map to the internal `AuthenticatedActor` contract established in T-015.

**Anti-patterns:** Implementing custom password storage without a security review; treating OAuth as authentication by itself; binding domain models to a provider SDK; committing service-account JSON or API keys.

**Imports/exports:** No production imports or exports change in this decision task.

**Depends on:** T-015.

**Blocks:** T-017.

**Targeted validation commands:**

```powershell
pnpm --filter @workspace/api-server run typecheck
```

### Subtasks

- [x] T-016.01 | AGENT | Target: `docs/architecture/identity-decision.md`, `.env.example`, `replit.md` | Research the exact configuration contract required by the `AuthVerifier` boundary and drafted a provider-neutral decision record with evaluation criteria. Did not select or configure an external provider.
- [!] T-016.02 | HUMAN | Target: external identity provider account and product configuration | BLOCKED pending human decision. Select a provider that supports the documented requirements and create the required development configuration. Supply only non-secret values required for local configuration, such as issuer URL, audience, client identifier, and approved redirect/deep-link origins. Keep secrets in the provider dashboard or local untracked environment file.
- [ ] T-016.03 | AGENT | Target: `docs/architecture/identity-decision.md`, `.env.example`, `replit.md`, `TODO.md` | Record the selected provider, supported flows, non-secret configuration names, and account-deletion constraints. Verify no secret was added to tracked files; run API typecheck and mark T-016 complete.

**Blocker note:** T-016.01 completed; T-016.02 requires a human product/account decision. Once the provider and non-secret values are supplied, T-016.03 can implement the adapter and close T-016.

---

## [ ] T-017 | STATUS: TODO | Implement the profile application and persistence boundary

**Purpose:** Create an ownership-scoped profile repository port, use cases, and Drizzle adapter without changing HTTP or mobile transport code.

**Related file paths:** `lib/db/src/schema/profile.ts`, `lib/db/src/schema/index.ts`, `lib/db/drizzle.config.ts`, `artifacts/api-server/src/application/profile/`, `artifacts/api-server/src/data/profile/`, `artifacts/api-server/src/application/profile/profile.test.ts`, `replit.md`.

**Definition of done:** Profile retrieval, update, and deletion use cases operate through a repository port; the Drizzle adapter scopes operations to the verified actor; unit tests prove owner isolation, validation, conflict semantics, and permanent deletion.

**Out of scope:** Express routes, OpenAPI changes, generated artifacts, mobile sync, account registration, and executing a database push.

**Rules to follow:** Use cases receive `AuthenticatedActor`, never request headers; database access stays in the adapter; generate but do not apply a versioned migration; retain the documented no-retention deletion rule.

**Advanced coding pattern:** Deep application module. A small use-case API hides database implementation details behind a repository port.

**Anti-patterns:** Drizzle in route handlers; client-provided owner IDs; mock persistence; route tests that substitute for application tests; schema push as a migration strategy.

**Imports/exports:** Export only profile use-case input/output types and `ProfileRepository`. Keep Drizzle tables and query helpers private to the data adapter.

**Depends on:** T-012, T-015, T-016.

**Blocks:** T-018, T-019.

**Targeted validation commands:**

```powershell
pnpm --filter @workspace/api-server exec jest --runInBand artifacts/api-server/src/application/profile/profile.test.ts
pnpm --filter @workspace/api-server run typecheck
```

### Subtasks

- [ ] T-017.01 | AGENT | Target: `lib/db/src/schema/profile.ts`, `artifacts/api-server/src/middlewares/`, `artifacts/api-server/src/` | Analyze the profile table, verified actor contract, and current mock route behavior. Define retrieval, update, deletion, not-found, and revision/conflict semantics before implementation.
- [ ] T-017.02 | AGENT | Target: `artifacts/api-server/src/application/profile/profile.test.ts` | Write failing Given/When/Then application tests for owner-scoped retrieval, update, actor isolation, invalid update rejection, conflict response, deletion, and post-deletion retrieval.
- [ ] T-017.03 | AGENT | Target: `artifacts/api-server/src/application/profile/`, `artifacts/api-server/src/data/profile/`, `lib/db/` | Implement the repository port, profile use cases, Drizzle adapter, and versioned migration generation workflow. Do not register HTTP routes or execute database mutation.
- [ ] T-017.04 | AGENT | Target: `replit.md`, `TODO.md` | Document the profile application boundary, migration artifact, and unimplemented transport layer. Run focused tests and API typecheck before marking complete.

---

## [ ] T-018 | STATUS: TODO | Adapt the authenticated profile use cases to the HTTP contract

**Purpose:** Replace mock profile routes with validated adapters around the completed profile application module.

**Related file paths:** `lib/api-spec/openapi.yaml`, `lib/api-spec/orval.config.ts`, `lib/api-zod/src/generated/`, `lib/api-client-react/src/generated/`, `artifacts/api-server/src/routes/profile.ts`, `artifacts/api-server/src/routes/profile.test.ts`, `artifacts/api-server/src/app.ts`, `replit.md`.

**Definition of done:** Profile routes use verified actor identity and profile use cases; request and response values conform to OpenAPI-generated schemas; route tests prove authentication, ownership isolation, validation, conflict, and deletion behavior.

**Out of scope:** Changing profile database behavior, mobile synchronization, account UI, manually editing generated code, or adding unrelated routes.

**Rules to follow:** OpenAPI is the source of truth; regenerate outputs after contract changes; routes contain no Drizzle queries; preserve structured error mapping; do not add client-owned identity headers.

**Advanced coding pattern:** Thin HTTP adapter. Transport concerns map to a small application API and never determine domain ownership.

**Anti-patterns:** Mock responses; parsing authentication in each route; raw database records in HTTP responses; generated-file edits; broad test suite execution before focused route tests pass.

**Imports/exports:** Export the profile router only. Generated clients and Zod schemas remain owned by Orval.

**Depends on:** T-017.

**Blocks:** T-019, T-020.

**Targeted validation commands:**

```powershell
pnpm --filter @workspace/api-server exec jest --runInBand artifacts/api-server/src/routes/profile.test.ts
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-server run typecheck
```

### Subtasks

- [ ] T-018.01 | AGENT | Target: `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/routes/profile.ts`, `artifacts/api-server/src/routes/profile.test.ts` | Analyze the profile application result types and current contract. Reconcile status codes, validation errors, not-found behavior, and conflict response before editing.
- [ ] T-018.02 | AGENT | Target: `artifacts/api-server/src/routes/profile.test.ts` | Write failing Given/When/Then route tests for missing/invalid credentials, actor-scoped retrieval, rejected client owner header, valid update, invalid body, conflict, deletion, and not-found behavior.
- [ ] T-018.03 | AGENT | Target: `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/routes/profile.ts`, `lib/api-zod/src/generated/`, `lib/api-client-react/src/generated/` | Update the contract only when required by application behavior, regenerate artifacts, and implement the thin authenticated route adapter.
- [ ] T-018.04 | AGENT | Target: `replit.md`, `TODO.md` | Document the profile HTTP contract and generation command. Run only listed route/codegen/typecheck commands and record results.

---

## [ ] T-019 | STATUS: TODO | Align the mobile profile adapter with the verified profile contract

**Purpose:** Make local-first profile synchronization consume the generated client and explicit server outcomes without exposing transport to UI components.

**Related file paths:** `artifacts/mobile/domain/profile/ProfileRepository.ts`, `artifacts/mobile/context/AppContext.tsx`, `artifacts/mobile/__tests__/profile-repository.test.ts`, `lib/api-client-react/src/custom-fetch.ts`, `replit.md`.

**Definition of done:** The profile repository configures no UI-level transport details, preserves local data on remote failure, returns structured sync outcomes, and tests documented conflict and deletion behavior.

**Out of scope:** Syncing other modules, replacing AsyncStorage with SQLite, onboarding redesign, authentication-provider UI, or changing server behavior.

**Rules to follow:** UI components do not call generated APIs directly; do not convert empty local fields to `undefined` when the user intended to clear them; keep local load/save behavior available offline; distinguish storage, auth, network, validation, conflict, and deletion outcomes.

**Advanced coding pattern:** Anti-corruption layer. The repository maps local domain values and generated HTTP types in both directions while hiding transport details.

**Anti-patterns:** Direct generated-client calls from screens; local data deletion after a failed sync; collapsing every failure into `storage-error`; treating server timestamps as conflict resolution without an explicit policy.

**Imports/exports:** Export only domain-safe profile types, repository interface, factory, and typed operation outcomes. Keep generated API DTO mapping private.

**Depends on:** T-018.

**Blocks:** Future sync adoption for other feature modules.

**Targeted validation commands:**

```powershell
pnpm --filter @workspace/mobile exec jest --runInBand artifacts/mobile/__tests__/profile-repository.test.ts
pnpm --filter @workspace/mobile run typecheck
```

### Subtasks

- [ ] T-019.01 | AGENT | Target: `artifacts/mobile/domain/profile/ProfileRepository.ts`, `artifacts/mobile/context/AppContext.tsx`, `lib/api-client-react/src/custom-fetch.ts` | Analyze repository lifecycle, generated client signatures, authentication/base-URL composition, and existing UI error handling. Confirm that the server contract supports explicit clearing and conflict reporting.
- [ ] T-019.02 | AGENT | Target: `artifacts/mobile/__tests__/profile-repository.test.ts` | Write failing Given/When/Then tests for remote success, network failure with preserved local data, invalid credentials, conflict result, explicit empty-field update, and server-deleted profile handling.
- [ ] T-019.03 | AGENT | Target: `artifacts/mobile/domain/profile/ProfileRepository.ts`, `artifacts/mobile/context/AppContext.tsx` | Implement generated-client mapping and typed sync outcomes behind the repository. Update the context only to surface domain-safe outcomes; do not expose HTTP errors or generated DTOs.
- [ ] T-019.04 | AGENT | Target: `replit.md`, `TODO.md` | Document profile local-first behavior and known limits. Run the focused repository test and mobile typecheck before marking complete.

---

## [ ] T-020 | STATUS: TODO | Add non-mutating quality gates for architecture boundaries

**Purpose:** Make structural regressions visible before more modules are added.

**Related file paths:** `package.json`, `.github/workflows/quality.yml`, `pnpm-workspace.yaml`, `lib/api-spec/package.json`, `artifacts/mobile/package.json`, `artifacts/api-server/package.json`, `README.md`, `replit.md`.

**Definition of done:** CI checks formatting, linting, typechecking, focused test suites, and generated-contract drift without running database push or deployment commands. The root scripts make the same checks available locally.

**Out of scope:** Enforcing arbitrary coverage percentages, end-to-end device automation, visual regression testing, dependency upgrades unrelated to the gate, or database mutation.

**Rules to follow:** Use one formatter and one linter; do not ignore violations globally; generated-code drift detection must not leave changes behind; preserve pnpm lockfile policy; commands must work on Windows and Linux.

**Advanced coding pattern:** Architecture fitness functions. Automated checks enforce repository invariants continuously rather than relying on manual review.

**Anti-patterns:** A formatter that rewrites files in CI; running `drizzle-kit push` in CI; disabling lint rules to silence existing defects; relying only on a full build for feedback.

**Imports/exports:** No application imports or exports change.

**Depends on:** T-010.

**Blocks:** Reliable expansion of additional modules.

**Targeted validation commands:**

```powershell
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm --filter @workspace/mobile test -- --runInBand
pnpm --filter @workspace/api-server test -- --runInBand
pnpm --filter @workspace/api-spec run codegen
git diff --exit-code
```

### Subtasks

- [ ] T-020.01 | AGENT | Target: root and package manifests, `.github/workflows/quality.yml` | Research existing formatting, linting, code-generation, TypeScript, test, Node, and pnpm conventions. Verify whether code generation is deterministic before adding a drift check.
- [ ] T-020.02 | AGENT | Target: formatter/linter configuration files and relevant manifests | Add the smallest compatible formatter and linter configuration with check-only root scripts. Resolve only violations reported by the new targeted commands; do not suppress broad rules without a documented technical reason.
- [ ] T-020.03 | AGENT | Target: `.github/workflows/quality.yml`, `package.json`, `lib/api-spec/package.json` | Add CI steps for format check, lint, existing typecheck/tests, and deterministic codegen followed by `git diff --exit-code`. Keep all commands non-mutating to database and deployment environments.
- [ ] T-020.04 | AGENT | Target: `README.md`, `replit.md`, `TODO.md` | Document local quality commands, CI behavior, and generated-code ownership. Run each listed validation command and record exact outcomes before marking complete.

---

## Task Completion Notes

Use this format after each completed parent task:

```text
YYYY-MM-DD | TASK-ID | commands run | result | follow-up or none
```

- 2026-07-20 | T-010 | `pnpm run typecheck` (passed), `pnpm --filter @workspace/mobile test -- --runInBand` (17/17 passed), `pnpm --filter @workspace/api-server test -- --runInBand` (10/10 passed), `pnpm --filter @workspace/mobile exec node --test server/serve.test.js` (12/12 passed), `pnpm --filter @workspace/api-spec run codegen` (Orval 8.21.0, generated code matched tracked files) | DONE | Verified README.md, replit.md, and TODO.md updated with baseline facts. Next: T-011.
- 2026-07-20 | T-011 | `pnpm run typecheck` (passed) | DONE | Created `docs/architecture/context-map.md` with all 12 bounded contexts, dependency rules, provider policy, and migration debt table. Updated `replit.md` with context map pointer and module dependency rules. No production imports/exports changed.
- 2026-07-20 | T-012 | `pnpm --filter @workspace/domain-core test -- --runInBand` (8/8 passed), `pnpm --filter @workspace/domain-core run typecheck` (passed), `pnpm run typecheck` (passed), `pnpm --filter @workspace/domain-core run build` (passed) | DONE | Created `@workspace/domain-core` with `EntityId` branding helpers, `Result<T,E>`, `Clock`/`IdGenerator` ports, and deterministic test adapters. Added project reference in root `tsconfig.json` and documented the package boundary in `replit.md`. No existing feature migrated.
- 2026-07-20 | T-013 | `pnpm --filter @workspace/mobile exec jest --runInBand artifacts/mobile/__tests__/entity-reference-policy.test.ts` (10/10 passed), `pnpm run typecheck` (passed) | DONE | Created `docs/architecture/relationships.md` with relationship model, matrix of all `linked*Ids` fields, proposed `RelationshipRepository`/`RelationshipPolicy` contracts, deletion semantics, and current-vs-target mismatches. Added `replit.md` pointer. No production code changed.
- 2026-07-20 | T-014 | `pnpm --filter @workspace/mobile exec jest --runInBand artifacts/mobile/__tests__/entity-reference-policy.test.ts artifacts/mobile/__tests__/reference-cleanup-service.test.ts` (19/19 passed), `pnpm --filter @workspace/mobile run typecheck` (passed) | DONE | Refactored `EntityReferencePolicy` to feature-neutral DTOs, introduced `ReferenceCollectionStore` port and `createAsyncStorageReferenceCollectionStore`, rewrote `ReferenceCleanupService` with shape validation and `CleanupResult`, updated all context deletion callers, removed dead `ReferenceCleanupOrchestrator.ts`, and added `reference-cleanup-service.test.ts`. Fixed notes-loaded-from-budget and notes-wrapper-overwrite bugs. Documented AsyncStorage boundary and remaining non-atomic write limitation in `replit.md` and `docs/architecture/relationships.md`. Follow-up: T-015.
- 2026-07-20 | T-015 | `pnpm --filter @workspace/api-server test -- --runInBand` (16/16 passed), `pnpm --filter @workspace/api-server run typecheck` (passed), `pnpm run typecheck` (passed) | DONE | Established server-side identity boundary with `AuthenticatedActor`, `AuthVerifier` port, `createAuthMiddleware`, `createTestAuthVerifier`, and `createPlaceholderAuthVerifier`. Updated profile routes to consume `req.actor`, rejected `X-User-Id` client header, created `.env.example`, and updated `README.md`/`replit.md`. Follow-up: T-016.
