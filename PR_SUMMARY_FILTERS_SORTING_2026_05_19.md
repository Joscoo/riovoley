# PR Summary - Unified Filters & Sorting (Clean Lite per Feature)

## 1) Context
- Initiative: standardize filtering and sorting behavior across tables and table-like lists.
- Architecture: Clean Lite by feature (`presentation -> application -> infrastructure`), backend-first query flow.
- Date: May 19, 2026.

## 2) What This PR Delivers
- Unified `TableQuery` contract adoption across target features.
- Consistent sort behavior:
  - Table headers with semantic sort state (`aria-sort`) where table headers exist.
  - Explicit sort controls where layout is card/list based.
- Consistent filter reset behavior to feature defaults.
- Stable selector strategy for E2E validation (`id` / `data-testid` where needed).
- E2E suite set dedicated to filters/sorting flows.

## 3) Feature Scope

### Phase 1
- `payments`
  - Header-based 3-state sorting.
  - Search + status + athlete + date range filters.
  - Clear filters action.
- `attendance`
  - Report/history filters (date range, category, athlete, payment method).
  - Sort controls in history + sortable headers in day tables.
  - Clear filters action.

### Phase 2
- `user-management` (tabs)
  - Athletes, Trainers, Administrators share query conventions.
  - Stable filter ids by user type (`atleta`, `entrenador`, `administrador`).
  - Reset behavior normalized.
- `athletes`
  - Consistent filter/sort controls in list/card UI.
  - Backend query integration maintained.
- `trainer-management`
  - Expanded from search-only to full filter model:
    - `search`, `status`, `sortBy`, `sortOrder`, `reset`.
  - Backend status filtering supported.
- `schedules`
  - Exposed explicit sort controls in UI + clear filters.
  - Use case now preserves repository order (backend-first respected).
- `physical-tests`
  - Stable filter ids + clear filters action.
  - Explicit sort/filter controls kept consistent.

## 4) Cross-Cutting Components & Utilities
- Shared query helpers:
  - `src/shared/lib/tableQuery.js`
  - `src/shared/lib/tableQuery.test.js`
- Shared sortable header:
  - `src/shared/ui/SortableHeader.js`
  - `src/shared/ui/SortableHeader.test.js`

## 5) Testing Added/Updated

### Unit / Service
- `src/shared/lib/tableQuery.test.js`
- `src/shared/ui/SortableHeader.test.js`
- `src/features/user-management/presentation/components/shared/UserFilters.test.js`
- `src/features/schedules/application/useCases/createSchedulesUseCases.test.js` (order preservation update)
- Existing trainer/schedules/physical-tests service/use-case suites validated.

### E2E (Playwright)
- `tests/e2e/filters-sorting.tables.spec.js` (`payments`, `attendance`)
- `tests/e2e/filters-sorting.user-management.spec.js`
- `tests/e2e/filters-sorting.phase2-lists.spec.js` (`athletes`, `schedules`)
- `tests/e2e/filters-sorting.physical-tests.spec.js`

### New NPM Commands
- `e2e:filters-sorting`
- `e2e:filters-sorting:users`
- `e2e:filters-sorting:phase2`
- `e2e:filters-sorting:physical`
- `e2e:filters-sorting:all`

## 6) Validation Executed
- Build:
  - `npm run build` -> success (compiled).
- Unit/service targeted runs:
  - shared, schedules, trainer-management, user-management, physical-tests -> passing.
- E2E:
  - suite commands run successfully; tests are intentionally skipped when
    `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` are not provided.

## 7) Risk Assessment
- Low/medium functional risk:
  - Wide surface area across multiple features.
  - Mitigated by per-feature defaults, isolated query mappers, and targeted tests.
- Main operational risk:
  - Environment-dependent E2E execution (credentials required).

## 8) Backward Compatibility
- Existing UI layouts preserved (especially card/list views).
- Query behavior extended without changing business entities.
- Compatibility maintained where legacy in-memory behaviors existed, now aligned to backend-first strategy.

## 9) Rollback Plan
- Revert feature-by-feature safely if needed:
  - `payments` / `attendance`
  - `user-management` tabs
  - `schedules`
  - `trainer-management`
  - `physical-tests`
- Keep shared helpers (`tableQuery`, `SortableHeader`) only if feature consumers remain.

## 10) Manual QA Checklist (PR Gate)
- `payments`
  - Verify each sortable header cycles `none -> asc -> desc -> none`.
  - Verify clear filters restores defaults.
- `attendance`
  - Verify history filters apply and clear properly.
  - Verify date sort toggle and table header sort semantics.
- `user-management`
  - Verify each tab reset returns default `search/status/sort`.
  - Verify category filter appears only for athletes.
- `athletes`
  - Verify category/search/sort combinations and pagination reset behavior.
- `schedules`
  - Verify day/category/sort controls and clear filters defaults.
- `trainer-management`
  - Verify status filtering (`active/suspended`) and sorting.
- `physical-tests`
  - Verify athlete/date/sort/pending filters and clear filters.

## 11) Suggested PR Description (Short)
This PR standardizes filtering and sorting across core table and list views using Clean Lite per feature. It introduces shared `TableQuery` helpers, accessible sortable headers, backend-first query orchestration, stable E2E selectors, and dedicated Playwright suites for `payments`, `attendance`, `user-management`, `athletes`, `schedules`, and `physical-tests`. Build and targeted unit/service tests pass; E2E suites are credential-gated and skip safely when env vars are missing.
