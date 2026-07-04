# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

- `PasswordStrengthIndicator`: Zod schema type arguments hardened from `any` to
  `z.ZodTypeDef | unknown`.
- **Lighthouse CI config** (`lighthouserc.cjs`): added `/` and `/settings` routes;
  upgraded CWV assertions from `warn` to `error`; added INP and score thresholds;
  removed unused `projects` route.
- **CI workflow** (`.github/workflows/ci.yml`): E2E sharded across 4 parallel runners;
  Playwright browsers cached via `actions/cache@v4`; dedicated a11y job runs axe on
  Chromium + Firefox plus keyboard walkthrough; Lighthouse CI enabled (was `if: false`);
  build artifacts downloaded from build job to avoid redundant rebuilds.
- **Package scripts**: added `validate:edge-cases`, `check:budgets` scripts.
- **Test utilities**: removed unused `preloadedState` field from `RenderWithProvidersOptions`
  interface and `render.tsx` wrapper. No consumer existed.
- **App.test.tsx**: mocks `@/routes` module to avoid jsdom AbortSignal incompatibility
  with MSW interceptor when testing `createAppRouter` default branch.
