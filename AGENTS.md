# RioVoley AI Agent Instructions

## What this repo is
- Single-page React app built with Create React App (`react-scripts`), Tailwind CSS, Capacitor Android integration, and Supabase as the backend platform.
- Mobile support is via Capacitor web build + native Android wrapper in `android/`.
- Main business logic is implemented in `src/features/` using a Clean Lite feature-based structure.
- Data and migration artifacts live in `database/`; serverless backend logic lives in `functions/` and `supabase/functions/`.
- End-to-end tests are in `tests/` and run with Playwright.

## High-value starting points
- `package.json` for build/runtime scripts and dependency conventions.
- `README.md` for project architecture, setup, scripts, and mobile/E2E notes.
- `src/features/` for feature modules and application structure.
- `src/shared/` for shared UI, config, helpers, and gateways.
- `database/` for SQL migration scripts and schema-related work.
- `functions/` and `supabase/functions/` for backend/edge-function logic.
- `tests/` and `playwright.config.js` for E2E coverage and smoke flows.

## Important commands
- `npm install` — install dependencies.
- `npm start` — launch local development server.
- `npm run build` — production web build.
- `npm run test` — run CRA-based unit/tests.
- `npm run e2e:install` — install Playwright browsers.
- `npm run e2e` — execute E2E tests.
- `npm run mobile:sync` — build web assets and sync Capacitor Android.
- `npm run mobile:android` — sync and open Android Studio.
- `npm run ota:upload:production` / `npm run ota:upload:beta` — upload web bundle OTA via Capgo.

## Key repository conventions
- `src/features/<feature>/` typically contains `presentation/`, `application/`, `domain/`, and `infrastructure/` layers.
- Use `src/shared/` for UI primitives, shared helpers, config, and cross-cutting gateways.
- The app is not Next.js or Remix; it is CRA-based and expects `public/` plus `build/` artifacts.
- Avoid editing generated or installed output in `build/`, `android/build/`, or `node_modules/`.

## Supabase / database guidance
- Supabase is the primary backend; expect PostgreSQL, Auth, RLS, and edge-function integrations.
- When changing database behavior, check `database/` SQL scripts and `supabase/` config/functions first.
- Sensitive data handling and encryption are already present in the project; preserve existing PII protection patterns.

## Testing and quality
- Use `npm run test` for React test execution.
- Use Playwright via `npm run e2e` and the specialized `e2e:smoke:*` scripts for role-based smoke checks.
- For E2E flows, inspect `.env.e2e.example` and environment variable setup described in `README.md`.

## Behavior for AI agents
- Prefer existing documentation links instead of copying large docs. Link to `README.md`, `database/`, `supabase/`, and relevant feature READMEs.
- When asked to implement features, determine if the change is frontend-only (`src/features/`, `src/shared/`), backend/edge-function (`functions/`, `supabase/functions/`), or database-related (`database/`).
- Keep changes aligned with the current React + Supabase + Capacitor architecture; do not migrate to a different framework unless explicitly requested.
- Preserve Spanish/English documentation context where relevant, but focus on code-first instructions.

## Useful files and directories
- `package.json` — scripts, dependencies, and Capacitor/OTA flows.
- `README.md` — project overview, setup, architecture, mobile and E2E notes.
- `src/features/` — feature modules with Clean Lite structure.
- `src/shared/` — shared UI and infrastructure.
- `database/` — SQL scripts and routines for schema/migrations.
- `functions/` — Node/Deno backend workflows.
- `supabase/functions/` — Supabase edge function implementations.
- `tests/`, `playwright.config.js` — end-to-end test definitions.
- `android/` — native Android Capacitor wrapper and project settings.

## If you need more context
- Prefer `README.md` as the primary source of repository-level conventions.
- Use feature README files under `src/features/` for module-specific patterns.
- Avoid inventing new architecture patterns; follow the existing feature-based and shared-layer conventions.
