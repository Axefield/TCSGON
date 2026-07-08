# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **CI/CD pipeline**: GitHub Actions workflow (`.github/workflows/ci.yml`) with 4 parallel
  jobs — Client (lint, typecheck, test, build, budget check), Server (test with PostgreSQL
  service), E2E (Playwright), A11Y (axe-core audit).
- **Server Dockerfile**: multi-stage production build for the Express server.
- **Docker Compose**: full-stack local deployment (PostgreSQL 17 + server).
- **Runbook**: `docs/runbook.md` — daily operations for dev, test, build, deploy, DB.
- **Onboarding guide**: `docs/onboarding.md` — 30-minute setup guide covering clone,
  deps, AI agents, project structure, and first PR workflow.
- **Component library docs**: `src/shared/components/__README__.md` — usage guide for all
  17+ design system components with API tables and accessibility notes.
- **ADRs**: `docs/adr/0002-state-management.md` (Redux + React Query split),
  `0003-typescript-strict.md` (strict mode decisions),
  `0004-routing-strategy.md` (lazy routes + auth guards).
- **Login race condition fix**: cancel in-flight anonymous session query before login
  mutations (`queryClient.cancelQueries`) to prevent stale 401 from reverting Redux;
  refetch session with new token on success (`invalidateQueries`).

- **Edge case registry**: `docs/edge-cases/registry.json` with 69 structured entries across
  auth, dashboard, projects, and shared features (Zod-validated schema v1.0).
- **Edge case validation script**: `scripts/validate-edge-cases.ts` — validates registry
  against Zod schema, checks test file existence, reports coverage gaps. Run via
  `pnpm validate:edge-cases`.
- **Bundle budget checker**: `scripts/check-budgets.ts` — verifies every JS/CSS asset
  stays within AGENTS.md budgets (JS: 200 kB warn / 350 kB error gzip; CSS: 30 kB warn /
  60 kB error gzip). Run via `pnpm check:budgets`.
- **Edge case documentation**: `docs/edge-cases/README.md` explaining schema, categories,
  severity, and how to add entries.
- **14 axe-core a11y test files** (`.axe.test.tsx`) for shared components (Spinner,
  Skeleton, Toast, ToastRegion, SkipLink, Sidebar, TopBar, AppShell, AuthLayout) and
  feature pages (LoginForm, SignupForm, DashboardPage, SettingsPage, ProjectListPage).
- **36+ API hook tests** — `authApi.test.tsx` (19 tests) and `userApi.test.tsx` (17 tests)
  covering success, error (401/409/422/500), network-failure, and loading states for all
  auth mutations and queries.
- **Page integration + error boundary tests**: DashboardPage (6 tests), SettingsPage
  (16 tests), ProjectListPage (8 tests), ProjectCreatePage (4 tests) — covering critical
  paths, error displays, retry, and `RootErrorBoundary` fallback.
- **AuthLayout coverage tests**: 6 tests for heading, children, and layout structure.
- **Coverage gap patches**: App.test.tsx (default-router branch), useToast.test.tsx
  (16 tests, description/durationMs branches), useTheme.test.tsx (localStorage failure
  catch branch).
- **Lighthouse CI config** updated: routes (`/`, `/dashboard`, `/settings`), score
  thresholds (performance ≥ 0.9, accessibility = 1.0), INP assertion added.
- **CI workflow** updated with E2E sharding (4 shards), Playwright browser caching,
  dedicated a11y job (axe Chromium + Firefox + keyboard), bundle budget check, edge case
  validation, and Lighthouse CI enabled.

### Fixed

- **Critical**: API client now reads the auth token from Redux and sends the `Authorization`
  header on every authenticated request (`main.tsx`). Previously `getToken` defaulted to
  `() => null`, making all authenticated endpoints (session check, profile, logout) fail
  with 401 against the real Express server.
- Public auth endpoints (login, signup, forgot-password, reset-password) now pass
  `skipAuth: true` to avoid sending auth tokens before authentication.
- Color contrast on form error summaries meets WCAG 2.2 AA (4.5:1 minimum). Error text
  changed from `#dc2626` (3.33:1) to `#991b1b` (5.8:1) on the `#fecaca` background.
- Lint: resolved 25 errors and warnings across client and server code (unused imports,
  unescaped entities, implicit `any`, import ordering).
- Unescaped apostrophe in forgot-password success message replaced with `&apos;`.

### Changed

- **API paths**: fixed missing `/api` prefix in `dashboardApi.ts`, `projectsApi.ts`,
  `userApi.ts` — requests were hitting Vite dev server (HTML) instead of Express.
- **Prisma config**: migrated from deprecated `package.json#prisma` to
  `server/prisma.config.ts` using `defineConfig`.
- `PasswordStrengthIndicator`: Zod schema type arguments hardened from `any` to
  `z.ZodTypeDef | unknown`.
- **Lighthouse CI config** (`lighthouserc.cjs`): added `/` and `/settings` routes;
  upgraded CWV assertions from `warn` to `error`; added INP and score thresholds;
  removed unused `projects` route.
- **Package scripts**: added `validate:edge-cases`, `check:budgets` scripts.
- **Test utilities**: removed unused `preloadedState` field from `RenderWithProvidersOptions`
  interface and `render.tsx` wrapper. No consumer existed.
- **App.test.tsx**: mocks `@/routes` module to avoid jsdom AbortSignal incompatibility
  with MSW interceptor when testing `createAppRouter` default branch.
- **Keyboard E2E spec**: focus-trap detection with element-identity comparison, skip-link verification
  (`A[href="#main-content"]`), expanded focusable selector (added `select`, `textarea`).
- **Axe tests**: SettingsPage, DashboardPage, ProjectListPage, and ToastRegion now audit populated
  states with mocked fetch data instead of loading skeletons.
- **SettingsPage test**: `toHaveAttribute('aria-describedby')` → `toHaveAccessibleDescription(/regex/i)`
  for all 5 notification toggles (behavioral assertion).
- **AuthLayout test**: removed `container.querySelectorAll('p')` and CSS-class assertions; replaced
  with `screen.queryByText('Welcome back')`.
- **test-utils/a11y.tsx**: documented color-contrast and prefers-reduced-motion limitations in JSDoc.
- **test-utils/msw.tsx**: simplified `createErrorResponse` status type from lengthy union to `number`.
