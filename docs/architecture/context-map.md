# Life Hub Nexus Bounded Context Map

Version: 1.0 (baseline after T-011)
Date: 2026-07-19

## 1. Purpose

This document defines the initial bounded contexts for Life Hub Nexus, their owned data, allowed dependencies, integration contracts, and deletion/data-retention responsibilities. It is an architecture decision record (ADR) that reflects the current repository state and the intended migration path. It is intentionally forward-looking: it describes contexts that do not yet have dedicated directories so that future features expand inside stable boundaries.

## 2. Modelling principles

- **Ownership by business capability**, not screen layout or database table.
- **Duplicate representations are permitted** when the same word means something different in two contexts (e.g. `Profile` in Identity vs. Social vs. People).
- **Cross-context interaction** occurs through narrow published-language contracts, not by importing another context's UI state or internal entity.
- **Local-first device storage** is the authoritative device store; remote APIs are sync adapters.
- **Modular monolith:** one deployable API and one mobile app; no microservices until a context boundary is proven to need independent deployment.

## 3. Bounded context definitions

### 3.1 Identity

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Authenticated actor identity: credential verification, session lifecycle, user ID generation, token issuance/validation. |
| **Owned data** | User account identifier, verified email, authentication method, session/token metadata, password/credential handles delegated to identity provider. |
| **Public contract** | `AuthenticatedActor` (`actorId`, `email`, `verifiedAt`) consumed by application use cases. No route should read `X-User-Id` or other client identity headers. |
| **Inbound dependencies** | None. Identity is foundational. |
| **Outbound dependencies** | Profile (notifies on account creation/deletion so Profile can create/remove the owner-scoped record). |
| **Deletion policy** | Account deletion triggers Profile deletion; other user-created data may be retained only where the data context explicitly owns its own retention rules. |
| **Sync/local status** | Sync-required; identity state lives on the identity provider/server. The device holds only a refresh/access token handle. |
| **Current state** | No dedicated implementation yet; T-015 will create the authentication middleware and `AuthVerifier` boundary. `bearerAuth` exists in `lib/api-spec/openapi.yaml` as a contract placeholder. |

### 3.2 Profile

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Owner-scoped personal data: display name, username, avatar, pronouns, bio, contact details, privacy controls, onboarding flag. |
| **Owned data** | `Profile` (mobile domain), `profilesTable` (server Drizzle). All fields are versioned per actor. |
| **Public contract** | `Profile` type, `ProfilePrivacy`, `ProfileLoadResult`, `ProfileSaveResult`; repository interface `ProfileRepository` (`load`, `save`, `sync`). Server side: `ProfileRepository` port with `getByActor`, `updateByActor`, `deleteByActor`. |
| **Inbound dependencies** | Identity (actor ID), Sync (server timestamps), Local Device Cache (storage adapter). |
| **Outbound dependencies** | None for core profile. Privacy settings may be read by Social when rendering public-facing profile. |
| **Deletion policy** | **No retention** on deletion. Server row and local cache removed. This is explicitly declared in `lib/db/src/schema/profile.ts` usage and `lib/api-spec/openapi.yaml`. |
| **Sync/local status** | Syncable. Mobile `ProfileRepository.sync()` pushes local state to server and applies last-write-wins (server `updatedAt`). |
| **Current state** | Mobile `AsyncStorageProfileRepository` implemented in `artifacts/mobile/domain/profile/ProfileRepository.ts`. `lib/db/src/schema/profile.ts` defined. API route is mock-only pending T-017/T-018. |

### 3.3 Planning (Work)

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Task and project planning: tasks, subtasks, status, priority, due dates, recurrence? (TBD), completion tracking. |
| **Owned data** | `Task` entity: `id`, `title`, `description`, `status`, `priority`, `dueDate`, `parentId`, `subtaskIds`, `tags`, `linkedEventIds`, `linkedNoteIds`, `linkedPersonIds`, `linkedTransactionIds`, `createdAt`, `completedAt`. |
| **Public contract** | `Task`, `TaskStatus`, `TaskPriority`; context API `addTask`, `updateTask`, `deleteTask`, `toggleComplete`, `getTask`, `getRootTasks`, `getSubtasks`, `linkItem`, `unlinkItem`. |
| **Inbound dependencies** | Relationships (for `linked*Ids` cleanup on delete), Calendar, Knowledge, People, Finance (link references). |
| **Outbound dependencies** | Relationships only. Planning does not depend on UI state of other features. |
| **Deletion policy** | Deleting a task removes the task and its subtasks (`parentId === id`) and removes its ID from all inbound `linkedTaskIds` arrays. Structural ownership over subtasks. |
| **Sync/local status** | Local-only today; future syncable. Stored at `@lifeos/tasks`. |
| **Current state** | `artifacts/mobile/context/WorkContext.tsx`. Direct `AsyncStorage` access and ad-hoc ID generation. |

### 3.4 Calendar

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Calendar events, recurrence rules, reminders, event-to-person and event-to-task links. |
| **Owned data** | `CalendarEvent`: `id`, `title`, `description`, `startDate`, `endDate`, `allDay`, `color`, `recurrence`, `linkedTaskIds`, `linkedPersonIds`, `createdAt`. |
| **Public contract** | `CalendarEvent`, `Recurrence`; `addEvent`, `updateEvent`, `deleteEvent`, `getEvent`, `getEventsForDate`, `getUpcomingEvents`. |
| **Inbound dependencies** | Relationships/Planning/People (link references). |
| **Outbound dependencies** | Relationships only. |
| **Deletion policy** | Deleting an event removes the event and its ID from `linkedEventIds` arrays in Planning and People. |
| **Sync/local status** | Local-only today; future syncable. Stored at `@lifeos/events`. |
| **Current state** | `artifacts/mobile/context/CalendarContext.tsx`. Direct `AsyncStorage` access and recurrence expansion on read. |

### 3.5 Knowledge (Notes)

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Notes, folders, tags, search, note-to-task and note-to-person links. |
| **Owned data** | `Note`: `id`, `title`, `content`, `folderId`, `tags`, `linkedTaskIds`, `linkedPersonIds`, `isPinned`, `createdAt`, `updatedAt`. `Folder`: `id`, `name`, `color`. |
| **Public contract** | `Note`, `Folder`; `addNote`, `updateNote`, `deleteNote`, `getNote`, `addFolder`, `getNotesForFolder`, `searchNotes`. |
| **Inbound dependencies** | Relationships/Planning/People (link references). |
| **Outbound dependencies** | Relationships only. |
| **Deletion policy** | Deleting a note removes the note and its ID from `linkedNoteIds` arrays in Planning and People. |
| **Sync/local status** | Local-only today; future syncable. Stored at `@lifeos/notes` (with folders under same key). |
| **Current state** | `artifacts/mobile/context/NotesContext.tsx`. Direct `AsyncStorage` access and in-memory folder seed. |

### 3.6 People

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Contacts, interactions, birthdays, relationship cadence (`stayInTouchDays`), person-to-task/event/note links. |
| **Owned data** | `Person`: `id`, `name`, `email`, `phone`, `birthday`, `company`, `role`, `notes`, `avatarColor`, `interactions`, `linkedTaskIds`, `linkedEventIds`, `linkedNoteIds`, `stayInTouchDays`, `lastInteractionDate`, `createdAt`. `Interaction`: `id`, `type`, `description`, `date`. |
| **Public contract** | `Person`, `Interaction`, `InteractionType`; `addPerson`, `updatePerson`, `deletePerson`, `getPerson`, `addInteraction`, `getTodayBirthdays`, `getOverdueTouchups`. |
| **Inbound dependencies** | Relationships/Planning/Calendar/Knowledge/Finance (link references). |
| **Outbound dependencies** | Relationships only. |
| **Deletion policy** | Deleting a person removes the person and its ID from `linkedPersonIds` arrays in Planning, Calendar, Knowledge, Finance. Interactions are owned by the person aggregate and removed with it. |
| **Sync/local status** | Local-only today; future syncable. Stored at `@lifeos/people`. |
| **Current state** | `artifacts/mobile/context/PeopleContext.tsx`. Direct `AsyncStorage` access. |

### 3.7 Finance (Budget)

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Transactions, budgets by category, spending analytics, transaction-to-task and transaction-to-person links. |
| **Owned data** | `Transaction`: `id`, `title`, `amount`, `type`, `category`, `date`, `notes`, `recurring`, `linkedTaskIds`, `linkedPersonIds`, `createdAt`. `Budget`: `id`, `category`, `monthlyLimit`, `createdAt`. Category lists and colours are presentation helpers, not domain. |
| **Public contract** | `Transaction`, `TransactionType`, `Budget`; transaction and budget CRUD plus analytics queries (`getMonthTransactions`, `getMonthlyIncome`, `getMonthlyExpenses`, `getMonthlyBalance`, `getTransactionsByCategory`, `getRecentTransactions`, `getBudgetsWithProgress`, `getSpendingTrend`). |
| **Inbound dependencies** | Relationships/Planning/People (link references). |
| **Outbound dependencies** | Relationships only. |
| **Deletion policy** | Deleting a transaction removes it and its ID from `linkedTransactionIds` arrays in Planning. Budgets are independent aggregates; deleting a budget does not delete transactions. |
| **Sync/local status** | Local-only today; future syncable. Transactions at `@lifeos/budget`, budget limits at `@lifeos/budget_limits`. |
| **Current state** | `artifacts/mobile/context/BudgetContext.tsx`. Direct `AsyncStorage` access; two storage keys for transactions and budgets. |

### 3.8 Relationships

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Explicit, feature-neutral links between entities: source, target, relation type, owner, lifecycle. Will eventually replace all `linked*Ids` arrays. |
| **Owned data** | `Relationship` record: `id`, `sourceType`, `sourceId`, `targetType`, `targetId`, `relationType`, `ownerId`, `createdAt`, `deletedAt`? (TBD). |
| **Public contract** | Proposed `RelationshipRepository` (`create`, `remove`, `listByEntity`, `removeForEntity`) and `RelationshipPolicy` (`canLink`, `onSourceDeleted`, `onTargetDeleted`). |
| **Inbound dependencies** | All feature contexts that need to create, read, or delete links. |
| **Outbound dependencies** | Identity (owner), Sync. Does not depend on feature UI state. |
| **Deletion policy** | A relationship is an association, not a structural owner. Deleting a relationship does not delete either endpoint. Deleting an endpoint removes all relationships where it is source or target; this is **eventual consistency** and may be queued. |
| **Sync/local status** | No storage yet; transition planned in T-014 and beyond. |
| **Current state** | `artifacts/mobile/domain/references/` contains an ad-hoc cleanup policy and service. It currently imports feature entity types from React context files (`WorkContext`, `CalendarContext`, etc.) and uses `linked*Ids` arrays. T-014 will isolate this behind feature-neutral DTOs and an AsyncStorage adapter. |

### 3.9 Social

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Public/social interactions: posts, followers, public feed, suggested users. Distinct from `People` (private CRM) and `Profile` (owner-scoped identity data). |
| **Owned data** | `SocialPost`: `id`, `authorId`, `authorName`, `authorColor`, `content`, `likesCount`, `commentsCount`, `liked`, `createdAt`. `SocialUser`: `id`, `name`, `username`, `bio`, `avatarColor`, `followersCount`, `followingCount`, `isFollowing`. `UserProfile` (social-facing). |
| **Public contract** | `SocialPost`, `SocialUser`, `UserProfile`; `addPost`, `toggleLike`, `followUser`, `updateProfile` (social profile only), `getMyPosts`. |
| **Inbound dependencies** | Identity (for author ID), Profile (for displayable public fields and privacy). |
| **Outbound dependencies** | None for data mutation; may read Profile public fields. |
| **Deletion policy** | Deleting a social post removes the post. Unfollowing updates counters. Social profile changes are local-only until sync. |
| **Sync/local status** | Local-only today with seed data; future server-backed. Stored at `@lifeos/social`. |
| **Current state** | `artifacts/mobile/context/SocialContext.tsx`. Direct `AsyncStorage` access. |

### 3.10 Sync

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Orchestrate local-to-server and server-to-local data flow, conflict resolution, queueing of offline mutations, sync cursor/version per context. |
| **Owned data** | Sync metadata: last sync timestamp per context, pending mutation queue, conflict resolution log. |
| **Public contract** | `SyncResult`, `SyncConflict`, sync orchestrator per context. Each context exposes a repository interface; Sync coordinates calls but does not own feature data. |
| **Inbound dependencies** | All syncable contexts (Profile first, then Planning, Calendar, etc.). |
| **Outbound dependencies** | Identity (token), API client (`@workspace/api-client-react`). |
| **Deletion policy** | When server deletes a profile, local cache is cleared. When local deletes, sync pushes tombstone/DELETE. |
| **Sync/local status** | Core concern. Partially implemented in `ProfileRepository.sync()`. |
| **Current state** | No standalone module; sync logic is currently embedded in `ProfileRepository.ts`. |

### 3.11 Search

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Cross-context, user-initiated read-only queries: full-text search across notes, tasks, people, events, transactions. |
| **Owned data** | Search index (generated, derived from other contexts). |
| **Public contract** | `SearchQuery`, `SearchResult`; query returns ranked, typed results without mutating source data. |
| **Inbound dependencies** | Read-only access to all searchable contexts. |
| **Outbound dependencies** | None. |
| **Deletion policy** | Index is rebuilt from source; no independent deletion semantics. |
| **Sync/local status** | Local-only index; server search may be added later. |
| **Current state** | Not implemented. `NotesContext.searchNotes` is a single-context preview, not the cross-context Search context. |

### 3.12 Notifications

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Push, in-app, and scheduled reminders (birthdays, overdue tasks, spending alerts, relationship touch-ups). |
| **Owned data** | Notification records, schedules, preferences, delivery status. |
| **Public contract** | `Notification`, `NotificationPreference`; scheduling APIs. |
| **Inbound dependencies** | Calendar (events), People (birthdays/touch-ups), Planning (due dates), Finance (budget thresholds). |
| **Outbound dependencies** | None for core scheduling; may call platform notification services. |
| **Deletion policy** | Dismissed notifications are retained according to user preference; scheduled notifications are cancelled when source deleted. |
| **Sync/local status** | Local-only; server may mirror preferences. |
| **Current state** | Not implemented. |

### 3.13 Local Device Cache (infrastructure bounded context)

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Device-side persistence adapters: AsyncStorage today, SQLite in the future. Owns keys, parsing, migrations, and recoverable errors. |
| **Owned data** | Stored bytes and versioned DTOs. Does not own business invariants. |
| **Public contract** | Repository interfaces per feature (`ProfileRepository`, future `TaskRepository`, etc.). Present contexts currently call `AsyncStorage` directly, which violates the ideal boundary but is documented as migration debt. |
| **Inbound dependencies** | All mobile contexts that persist state. |
| **Outbound dependencies** | None (platform adapters only). |
| **Deletion policy** | Deletes only what a feature asks to delete; never independently purges. |
| **Sync/local status** | Local-only. |
| **Current state** | Only `ProfileRepository` implements a repository boundary over AsyncStorage. Other contexts access `AsyncStorage` directly. |

### 3.14 API Transport (infrastructure bounded context)

| Aspect | Description |
|--------|-------------|
| **Responsibility** | HTTP adaptation: Express routes, middleware, request/response mapping. Routes translate HTTP to application use cases. |
| **Owned data** | None. |
| **Public contract** | OpenAPI spec in `lib/api-spec/openapi.yaml`; generated clients in `lib/api-client-react/src/generated/` and Zod schemas in `lib/api-zod/src/generated/`. |
| **Inbound dependencies** | Application use cases and middleware. |
| **Outbound dependencies** | None. |
| **Deletion policy** | N/A. |
| **Sync/local status** | Server-side only. |
| **Current state** | `artifacts/api-server/src/app.ts` with `health` and mock `profile` routes. Authentication middleware pending T-015. |

## 4. Module dependency rules

The following layering rules apply to the mobile app and the API server. They are the enforcement target for T-020 architecture fitness functions.

### 4.1 Mobile layering

```text
Presentation (screens, components)
         │
         ▼
Application (React contexts, hooks)
         │
         ▼
Domain (pure business rules, repository interfaces, result types)
         │
         ▼
Infrastructure adapters (AsyncStorage, API client, generated DTO mappers)
```

- **Presentation** depends on **Application** and domain-safe types. It never imports an infrastructure adapter or another feature's context.
- **Application** depends on **Domain** and repository interfaces. It may combine multiple domain/repository outputs but does not contain business rules.
- **Domain** is runtime-neutral. It never imports React, Expo, AsyncStorage, Express, or platform APIs. It may define repository interfaces and result types.
- **Infrastructure adapters** implement domain repository interfaces and hide storage/network details. They may import generated API clients or `AsyncStorage`, but only inside the adapter.

### 4.2 API server layering

```text
HTTP Transport (Express routes, middleware)
         │
         ▼
Application (use cases, command handlers)
         │
         ▼
Domain (entities, value objects, domain services)
         │
         ▼
Data adapters (Drizzle repositories, external API clients)
```

- **Routes** receive `AuthenticatedActor` from middleware and pass it to use cases. They do not query the database or parse identity headers.
- **Use cases** receive `AuthenticatedActor`, never raw request headers. They orchestrate domain logic and repository calls.
- **Domain** is database-agnostic.
- **Drizzle/data adapters** implement repository interfaces and are the only files that import Drizzle schema or generated SQL.

### 4.3 Integration contract rules

- A feature's public contract is a small set of exported types and functions. Internal storage keys, DTOs, migrations, network details, and framework mechanics stay private.
- Generated code in `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/` is owned by `pnpm --filter @workspace/api-spec run codegen`. No manual edits.
- Cross-context links must eventually move to the Relationships context. Until then, `linked*Ids` arrays may be used only inside the owning context and must be cleaned up by the Relationships/References boundary on entity deletion.

## 5. Mobile composition root provider policy

The root provider order in `artifacts/mobile/app/_layout.tsx` is:

```
QueryClientProvider
GestureHandlerRootView
KeyboardProvider
AppProvider          (Profile / Identity hydration)
  WorkProvider       (Planning)
    CalendarProvider (Calendar)
      NotesProvider  (Knowledge)
        BudgetProvider (Finance)
          PeopleProvider (People)
            SocialProvider (Social)
```

- **Rationale:** All contexts load independently from AsyncStorage on mount. The nesting is primarily for React render tree convenience, not for runtime data dependencies. Profile is outermost because the root navigator depends on `profile.onboarded` to route new users to `/profile/setup`.
- **Future rule:** When a context needs another context's domain data, it must consume the repository/use-case interface, not import the sibling provider. Sibling context imports are currently present in some screens (e.g., `LinkedItems` uses `useWork`, `useCalendar`, etc.) because they compose cross-context read-only views; this is presentation-layer composition and is allowed.
- **Hydration gate:** `RootLayoutNav` waits for `hydrated === true` before using `profile.onboarded` in routing decisions. This prevents flashing the wrong screen before AsyncStorage has loaded.

## 6. Current cross-context dependencies and migration debt

The following exceptions to the ideal boundaries have been verified against the current code and are tracked as migration debt. They are not fixed in this task because T-011 is definition-only.

| Debt | Location | Violation | Resolution owner |
|------|----------|-----------|------------------|
| Domain imports application context types | `artifacts/mobile/domain/references/EntityReferencePolicy.ts` imports `Task`, `CalendarEvent`, `Note`, `Person`, `Transaction` from `context/*`; `ReferenceCleanupOrchestrator.ts` does the same | Domain must not import React contexts | T-014: refactor to feature-neutral DTOs; `ReferenceCleanupOrchestrator.ts` appears unused and may be removed or aligned |
| Adapter imports context types and AsyncStorage | `artifacts/mobile/domain/references/ReferenceCleanupService.ts` imports from `context/*` and `AsyncStorage` | Infrastructure adapter should depend only on domain DTOs and storage port | T-014: introduce AsyncStorage adapter and storage port |
| Application contexts access AsyncStorage directly | `context/WorkContext.tsx`, `CalendarContext.tsx`, `NotesContext.tsx`, `PeopleContext.tsx`, `BudgetContext.tsx`, `SocialContext.tsx` | Presentation/application layer should depend on repository interfaces, not storage adapter | T-014 (Relationships) then future per-feature repository tasks |
| Profile repository mixes domain and adapter | `artifacts/mobile/domain/profile/ProfileRepository.ts` contains the `Profile` domain model, repository interface, and `AsyncStorageProfileRepository` adapter in one file | Long-term: separate `Profile` domain, repository interface, and AsyncStorage adapter | T-019 or follow-up architecture task |
| Missing server application/data layers | `artifacts/api-server/src/routes/profile.ts` returns mock in-memory data | Routes should call use cases and repositories | T-017, T-018 |
| No dedicated Identity module | Authentication is defined only in OpenAPI `bearerAuth` | Identity context must own actor verification | T-015, T-016 |
| No dedicated Search/Notifications modules | Search and notifications are not implemented | Search/Notifications contexts to be created when work begins | Future tasks |

## 7. Deletion and data-retention summary

| Context | Deletion behavior | Retention |
|---------|-------------------|-----------|
| Identity | Account deletion cascades to Profile; credential handles removed at provider | Per provider policy |
| Profile | Permanent, no retention | None |
| Planning | Task delete removes subtasks and all `linkedTaskIds` references | None |
| Calendar | Event delete removes all `linkedEventIds` references | None |
| Knowledge | Note delete removes all `linkedNoteIds` references | None |
| People | Person delete removes interactions and all `linkedPersonIds` references | None |
| Finance | Transaction delete removes all `linkedTransactionIds` references; budget delete is independent | None |
| Relationships | Removing a relationship never deletes endpoints | N/A |
| Social | Post delete, unfollow updates counters; social profile is local-first until sync | Per sync policy |
| Sync | Tombstones propagate; conflict log may retain history per user preference | User preference |
| Notifications | Dismissed notifications retained per preference | User preference |
| Search | Rebuilt from source; no independent retention | N/A |

## 8. Versioning

This document is versioned with the task that produced it: **T-011**. When a context boundary changes (new context, changed ownership, new public contract), this file should be updated with a new version entry and the owning task ID.

## 9. References

- `replit.md` — run commands, stack, and architecture decisions
- `lib/api-spec/openapi.yaml` — public HTTP contract
- `artifacts/mobile/app/_layout.tsx` — composition root
- `artifacts/mobile/context/*` — current application contexts
- `artifacts/mobile/domain/references/` — current relationship cleanup implementation
- `lib/db/src/schema/profile.ts` — first server schema
