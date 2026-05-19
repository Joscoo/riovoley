# Filters & Sorting Rollout Checklist (2026-05-19)

## Scope Summary
- Goal: unify filtering and sorting behavior across table and table-like list views using Clean Lite per feature.
- Strategy: backend-first query orchestration with controlled hybrid sorting for derived fields.
- Status: implemented progressively by feature, with automated validation in unit + E2E suites.

## Feature Checklist

### Phase 1
- [x] `payments`: `TableQuery` flow + sortable headers + filter reset + backend-first sorting/filtering.
- [x] `attendance`: report/history filters + sortable headers in day tables + filter reset + backend-first query orchestration.

### Phase 2
- [x] `user-management`: tab-level query contract (`athletes/trainers/administrators`) + normalized filters + reset.
- [x] `athletes`: backend query integration for category + consistent sort/filter controls in list UI.
- [x] `trainer-management`: expanded filters (`search/status/sortBy/sortOrder`) + reset + backend status filtering.
- [x] `schedules`: filter/sort controls exposed in UI + reset + backend-first ordering respected end-to-end.
- [x] `physical-tests`: explicit sort/filter controls + reset + stable selectors for E2E validation.

## Accessibility/UX Checklist
- [x] Sortable table headers expose semantic state via `aria-sort`.
- [x] Sort interaction follows three-state cycle (`none -> asc -> desc -> none`) where applicable.
- [x] Filter reset returns module defaults consistently.
- [x] E2E selectors stabilized with IDs/data-testid where needed.

## Test Coverage Checklist
- [x] Unit: shared `tableQuery` helpers.
- [x] Unit: `SortableHeader` behavior (`aria-sort` + event dispatch).
- [x] Unit: `UserFilters` selector stability and reset path.
- [x] Unit/service: schedules/trainer/user-management suites updated and passing.
- [x] E2E: `payments + attendance` (`filters-sorting.tables.spec.js`).
- [x] E2E: `user-management tabs` (`filters-sorting.user-management.spec.js`).
- [x] E2E: `athletes + schedules` (`filters-sorting.phase2-lists.spec.js`).
- [x] E2E: `physical-tests` (`filters-sorting.physical-tests.spec.js`).

## Run Commands
- Unit focused:
  - `npm test -- src/shared/lib/tableQuery.test.js`
  - `npm test -- src/shared/ui/SortableHeader.test.js`
  - `npm test -- src/features/user-management/presentation/components/shared/UserFilters.test.js`
- E2E focused:
  - `npm run e2e:filters-sorting`
  - `npm run e2e:filters-sorting:users`
  - `npm run e2e:filters-sorting:phase2`
  - `npm run e2e:filters-sorting:physical`
  - `npm run e2e:filters-sorting:all`

## Notes for Review
- E2E specs are guarded by `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`. Without these vars, tests are skipped by design.
- Existing card-based layouts were preserved while reusing unified query/filter/sort contracts.
