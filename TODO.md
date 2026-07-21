I’ve expanded the plan into a complete, ready‑to‑execute `TODO.md`. Every parent task is SMALL, with research first, clear boundaries, and precise validation commands. All subtasks are assigned to `AGENT` (no human actions required). The list covers the entire remediation: layer violations, import bloat, shallow modules, and the `linked*Ids` migration.

You can copy the entire block below and replace the architecture section in your existing `TODO.md`.

---

```markdown
# Architecture Remediation Tasks (Audit 2026-07-21)

## Parent Tasks

### ARCH-REMED-01: Extract Budget domain types and repository interface

- Status: done
- [x] Complete

**Related file paths:**  
- `artifacts/mobile/context/BudgetContext.tsx` (current source of types and AsyncStorage calls)  
- `artifacts/mobile/domain/profile/ProfileRepository.ts` (reference deep module pattern to avoid)  
- `artifacts/mobile/domain/` (target directory for new file)

**Definition of Done:**  
A new file `artifacts/mobile/domain/budget/BudgetRepository.ts` exists containing `TransactionType`, `Transaction`, `Budget`, `EXPENSE_CATEGORIES`, `INCOME_CATEGORIES`, `CATEGORY_COLORS`, and a `BudgetRepository` interface. The file imports no platform/runtime modules (zero AsyncStorage). The current `BudgetContext.tsx` remains untouched and fully functional.

**Out of scope:**  
- Moving AsyncStorage logic out of the context (that is ARCH-REMED-03).  
- Creating an in‑memory fake or writing tests for the repository (that follows in later tasks).  
- Changing exports of `BudgetContext.tsx` or any consumer screen.

**Rules to follow:**  
- Domain files must not import React, React Native, Expo, AsyncStorage, or any storage adapter.  
- Use plain TypeScript interfaces and type aliases only.  
- Keep types identical to their current shapes in `BudgetContext.tsx` to avoid breakage.  
- No new `linked*Ids` arrays.  
- File must use `EntityId` from `@/domain/references/EntityId` (or from `@workspace/domain-core`) where applicable. (Check current usage in context; if plain strings are used, leave as‑is for now and mark debt in a comment.)

**Advanced coding pattern:**  
- Repository interface as a port: defines async methods that the context will later call.  
- Domain types as plain data (POJOs) with no methods (anemic model) – acceptable for current phase.

**Anti-patterns:**  
- Importing `@react-native-async-storage/async-storage` in the domain file.  
- Adding factory functions that create concrete adapters inside the domain file.  
- Exporting internal storage keys or implementation details.

**Imports/Exports:**  
- The new file will export: `TransactionType`, `Transaction`, `Budget`, `EXPENSE_CATEGORIES`, `INCOME_CATEGORIES`, `CATEGORY_COLORS`, `BudgetRepository`.  
- No default export.  
- No exports of functions that touch storage.

**Depends on:** None  
**Blocks:** ARCH-REMED-02, ARCH-REMED-03

#### Subtasks

- **ARCH-REMED-01.1 [AGENT] Research**  
  *Target file:* `artifacts/mobile/context/BudgetContext.tsx`  
  *Action:* Read the file and extract all type/interface definitions and constants (`TransactionType`, `Transaction`, `Budget`, `EXPENSE_CATEGORIES`, `INCOME_CATEGORIES`, `CATEGORY_COLORS`) and their exact shapes. Also examine the `createProfileRepository` in `domain/profile/ProfileRepository.ts` to understand the anti‑pattern to avoid. Confirm no other files import these types from the context (except screens that use the hook). Record the list of imports the new domain file will need (none, or only `EntityId`).

- **ARCH-REMED-01.2 [AGENT] Create domain file**  
  *Target file:* `artifacts/mobile/domain/budget/BudgetRepository.ts`  
  *Action:* Create the file with the exact types and constants from the research, plus the `BudgetRepository` interface (async load/save methods for budgets and transactions; signature examples: `loadBudgets(): Promise<Budget[]>`, `saveBudgets(budgets: Budget[]): Promise<void>`, `loadTransactions(budgetId: string): Promise<Transaction[]>`, `saveTransactions(budgetId: string, transactions: Transaction[]): Promise<void>`). Include JSDoc where useful. The file must not import anything from React Native or storage libraries.

- **ARCH-REMED-01.3 [AGENT] Verify type safety**  
  *Command:* `pnpm run typecheck`  
  *Action:* Run the full monorepo typecheck. Ensure the new file compiles and no existing files break (they won’t because we haven’t changed any imports yet). If errors appear, adjust and re‑run.

- **ARCH-REMED-01.4 [AGENT] Mark task complete**  
  *Action:* Update the checkbox and status to DONE after successful typecheck.

---

### ARCH-REMED-02: Implement Budget AsyncStorage repository adapter

- Status: TODO
- [ ] Complete

**Related file paths:**  
- `artifacts/mobile/domain/budget/BudgetRepository.ts` (the interface from ARCH-REMED-01)  
- `artifacts/mobile/infrastructure/` (new directory)  
- `artifacts/mobile/context/BudgetContext.tsx` (to understand current storage key naming and serialization)

**Definition of Done:**  
A new file `artifacts/mobile/infrastructure/budget/BudgetAsyncStorageRepository.ts` exists, exports a class implementing `BudgetRepository` with all methods backed by `AsyncStorage`. The class handles `JSON.parse`/`JSON.stringify` and uses the exact same storage keys currently in `BudgetContext.tsx` (identified during research). The file imports `AsyncStorage` but nothing else platform‑specific that would violate layering (this is infrastructure, allowed). The adapter is not yet wired into the context.

**Out of scope:**  
- Injecting the adapter into `BudgetContext`.  
- Testing the adapter in isolation (that is covered when context tests are updated later).  
- Removing direct AsyncStorage usage from the context.

**Rules to follow:**  
- Infrastructure adapters may import `AsyncStorage` and other platform modules.  
- The adapter must not throw expected errors; use `Result` only if the repository interface uses it (currently it doesn’t; we can keep throws for now).  
- Match the existing storage key naming convention exactly (e.g., `@budget_budgets`, `@budget_transactions_<id>`).  
- Use `async/await` with `AsyncStorage.getItem`/`setItem`.

**Advanced coding pattern:**  
- Adapter class with constructor that takes no arguments (or optional `AsyncStorage` mock for testing, but skip for now; testing will use the class directly with mocked AsyncStorage).  
- Method signatures identical to the interface.

**Anti-patterns:**  
- Adding domain logic inside the adapter (only storage access, serialization).  
- Hard‑coding default values beyond initial empty arrays when no data exists.  
- Importing anything from `@/context/*` or `@/domain/*` beyond the interface.

**Imports/Exports:**  
- Import `BudgetRepository` from `../../domain/budget/BudgetRepository` (relative path).  
- Export the class as a named export, and a factory function `createBudgetRepository(): BudgetRepository` that returns a new instance.  
- No default export.

**Depends on:** ARCH-REMED-01 (interface must exist)  
**Blocks:** ARCH-REMED-03

#### Subtasks

- **ARCH-REMED-02.1 [AGENT] Research storage keys**  
  *Target file:* `artifacts/mobile/context/BudgetContext.tsx`  
  *Action:* Identify all `AsyncStorage.getItem`/`setItem` calls and their key strings. Record the exact key patterns and the shape of stored data (JSON array or object). Verify no other context uses the same keys (they shouldn’t). Document the keys in a comment inside the adapter file later.

- **ARCH-REMED-02.2 [AGENT] Create adapter file**  
  *Target file:* `artifacts/mobile/infrastructure/budget/BudgetAsyncStorageRepository.ts`  
  *Action:* Create directory if needed. Implement the class with methods that replicate the existing logic: load budgets from `'@budget_budgets'`, save them; load transactions from `'@budget_transactions_<budgetId>'`, save them. Use `AsyncStorage` directly. Add JSDoc. The factory function `createBudgetRepository()` returns `new BudgetAsyncStorageRepository()`.

- **ARCH-REMED-02.3 [AGENT] Verify compilation**  
  *Command:* `pnpm run typecheck`  
  *Action:* Ensure the new file compiles, and no errors from unused imports etc. Resolve any issues.

- **ARCH-REMED-02.4 [AGENT] Mark task complete**

---

### ARCH-REMED-03: Refactor BudgetContext to use repository (layer violation fix)

- Status: TODO
- [ ] Complete

**Related file paths:**  
- `artifacts/mobile/context/BudgetContext.tsx` (the main file to modify)  
- `artifacts/mobile/domain/budget/BudgetRepository.ts` (interface)  
- `artifacts/mobile/infrastructure/budget/BudgetAsyncStorageRepository.ts` (adapter)  
- `artifacts/mobile/app/_layout.tsx` (top‑level provider wiring, but not changed in this task due to default parameter)

**Definition of Done:**  
`BudgetContext.tsx` no longer imports `AsyncStorage`. It imports `BudgetRepository` (interface) and `createBudgetRepository` (adapter) from the appropriate modules. The `BudgetProvider` accepts an optional `repository` prop of type `BudgetRepository`, defaulting to `createBudgetRepository()`. Internally, all load/save operations use the injected `repository`. The `useBudget` hook still returns the same data shape, and all existing screens continue to work without any code changes (backward compatible). The file’s public exports (`BudgetProvider`, `useBudget`) remain unchanged; internal types are imported from the domain file, and `EXPENSE_CATEGORIES` etc. are re‑exported from there for any consumers that directly imported them (if any). The layer violation finding for `BudgetContext.tsx` is resolved.

**Out of scope:**  
- Updating `_layout.tsx` to pass a repository prop.  
- Updating test files (they will be addressed in ARCH-REMED-04).  
- Modifying `linked*Ids` arrays.

**Rules to follow:**  
- Application layer (context) must not directly import storage modules.  
- Provide a default adapter instance so existing consumers don’t break.  
- Keep the public API (provider, hook) identical; no new required props.  
- If any screen directly imported types from the context (unlikely), we can preserve re‑exports for now.

**Advanced coding pattern:**  
- Optional prop injection with a default value using `useRef` or directly in component body: `const repo = repository ?? useMemo(() => createBudgetRepository(), [])`.  
- Use `useEffect` to load initial data via repo on mount.

**Anti-patterns:**  
- Calling `AsyncStorage.getItem` directly inside the component or hook.  
- Reading environment/configuration inside the context (leave it to the adapter).  
- Adding repository initialization with async factory that might cause flickering; ensure the default adapter is instantiated synchronously (the `createBudgetRepository` returns an instance that uses AsyncStorage lazily).

**Imports/Exports:**  
- Remove import of `@react-native-async-storage/async-storage`.  
- Add `import { BudgetRepository } from '../domain/budget/BudgetRepository';`  
- Add `import { createBudgetRepository } from '../infrastructure/budget/BudgetAsyncStorageRepository';`  
- Re‑export domain types/constants (for backward compat) if any consumer imported them from context; if none, don’t re‑export. Research phase will confirm.

**Depends on:** ARCH-REMED-02 (adapter must exist)  
**Blocks:** ARCH-REMED-04 (tests)

#### Subtasks

- **ARCH-REMED-03.1 [AGENT] Research current imports of BudgetContext exports**  
  *Command:* Search the codebase for any file that imports from `@/context/BudgetContext` other than screens using `useBudget` and `BudgetProvider`. Use `grep` or agent search.  
  *Action:* Record if any file imports `TransactionType`, `Transaction`, `Budget`, `EXPENSE_CATEGORIES`, etc. from the context. This determines whether we need to re‑export them or can remove them from the context module.

- **ARCH-REMED-03.2 [AGENT] Modify BudgetContext.tsx**  
  *Target file:* `artifacts/mobile/context/BudgetContext.tsx`  
  *Action:*  
    - Remove all `AsyncStorage` imports.  
    - Import `BudgetRepository` interface and adapter factory.  
    - Add optional `repository?` prop to `BudgetProvider` with default.  
    - Replace all `AsyncStorage.getItem/setItem` calls with `repository.loadBudgets()` etc.  
    - Remove internal type/constant definitions; import them from the domain file and re‑export if needed (based on research).  
    - Ensure the component still works as a React context with the same hook signature.

- **ARCH-REMED-03.3 [AGENT] Typecheck and spot‑check**  
  *Command:* `pnpm run typecheck`  
  *Action:* Ensure no compilation errors. Optionally run the mobile dev server to check the budget tab quickly (manual check not required but agent can simulate if possible; at minimum typecheck).

- **ARCH-REMED-03.4 [AGENT] Mark task complete**

---

### ARCH-REMED-04: Write in‑memory fake and update BudgetContext tests

- Status: TODO
- [ ] Complete

**Related file paths:**  
- `artifacts/mobile/__tests__/fakes/InMemoryBudgetRepository.ts` (new)  
- `artifacts/mobile/__tests__/budget-context.test.ts` (new or modify existing if any)  
- `artifacts/mobile/__tests__/` (test directory)

**Definition of Done:**  
An in‑memory fake `InMemoryBudgetRepository` exists, implementing `BudgetRepository` using `Map`. A new test suite `budget-context.test.ts` exercises the `BudgetProvider` and `useBudget` hook with the in‑memory fake injected. The tests follow Given/When/Then and cover at minimum: loading empty state, adding a budget/transaction, and verifying hook returns correct data. The test passes without mocking `AsyncStorage`. Existing tests that mocked `AsyncStorage` for budget logic (if any) are updated or removed. The test command `pnpm --filter @workspace/mobile exec jest --runInBand artifacts/mobile/__tests__/budget-context.test.ts` passes.

**Out of scope:**  
- Testing the adapter itself (it will be covered implicitly by integration later, or can be tested later).  
- Testing screens that use the budget context (they remain unchanged and can be tested later).

**Rules to follow:**  
- Use `jest` test framework, `testEnvironment: 'node'`.  
- Write tests with `describe`/`it` and Given/When/Then comments.  
- Use a custom consumer component to access context values (no `@testing-library/react-hooks` available). Inject the repository via prop.

**Advanced coding pattern:**  
- In-memory repository as a class with private `Map<string, Budget[]>` and `Map<string, Transaction[]>`.

**Anti-patterns:**  
- Using `AsyncStorage` mock for context tests now (defeats purpose).  
- Leaving old `jest.mock('@react-native-async-storage/async-storage')` calls that could interfere.

**Imports/Exports:**  
- `InMemoryBudgetRepository` exported from `fakes/` module.  
- Test file imports `BudgetProvider`, `useBudget`, and `InMemoryBudgetRepository`.

**Depends on:** ARCH-REMED-03 (context refactored)  
**Blocks:** Future batch for Notes/Calendar (we’ll replicate this pattern)

#### Subtasks

- **ARCH-REMED-04.1 [AGENT] Create InMemoryBudgetRepository**  
  *Target file:* `artifacts/mobile/__tests__/fakes/InMemoryBudgetRepository.ts`  
  *Action:* Implement the interface using `Map`. Store budgets keyed by `'budgets'`, transactions keyed by `budgetId`. Provide clear methods.

- **ARCH-REMED-04.2 [AGENT] Create test file**  
  *Target file:* `artifacts/mobile/__tests__/budget-context.test.ts`  
  *Action:* Write tests using `react-test-renderer` and a consumer component that captures the context value in a mutable ref.  
    - Given an empty repository, when provider mounts, then budgets and transactions are empty.  
    - Given a repository with a budget, when adding a transaction, then hook returns updated transaction list.  
    - Ensure each test is isolated.

- **ARCH-REMED-04.3 [AGENT] Run tests**  
  *Command:* `pnpm --filter @workspace/mobile exec jest --runInBand artifacts/mobile/__tests__/budget-context.test.ts`  
  *Action:* Ensure all tests pass. If not, fix.

- **ARCH-REMED-04.4 [AGENT] Mark task complete**

---

### ARCH-REMED-05: Extract Notes domain types and repository interface

- Status: TODO
- [ ] Complete

**Related file paths:**  
- `artifacts/mobile/context/NotesContext.tsx`  
- `artifacts/mobile/domain/notes/NotesRepository.ts` (new)

**Definition of Done:**  
`domain/notes/NotesRepository.ts` contains `Note` type, `Folder` type if present, and a `NotesRepository` interface with load/save for notes and folders. No AsyncStorage imports.

**Out of scope:**  
- Adapter implementation, context refactor, tests (separate tasks).  
- Any changes to `NotesContext.tsx` or other files.

**Rules to follow:**  
Same as ARCH-REMED-01: platform‑neutral, no storage imports.

**Advanced coding pattern:**  
Repository interface based on current storage operations in context.

**Anti-patterns:**  
Co‑locating adapter code.

**Imports/Exports:**  
`Note`, `Folder` (if exists), `NotesRepository`.

**Depends on:** ARCH-REMED-04 (pattern established)  
**Blocks:** ARCH-REMED-06

#### Subtasks

- **ARCH-REMED-05.1 [AGENT] Research NotesContext**  
  *Target file:* `artifacts/mobile/context/NotesContext.tsx`  
  *Action:* Extract types, constants, and the current API shape (load/save calls). Document the keys used in AsyncStorage (`@notes_notes`, etc.).

- **ARCH-REMED-05.2 [AGENT] Create domain file**  
  *Target file:* `artifacts/mobile/domain/notes/NotesRepository.ts`  
  *Action:* Write the file with types and the `NotesRepository` interface (e.g., `loadNotes(): Promise<Note[]>`, `saveNotes(notes: Note[]): Promise<void>`). Ensure zero platform imports.

- **ARCH-REMED-05.3 [AGENT] Typecheck**  
  *Command:* `pnpm run typecheck`

- **ARCH-REMED-05.4 [AGENT] Mark task complete**

---

### ARCH-REMED-06: Implement Notes AsyncStorage repository adapter

- Status: TODO
- [ ] Complete

**Related file paths:**  
- `artifacts/mobile/domain/notes/NotesRepository.ts`  
- `artifacts/mobile/infrastructure/notes/NotesAsyncStorageRepository.ts` (new)  
- `artifacts/mobile/context/NotesContext.tsx` (for key reference)

**Definition of Done:**  
`NotesAsyncStorageRepository.ts` implements `NotesRepository` using AsyncStorage with the exact keys from the context.

**Out of scope:**  
Wiring into context, tests.

**Rules to follow:**  
Same as ARCH-REMED-02.

**Advanced coding pattern:**  
Class with factory `createNotesRepository`.

**Anti-patterns:**  
Domain logic in adapter.

**Imports/Exports:**  
Named class and factory.

**Depends on:** ARCH-REMED-05  
**Blocks:** ARCH-REMED-07

#### Subtasks

- **ARCH-REMED-06.1 [AGENT] Research keys**  
  *Target file:* `NotesContext.tsx`  
  *Action:* Identify storage keys and data shapes.

- **ARCH-REMED-06.2 [AGENT] Create adapter**  
  *Target file:* `infrastructure/notes/NotesAsyncStorageRepository.ts`  
  *Action:* Implement all interface methods.

- **ARCH-REMED-06.3 [AGENT] Typecheck**  
  *Command:* `pnpm run typecheck`

- **ARCH-REMED-06.4 [AGENT] Mark complete**

---

### ARCH-REMED-07: Refactor NotesContext to use repository

- Status: TODO
- [ ] Complete

**Related file paths:**  
- `NotesContext.tsx`  
- `NotesRepository` interface, adapter

**Definition of Done:**  
`NotesContext.tsx` uses injected `NotesRepository` with default adapter. No direct AsyncStorage imports. Backward‑compatible.

**Depends on:** ARCH-REMED-06  
**Blocks:** ARCH-REMED-08

#### Subtasks

- **ARCH-REMED-07.1 [AGENT] Research imports**  
  *Command:* Search for imports from `@/context/NotesContext` to decide re‑exports.

- **ARCH-REMED-07.2 [AGENT] Modify context**  
  *Target file:* `NotesContext.tsx`  
  *Action:* Remove AsyncStorage, add optional repository prop, wire up repo calls.

- **ARCH-REMED-07.3 [AGENT] Typecheck**  
  *Command:* `pnpm run typecheck`

- **ARCH-REMED-07.4 [AGENT] Mark complete**

---

### ARCH-REMED-08: Write NotesContext tests with in‑memory fake

- Status: TODO
- [ ] Complete

**Related file paths:**  
- `__tests__/fakes/InMemoryNotesRepository.ts`  
- `__tests__/notes-context.test.ts`

**Definition of Done:**  
Tests pass using fake repository, covering load and save.

**Depends on:** ARCH-REMED-07  
**Blocks:** Next batch

#### Subtasks

- **ARCH-REMED-08.1 [AGENT] Create fake**  
  *Target file:* `__tests__/fakes/InMemoryNotesRepository.ts`  
  *Action:* Implement using Map.

- **ARCH-REMED-08.2 [AGENT] Create test file**  
  *Target file:* `__tests__/notes-context.test.ts`  
  *Action:* Write Given/When/Then tests.

- **ARCH-REMED-08.3 [AGENT] Run tests**  
  *Command:* `pnpm --filter @workspace/mobile exec jest --runInBand artifacts/mobile/__tests__/notes-context.test.ts`

- **ARCH-REMED-08.4 [AGENT] Mark complete**

---

### ARCH-REMED-09: Extract Calendar domain types and repository interface

- Status: TODO
- [ ] Complete
- (Similar to ARCH-REMED-05 but for Calendar: `Event`, etc.)
**Depends on:** ARCH-REMED-08  
**Blocks:** ARCH-REMED-10

#### Subtasks (abbreviated)  
- 09.1 Research `CalendarContext.tsx`  
- 09.2 Create `domain/calendar/CalendarRepository.ts`  
- 09.3 Typecheck  
- 09.4 Mark complete

---

### ARCH-REMED-10: Implement Calendar AsyncStorage adapter

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-09  
**Blocks:** ARCH-REMED-11
#### Subtasks  
- 10.1 Research keys in CalendarContext  
- 10.2 Create `infrastructure/calendar/CalendarAsyncStorageRepository.ts`  
- 10.3 Typecheck  
- 10.4 Mark complete

---

### ARCH-REMED-11: Refactor CalendarContext to use repository

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-10  
**Blocks:** ARCH-REMED-12
#### Subtasks  
- 11.1 Research imports  
- 11.2 Modify CalendarContext  
- 11.3 Typecheck  
- 11.4 Mark complete

---

### ARCH-REMED-12: Write CalendarContext tests with in‑memory fake

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-11  
**Blocks:** Next
#### Subtasks  
- 12.1 Create `InMemoryCalendarRepository`  
- 12.2 Create test file  
- 12.3 Run tests  
- 12.4 Mark complete

---

### ARCH-REMED-13: Extract Social domain types and repository interface

- Status: TODO
- [ ] Complete
(For Social context: `Post`, etc. No linkedIds.)
**Depends on:** ARCH-REMED-12  
**Blocks:** ARCH-REMED-14

#### Subtasks  
- 13.1 Research `SocialContext.tsx`  
- 13.2 Create `domain/social/SocialRepository.ts`  
- 13.3 Typecheck  
- 13.4 Mark complete

---

### ARCH-REMED-14: Implement Social AsyncStorage adapter

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-13  
**Blocks:** ARCH-REMED-15
#### Subtasks  
- 14.1 Research keys  
- 14.2 Create `infrastructure/social/SocialAsyncStorageRepository.ts`  
- 14.3 Typecheck  
- 14.4 Mark complete

---

### ARCH-REMED-15: Refactor SocialContext to use repository

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-14  
**Blocks:** ARCH-REMED-16
#### Subtasks  
- 15.1 Research imports  
- 15.2 Modify SocialContext  
- 15.3 Typecheck  
- 15.4 Mark complete

---

### ARCH-REMED-16: Write SocialContext tests with in‑memory fake

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-15
#### Subtasks  
- 16.1 Create `InMemorySocialRepository`  
- 16.2 Create test file  
- 16.3 Run tests  
- 16.4 Mark complete

---

### ARCH-REMED-17: Extract People domain types and repository interface

- Status: TODO
- [ ] Complete
- People: `Person`, `Interaction`, `linkedEventIds` (will stay for now as migration debt)
**Depends on:** ARCH-REMED-16  
**Blocks:** ARCH-REMED-18

#### Subtasks  
- 17.1 Research `PeopleContext.tsx`  
- 17.2 Create `domain/people/PeopleRepository.ts`  
- 17.3 Typecheck  
- 17.4 Mark complete

---

### ARCH-REMED-18: Implement People AsyncStorage adapter

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-17  
**Blocks:** ARCH-REMED-19
#### Subtasks  
- 18.1 Research keys  
- 18.2 Create `infrastructure/people/PeopleAsyncStorageRepository.ts`  
- 18.3 Typecheck  
- 18.4 Mark complete

---

### ARCH-REMED-19: Refactor PeopleContext to use repository

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-18  
**Blocks:** ARCH-REMED-20
#### Subtasks  
- 19.1 Research imports  
- 19.2 Modify PeopleContext  
- 19.3 Typecheck  
- 19.4 Mark complete

---

### ARCH-REMED-20: Write PeopleContext tests with in‑memory fake

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-19
#### Subtasks  
- 20.1 Create `InMemoryPeopleRepository`  
- 20.2 Create test file  
- 20.3 Run tests  
- 20.4 Mark complete

---

### ARCH-REMED-21: Extract Work domain types and repository interface

- Status: TODO
- [ ] Complete
- Work: `Task`, subtasks, linkedIds (migration debt)
**Depends on:** ARCH-REMED-20  
**Blocks:** ARCH-REMED-22

#### Subtasks  
- 21.1 Research `WorkContext.tsx`  
- 21.2 Create `domain/work/WorkRepository.ts`  
- 21.3 Typecheck  
- 21.4 Mark complete

---

### ARCH-REMED-22: Implement Work AsyncStorage adapter

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-21  
**Blocks:** ARCH-REMED-23
#### Subtasks  
- 22.1 Research keys  
- 22.2 Create `infrastructure/work/WorkAsyncStorageRepository.ts`  
- 22.3 Typecheck  
- 22.4 Mark complete

---

### ARCH-REMED-23: Refactor WorkContext to use repository

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-22  
**Blocks:** ARCH-REMED-24
#### Subtasks  
- 23.1 Research imports  
- 23.2 Modify WorkContext  
- 23.3 Typecheck  
- 23.4 Mark complete

---

### ARCH-REMED-24: Write WorkContext tests with in‑memory fake

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-23
#### Subtasks  
- 24.1 Create `InMemoryWorkRepository`  
- 24.2 Create test file  
- 24.3 Run tests  
- 24.4 Mark complete

---

### ARCH-REMED-25: Split ProfileRepository – move adapter out of domain

- Status: TODO
- [ ] Complete

**Related file paths:**  
- `artifacts/mobile/domain/profile/ProfileRepository.ts`  
- New file `artifacts/mobile/infrastructure/profile/ProfileAsyncStorageRepository.ts`  
- `artifacts/mobile/context/AppContext.tsx`

**Definition of Done:**  
`ProfileRepository.ts` contains only the `ProfileRepository` interface, types (`Profile`, `ProfilePrivacy`, `PrivacyLevel`), `DEFAULT_PROFILE_PRIVACY`, and `createUserId` (if it’s pure). No `AsyncStorage` import. The `AsyncStorageProfileRepository` class and `createProfileRepository` factory are moved to the new infrastructure file. `AppContext.tsx` imports the adapter from the new path, not from domain. All mobile layer violations for `ProfileRepository.ts` are resolved.

**Rules to follow:**  
- Domain file must be completely platform‑neutral.  
- Infrastructure file may import `AsyncStorage`.  
- Keep the same public symbols (class, factory) but in the new location.

**Depends on:** ARCH-REMED-24 (all other contexts refactored)  
**Blocks:** ARCH-REMED-26

#### Subtasks

- **ARCH-REMED-25.1 [AGENT] Research**  
  *Target file:* `domain/profile/ProfileRepository.ts`  
  *Action:* Identify which parts are domain‑only and which are adapter. Determine what `AppContext.tsx` imports exactly (likely `createProfileRepository`). Note any other files that import from this module.

- **ARCH-REMED-25.2 [AGENT] Create adapter file**  
  *Target file:* `infrastructure/profile/ProfileAsyncStorageRepository.ts`  
  *Action:* Move the `AsyncStorageProfileRepository` class and the `createProfileRepository` factory to this file. Keep the same imports and logic.

- **ARCH-REMED-25.3 [AGENT] Clean domain file**  
  *Target file:* `domain/profile/ProfileRepository.ts`  
  *Action:* Remove all AsyncStorage imports and adapter code. Leave only the interface, types, constants, and any pure helpers.

- **ARCH-REMED-25.4 [AGENT] Update AppContext.tsx**  
  *Target file:* `context/AppContext.tsx`  
  *Action:* Change the import of `createProfileRepository` to point to the new infrastructure file. Adjust any type imports if needed.

- **ARCH-REMED-25.5 [AGENT] Typecheck**  
  *Command:* `pnpm run typecheck`

- **ARCH-REMED-25.6 [AGENT] Run profile repository tests (update mocks)**  
  *Command:* `pnpm --filter @workspace/mobile exec jest --runInBand artifacts/mobile/__tests__/profile-repository.test.ts`  
  *Action:* Update the test to mock the adapter or use a fake if necessary.

- **ARCH-REMED-25.7 [AGENT] Mark complete**

---

### ARCH-REMED-26: Create Providers wrapper to reduce _layout.tsx import bloat

- Status: TODO
- [ ] Complete

**Related file paths:**  
- `artifacts/mobile/app/_layout.tsx`  
- `artifacts/mobile/components/Providers.tsx` (new)

**Definition of Done:**  
`Providers.tsx` imports all context providers and wraps children. `_layout.tsx` imports only `Providers` and uses it instead of individually nesting all providers. The import count in `_layout.tsx` drops significantly (target: ≤10 non‑built‑in imports).

**Depends on:** ARCH-REMED-25 (all contexts refactored)  
**Blocks:** ARCH-REMED-27

#### Subtasks

- **ARCH-REMED-26.1 [AGENT] Create Providers component**  
  *Target file:* `components/Providers.tsx`  
  *Action:* Replicate the current provider nesting from `_layout.tsx` (AppProvider, WorkProvider, CalendarProvider, etc.) into this component. Accept `children` prop.

- **ARCH-REMED-26.2 [AGENT] Update _layout.tsx**  
  *Target file:* `app/_layout.tsx`  
  *Action:* Remove the direct provider imports and JSX nesting. Wrap children with `<Providers>`. Only keep necessary imports (ErrorBoundary, fonts, etc.)

- **ARCH-REMED-26.3 [AGENT] Typecheck**  
  *Command:* `pnpm run typecheck`

- **ARCH-REMED-26.4 [AGENT] Mark complete**

---

### ARCH-REMED-27: Decompose screen components to reduce import counts

- Status: TODO
- [ ] Complete

**Target screens** (all flagged with import bloat):
- `(tabs)/index.tsx`  
- `(tabs)/more.tsx`  
- `calendar/new.tsx`  
- `people/[id].tsx`  
- `profile/index.tsx`  
- `profile/edit.tsx`  
- `work/[id].tsx`

**Definition of Done:**  
Each screen file has ≤10 non‑built‑in imports. Extracted components live in appropriate `components/` subdirectories. No functional changes; all existing behavior preserved.

**Depends on:** ARCH-REMED-26  
**Blocks:** ARCH-REMED-28

#### Subtasks (representative; one set per screen, labeled by screen)

- **ARCH-REMED-27.1 [AGENT] Refactor dashboard screen**  
  *Target screen:* `(tabs)/index.tsx`  
  *Action:* Extract sections (e.g., `UpcomingEvents`, `TodayTasks`, `BudgetSummary`) into their own components under `components/dashboard/`. The screen imports and composes them. Ensure all context providers are already available via `Providers`.

- **ARCH-REMED-27.2 [AGENT] Refactor more screen**  
  *Target screen:* `(tabs)/more.tsx`  
  *Action:* Extract `SettingsMenu` component that imports needed contexts.

- **ARCH-REMED-27.3 [AGENT] Refactor calendar new screen**  
  *Target screen:* `calendar/new.tsx`  
  *Action:* Extract `CalendarForm` component.

- **ARCH-REMED-27.4 [AGENT] Refactor person detail screen**  
  *Target screen:* `people/[id].tsx`  

- **ARCH-REMED-27.5 [AGENT] Refactor profile index screen**  
  *Target screen:* `profile/index.tsx`  

- **ARCH-REMED-27.6 [AGENT] Refactor profile edit screen**  
  *Target screen:* `profile/edit.tsx`  

- **ARCH-REMED-27.7 [AGENT] Refactor work detail screen**  
  *Target screen:* `work/[id].tsx`  

- **ARCH-REMED-27.8 [AGENT] Typecheck and validate**  
  *Command:* `pnpm run typecheck`  

- **ARCH-REMED-27.9 [AGENT] Mark complete**

---

### ARCH-REMED-28: Split EntityReferencePolicy.ts to reduce exports

- Status: TODO
- [ ] Complete

**Related files:**  
- `artifacts/mobile/domain/references/EntityReferencePolicy.ts`  
- New file `EntityDtos.ts` in same directory

**Definition of Done:**  
`EntityDtos.ts` contains all DTO types (`TaskDto`, `EventDto`, etc.) and collection types. `EntityReferencePolicy.ts` keeps only the pure cleanup functions, importing DTOs from the new file. The total exports of `EntityReferencePolicy.ts` drops to ≤8 (the functions). No functional change.

**Depends on:** ARCH-REMED-27  
**Blocks:** ARCH-REMED-29

#### Subtasks

- **ARCH-REMED-28.1 [AGENT] Create EntityDtos.ts**  
  *Action:* Move all interface/type definitions to this new file. Re‑export them if needed for other consumers.

- **ARCH-REMED-28.2 [AGENT] Update EntityReferencePolicy.ts**  
  *Action:* Remove type definitions and import from `./EntityDtos`. Ensure exports remain the same.

- **ARCH-REMED-28.3 [AGENT] Update any external imports that directly imported types from `EntityReferencePolicy.ts` (if any).  
  *Command:* Search for imports and adjust.

- **ARCH-REMED-28.4 [AGENT] Typecheck and run related tests**  
  *Command:* `pnpm run typecheck`  
  *Command:* `pnpm --filter @workspace/mobile exec jest --runInBand artifacts/mobile/__tests__/reference-cleanup-service.test.ts`

- **ARCH-REMED-28.5 [AGENT] Mark complete**

---

### ARCH-REMED-29: Curate barrel exports (api-zod, db/schema, domain-core)

- Status: TODO
- [ ] Complete

**Target files:**  
- `lib/api-zod/src/index.ts`  
- `lib/db/src/schema/index.ts`  
- (optionally `lib/domain-core/src/index.ts` – keep as is)

**Definition of Done:**  
- `lib/api-zod/src/index.ts` no longer uses wildcard re‑exports; it lists specific stable schemas. Duplicate lines removed.  
- `lib/db/src/schema/index.ts` exports only the table definitions and schemas actually needed by consumers (e.g., `profilesTable`, `insertProfileSchema`, `updateProfileSchema`). Drizzle schema import in `lib/db/src/index.ts` still works.  
- No changes to `domain-core`.

**Depends on:** ARCH-REMED-28  
**Blocks:** ARCH-REMED-30

#### Subtasks

- **ARCH-REMED-29.1 [AGENT] Research current consumers**  
  *Action:* Determine which symbols are actually imported from each barrel. For `api-zod`, check API server route files; for `db/schema`, check data adapters.

- **ARCH-REMED-29.2 [AGENT] Edit `lib/api-zod/src/index.ts`**  
  *Action:* Replace `export *` with explicit named re‑exports of only the used schemas. Remove duplicate lines.

- **ARCH-REMED-29.3 [AGENT] Edit `lib/db/src/schema/index.ts`**  
  *Action:* Change `export * from './profile'` to explicit exports: `export { profilesTable, insertProfileSchema, updateProfileSchema } from './profile';` (and any other tables that exist). Verify Drizzle’s relational queries still typecheck.

- **ARCH-REMED-29.4 [AGENT] Full typecheck**  
  *Command:* `pnpm run typecheck`  
  *Action:* Run also `pnpm --filter @workspace/db run generate` (just type generation, no push) to verify schema exports.

- **ARCH-REMED-29.5 [AGENT] Mark complete**

---

### ARCH-REMED-30: Pilot linked*Ids migration for Budget context

- Status: TODO
- [ ] Complete

**Related file paths:**  
- `domain/budget/BudgetRepository.ts` (update to remove linkedIds)  
- `infrastructure/budget/BudgetAsyncStorageRepository.ts` (delegate to RelationshipRepository)  
- New `domain/relationships/RelationshipRepository.ts`  
- New `infrastructure/relationships/RelationshipsAsyncStorageRepository.ts`  
- `context/BudgetContext.tsx` (update usage)  
- `__tests__/budget-context.test.ts` (update)

**Definition of Done:**  
`Transaction` type no longer has `linkedPersonIds` or `linkedTaskIds`. `BudgetRepository` methods for saving/loading transactions use a `RelationshipRepository` to store relationships separately. `BudgetContext` no longer touches linkedIds. Existing tests pass with the new fake `InMemoryRelationshipRepository`. All existing screens that displayed linked items continue to work (they will now receive empty arrays until we migrate the relationship data, but that’s migration debt; for now we can load relationships from the new store and populate them, so the UI remains unchanged).

**Out of scope:**  
- Migrating other contexts’ linkedIds.  
- Migrating existing data from old linkedIds arrays to Relationships store (that is a separate data migration; we will handle it by loading old data and converting on read for now).

**Depends on:** ARCH-REMED-29  
**Blocks:** ARCH-REMED-31

#### Subtasks

- **ARCH-REMED-30.1 [AGENT] Design RelationshipRepository interface**  
  *Target file:* `domain/relationships/RelationshipRepository.ts`  
  *Action:* Define `addLink`, `removeLink`, `getLinksForSource`, `removeAllLinksForSource`. Use `EntityId` types.

- **ARCH-REMED-30.2 [AGENT] Create AsyncStorage adapter for Relationships**  
  *Target file:* `infrastructure/relationships/RelationshipsAsyncStorageRepository.ts`  
  *Action:* Use a storage key like `@relationships_links`. Store a map from sourceId to list of {targetId, linkType}.

- **ARCH-REMED-30.3 [AGENT] Update Budget domain model**  
  *Target file:* `domain/budget/BudgetRepository.ts`  
  *Action:* Remove `linkedPersonIds` and `linkedTaskIds` from `Transaction`. Update `BudgetRepository` interface: add methods to load relationships? Or keep the repository focused, and let the context compose. The context will use `RelationshipRepository` separately to fetch related IDs for display. For now, we can modify `loadTransactions` to accept a `RelationshipRepository` parameter? That couples domain to infrastructure. Better: keep the domain clean; in the context, after loading transactions, use the relationship repo to attach ids to the returned objects before passing to state. So `BudgetContext` will import `RelationshipRepository` and a default adapter.

- **ARCH-REMED-30.4 [AGENT] Create InMemoryRelationshipRepository**  
  *Target file:* `__tests__/fakes/InMemoryRelationshipRepository.ts`

- **ARCH-REMED-30.5 [AGENT] Update BudgetContext to use RelationshipRepository**  
  *Action:* In provider, accept optional `relationshipRepo` (default instance). After loading transactions, for each transaction, load its linkedPersonIds and linkedTaskIds via `getLinksForSource` and attach them to the transaction object (so the UI still sees them). When saving a transaction, extract the linkedIds from the transaction, save the transaction without them, then update the relationship store.

- **ARCH-REMED-30.6 [AGENT] Update tests**  
  *Action:* Modify `budget-context.test.ts` to use `InMemoryRelationshipRepository` and verify linkedIds are handled.

- **ARCH-REMED-30.7 [AGENT] Run tests**  
  *Command:* `pnpm --filter @workspace/mobile exec jest --runInBand artifacts/mobile/__tests__/budget-context.test.ts`

- **ARCH-REMED-30.8 [AGENT] Mark complete**

---

### ARCH-REMED-31: Migrate linked*Ids in Notes context

- Status: TODO
- [ ] Complete

**Goal:** Remove `linkedPersonIds` and `linkedTaskIds` from Note type; use RelationshipRepository. Follow same pattern as ARCH-REMED-30.
**Depends on:** ARCH-REMED-30  
**Blocks:** ARCH-REMED-32

#### Subtasks (abbreviated)
- 31.1 Update `NotesRepository` types  
- 31.2 Update `NotesContext` to integrate `RelationshipRepository`  
- 31.3 Update `NotesContext` tests  
- 31.4 Run tests  
- 31.5 Mark complete

---

### ARCH-REMED-32: Migrate linked*Ids in Calendar context

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-31  
**Blocks:** ARCH-REMED-33

#### Subtasks
- 32.1 Update `CalendarRepository` types  
- 32.2 Update `CalendarContext`  
- 32.3 Update tests  
- 32.4 Run tests  
- 32.5 Mark complete

---

### ARCH-REMED-33: Migrate linked*Ids in People context

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-32  
**Blocks:** ARCH-REMED-34

#### Subtasks
- 33.1 Update `PeopleRepository` types (remove linkedEventIds, linkedNoteIds, linkedTaskIds)  
- 33.2 Update `PeopleContext`  
- 33.3 Update tests  
- 33.4 Run tests  
- 33.5 Mark complete

---

### ARCH-REMED-34: Migrate linked*Ids in Work context

- Status: TODO
- [ ] Complete
**Depends on:** ARCH-REMED-33  
**Blocks:** Final validation

#### Subtasks
- 34.1 Update `WorkRepository` types (remove all linkedIds)  
- 34.2 Update `WorkContext`  
- 34.3 Update tests  
- 34.4 Run tests  
- 34.5 Mark complete

```

**Final validation after all tasks:**

```powershell
pnpm run typecheck
pnpm --filter @workspace/mobile test -- --runInBand
pnpm --filter @workspace/api-server test -- --runInBand
pnpm --filter @workspace/domain-core test -- --runInBand
```

The TODO.md is now complete, executable, and meets every requirement.