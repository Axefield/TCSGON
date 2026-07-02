# Roadmap — TCSgon

> Phased delivery plan for building a production-grade React 18+ SPA.
> Each phase ends with a demonstrable, merge-ready milestone.

---

## 0. Project Reality Check

- **Stack:** React 18+, TypeScript (strict), Vite, Redux Toolkit, React Query, React Router v6
- **Testing:** Vitest + RTL (unit/integration), Playwright (E2E), MSW (network), axe-core (a11y)
- **Forms:** React Hook Form + Zod
- **Package manager:** pnpm
- **AI tooling:** opencode, Cursor, Claude Code, Codex CLI, Gemini CLI — each wired with 9 specialist agents
- **CI gates:** lint, typecheck, coverage (80/75/80), bundle budget (200/350 kB gzip), a11y (zero critical/serious)

---

## Phase 0 — Project Scaffold

> Skeleton the entire repository. Everything compiles, lints, and passes a trivial test.

**Duration:** Day 1

- [ ] `pnpm create vite` with React + TypeScript template
- [ ] `tsconfig.json` — strict mode enabled
  - `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
  - `noImplicitOverride: true`, `useUnknownInCatchVariables: true`
- [ ] `eslint.config.js` (flat config) — React + TypeScript + a11y + import ordering rules
- [ ] `vitest.config.ts` — RTL setup, coverage thresholds
- [ ] `playwright.config.ts` — base URL, reporters, CI mode
- [ ] Install core deps:
  - `@reduxjs/toolkit`, `react-redux` (global state)
  - `@tanstack/react-query` (server state)
  - `react-router-dom` v6 (routing)
  - `react-hook-form`, `zod`, `@hookform/resolvers` (forms + validation)
  - `msw` v2 (network mocking)
  - `axe-playwright`, `@axe-core/playwright` (a11y CI)
  - `@tanstack/react-virtual` (virtualization)
- [ ] `package.json` scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:coverage`, `e2e`, `axe`
- [ ] `src/` folder structure created
- [ ] Trivial passing test (`App.test.tsx` renders heading)
- [ ] `/ship` passes on initial commit

### Folder structure delivered

```
src/
├── main.tsx                    # ReactDOM.createRoot + providers
├── App.tsx                     # Layout shell router
├── routes/                     # Route definitions (lazy)
│   └── index.tsx
├── features/                   # Feature modules (scoped)
│   └── __README__.md           # Feature convention doc
├── shared/                     # Cross-feature primitives
│   ├── components/             # Generic UI primitives
│   ├── hooks/                  # Shared custom hooks
│   ├── types/                  # Domain-wide types
│   ├── utils/                  # Pure utility functions
│   └── api/                    # Shared API client setup
├── store/                      # Redux store configuration
│   ├── index.ts
│   ├── hooks.ts                # Typed useAppDispatch, useAppSelector
│   └── middleware.ts           # API middleware, error handling
├── styles/                     # Global styles, design tokens
│   ├── tokens.css              # CSS custom properties
│   └── reset.css               # CSS reset
├── __tests__/                  # Top-level integration tests
└── test-utils.tsx              # Custom render with providers
```

### Verification

```bash
pnpm lint        # zero errors
pnpm typecheck   # zero errors
pnpm test        # 1+ passing test
pnpm build       # produces dist/
```

---

## Phase 1 — Core Infrastructure

> Routing, API layer, auth, theme, error handling. The spine of the application.

**Duration:** Days 2–3

### 1.1 Routing
- [ ] Route tree in `src/routes/index.tsx` with `createBrowserRouter`
- [ ] Lazy loading via `React.lazy` + `Suspense` for every route
- [ ] Route-level `ErrorBoundary` component
- [ ] 404 catch-all route
- [ ] Auth guard layout (redirect to login if unauthenticated)
- [ ] Navigation breadcrumb state (via URL params)

### 1.2 API layer
- [ ] `src/shared/api/client.ts` — typed fetch wrapper (base URL, interceptors, token injection)
- [ ] `src/shared/api/errors.ts` — `ApiError`, `NetworkError`, `ValidationError` discriminated types
- [ ] Request cancellation via `AbortController`
- [ ] Retry logic (exponential backoff, max 3 retries)
- [ ] `src/shared/api/queryClient.ts` — React Query client with default stale/retry/cache config
- [ ] Zod schema registry pattern for API response validation

### 1.3 State store
- [ ] Redux store (`src/store/index.ts`) with:
  - `auth` slice (user, token, loading, error)
  - `ui` slice (theme, sidebar, toasts, modals)
  - Typed hooks (`useAppDispatch`, `useAppSelector`)
  - Middleware: logging (dev), error reporting, RTK query
- [ ] React Query integration — Redux holds only truly global UI/auth state; server state lives in React Query
- [ ] Persist auth token to `localStorage` + rehydrate on app start

### 1.4 Theme system
- [ ] CSS custom properties in `src/styles/tokens.css`:
  - Color palette (light + dark)
  - Typography scale (typescale via modular scale)
  - Spacing scale (4px base grid)
  - Breakpoints
  - Shadows, radii, transitions
- [ ] Theme toggle (light/dark) via `ui` slice + `data-theme` attribute on `<html>`
- [ ] Respect `prefers-color-scheme` on initial load
- [ ] Respect `prefers-reduced-motion` — disable non-essential transitions

### 1.5 Shell layout
- [ ] `src/App.tsx`:
  - Providers: Redux `<Provider>`, React Query `<QueryClientProvider>`, Router `<RouterProvider>`, Theme context
  - Error boundary at the top level
  - `<Suspense>` fallback (spinner / skeleton)
- [ ] Responsive shell: sidebar nav (collapsible) + top bar + main content area
- [ ] Skip-to-content link as first focusable element
- [ ] Toast notification system (`ui` slice + `aria-live` region)

### Verification

```bash
pnpm test --coverage  # ≥ 2% coverage (store slices, API client)
pnpm build            # within budget
# Manual: App loads, routes resolve, theme toggles, toast appears
```

---

## Phase 2 — Design System

> Reusable, accessible, typed UI primitives. Every component ships with a Storybook story, a test, and an axe audit.

**Duration:** Days 4–7

### Priority components (in order)

- [ ] **`Button`** — variants (primary/secondary/ghost/danger), sizes, icon slot, loading state, disabled state, full-width
  - Renders `<button>` or `<a>` via `as` prop
  - Keyboard visible focus ring
  - `aria-disabled` when loading (button stays focusable)
- [ ] **`Input`** — label, error message, helper text, prefix/suffix icon, password visibility toggle
  - Forwards ref to `<input>`
  - Error state: `aria-invalid` + `aria-describedby`
  - Character count for constrained fields
- [ ] **`Select`** — native `<select>` styled, same API as `Input`
- [ ] **`Checkbox` / `Radio`** — accessible custom-styled inputs
- [ ] **`Modal`** — `aria-modal="true"`, focus trap, Esc to close, returns focus to trigger
  - `useLockedBody` scroll lock hook
  - Optional close button + backdrop click to close
- [ ] **`Drawer`** — slide-in panel, same a11y contract as Modal
- [ ] **`Tooltip`** — `role="tooltip"`, `aria-describedby`, hover + focus visible, delay
- [ ] **`Toast`** — `role="status"`, `aria-live="polite"`, stacked, auto-dismiss, pause on hover
  - Animated enter/exit (respects `prefers-reduced-motion`)
  - Types: success, error, warning, info
- [ ] **`Badge`** — numeric / dot / text
- [ ] **`Spinner`** — SVG animation, `aria-label="Loading"`, respect `prefers-reduced-motion` (static)
- [ ] **`Skeleton`** — placeholder shimmer for content loading
- [ ] **`Avatar`** — image with fallback initials, `aria-label`
- [ ] **`Table`** — accessible `<table>` with sortable columns, sticky header, empty state
- [ ] **`Tabs`** — `role="tablist"` + `role="tab"` + `role="tabpanel"`, arrow key navigation
- [ ] **`Pagination`** — prev/next + page numbers + ellipsis, `aria-current="page"`
- [ ] **`EmptyState`** — icon + heading + description + optional CTA
- [ ] **`ErrorBoundary`** — catches render errors, shows fallback, logs to console, retry button

### Per-component deliverable

```
Button/
├── Button.tsx             # Component
├── Button.test.tsx        # RTL tests (render, click, disabled, loading, variants)
├── Button.stories.tsx     # Storybook story (all variants + states)
├── Button.axe.test.ts     # axe-core audit
└── index.ts               # Re-export
```

### Verification

```bash
pnpm test              # all component tests pass
pnpm test --coverage   # coverage ≥ 20%
pnpm axe               # zero critical/serious on every story
pnpm build             # within budget
```

---

## Phase 3 — Authentication Feature (Full-Stack)

> The first end-to-end feature, split into three sub-phases: backend API + database, frontend auth pages, and full-stack integration.

---

### Phase 3a — Backend Auth API + Database

> Express server, PostgreSQL, Prisma ORM, opaque session tokens. The backend that powers auth.

**Duration:** Days 8–10

**Plan:** `docs/plans/phase-3a-backend-auth.md`

#### 3a.1 Database
- [x] PostgreSQL database `tcsgon` on `localhost:5242`
- [x] Prisma schema with three tables:
  - `users` — id (UUID), name, email (unique), password_hash, timestamps
  - `sessions` — id (UUID), user_id (FK), token_hash (SHA-256), expires_at, timestamps
  - `password_reset_tokens` — id (UUID), user_id (FK), token_hash, expires_at, used_at, timestamps
  - Plus reserved `projects` model for Phase 4+
- [x] Initial Prisma migration (applied to both `tcsgon` and `tcsgon_test`)
- [x] Dev seed script: admin user (`admin@tcsgon.dev` / `password123`) + test user + E2E tokens

#### 3a.2 Express server
- [x] Express 5 app with middleware stack (CORS, JSON, logger, auth, validation, error handler)
- [x] `server/src/lib/crypto.ts` — SHA-256 token hashing + bcrypt password hashing (`bcryptjs` for Windows compat)
- [x] `server/src/lib/prisma.ts` — Prisma client singleton (global cached)

#### 3a.3 Auth middleware
- [x] `requireAuth` middleware — extracts `Authorization: Bearer <token>`, hashes it, looks up `sessions` table by `token_hash`, rejects if invalid/expired, attaches `req.user` + `req.session`
- [x] `validate(schema)` middleware factory — validates request body against Zod schema, returns 400 with field-level errors on mismatch
- [x] Global error handler — maps known error types to structured JSON responses (ValidationError 400, Unauthorized 401, Conflict 409, NotFound 404, Internal 500)

#### 3a.4 Auth routes (`/api/auth/*`)
- [x] `POST /api/auth/signup` — validate, check duplicate email, hash password, create user + session, return `{ user, session }`
- [x] `POST /api/auth/login` — find user by email, compare password, create session, return `{ user, session }`
- [x] `POST /api/auth/logout` — require auth, delete session from DB, return success
- [x] `POST /api/auth/forgot-password` — find user by email, create password_reset_token, always return 200 (prevent enumeration), log token in dev
- [x] `POST /api/auth/reset-password` — find token by hash, validate not expired/used, update password, delete token, create new session
- [x] `GET /api/auth/session` — require auth, return `{ user, session }` (no token — client already has it)

#### 3a.5 User routes (`/api/users/*`)
- [x] `GET /api/users/me` — return current user profile
- [x] `PUT /api/users/me` — update name/email (validate unique email)
- [x] `PUT /api/users/me/password` — verify current password, hash + save new password

#### 3a.6 Server package
- [x] `server/package.json` with all dependencies (Express 5, Prisma 6, bcryptjs, Zod, tsx)
- [x] `server/tsconfig.json` (strict, ESM with NodeNext module)
- [x] `server/.env` with DATABASE_URL, PORT, CORS_ORIGIN, SESSION_EXPIRY_HOURS
- [x] `server/.env.example` (without secrets)
- [x] `server/.gitignore`

#### 3a.7 Dev workflow
- [x] `pnpm dev:server` — `tsx watch src/index.ts` (auto-restart on changes)
- [x] `pnpm dev` at root — `concurrently` runs Vite + Express
- [x] `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio` scripts

#### 3a.8 Testing
- [x] Service tests — `auth.test.ts` (13), `session.test.ts` (6), `user.test.ts` (11)
- [x] Middleware tests — `auth.test.ts` (6), `validate.test.ts` (5)
- [x] Route integration tests — `auth.test.ts` (15), `users.test.ts` (9) via supertest
- [x] Test DB strategy: dedicated `tcsgon_test` database, `afterEach` truncation in FK-safe order, `fileParallelism: false` for isolation
- [x] Test utilities: `test-setup.ts` (migration deploy + cleanup), `test-utils.ts` (factory functions: `createTestUser`, `createTestSession`, `createAuthenticatedUser`)
- [x] Config fixes during implementation: UUID validation for `@db.Uuid` columns, sequential execution for shared DB, default import for Express app

#### Verification

```bash
cd server && pnpm dev              # → Listening on :3001
curl http://localhost:3001/api/auth/session
# → 401 (expected — no token)

# Full flow:
# 1. Signup → 201 { user, session }
# 2. Session check with token → 200 { user, session }
# 3. Logout → 200
# 4. Session check after logout → 401
# 5. Login → 200 { user, session }
# 6. Forgot password → 200 { message }
# 7. Reset password → 200 { user, session }

cd server && pnpm test  # → 7/7 files, 65/65 tests PASS
```

---

### Phase 3b — Frontend Auth Pages

> Login, signup, password reset UI. The forms, guards, and profile menu — now pointing at the real Phase 3a backend.

**Duration:** Days 11–13

**Plan:** `docs/plans/phase-3-authentication.md` (updated — references real API instead of MSW-only)

> **Note:** 3b.1 was completed during Phase 3a.7 (dev workflow wiring). The Vite proxy and concurrently scripts are already in place.

#### 3b.1 Vite proxy
- [x] Configure `/api` proxy in `vite.config.ts` → `http://localhost:3001`
- [x] `pnpm dev` runs Vite + Express concurrently

#### 3b.2 Auth API hooks (`src/features/auth/api/authApi.ts`)
- [x] `useLogin`, `useSignup`, `useLogout`, `useResetPassword`, `useSession` — React Query hooks with `onMutate` (dispatches `loginRequested` to Redux) and robust `onError` handling
- [x] Zod schemas for request/response validation: `AuthResponseSchema`, `SessionCheckSchema`, `ForgotPasswordResponseSchema` (mirrors server schemas)
- [x] Token storage: Redux `auth` slice + `localStorage` (`saveAuth`/`clearAuth` persistence layer)
- [x] API client injects `Authorization: Bearer <token>` from Redux via `getToken` resolver

#### 3b.3 Auth pages (lazy-loaded routes)
- [x] `LoginPage` — email + password form, validation, error display, redirect on success
  - Auto-focus first field, `aria-describedby` for errors, loading state on submit
  - Keyboard: Tab through fields, Enter to submit, Escape to clear
- [x] `SignupPage` — name + email + password + confirm password
  - `PasswordStrengthIndicator` component with `role="meter"`, color-coded segments, `aria-valuenow`
  - On success dispatches `loginFulfilled` (auto-login)
- [x] `ForgotPasswordPage` — email-only form, success confirmation view, no Redux state changes
- [x] `ResetPasswordPage` — token from URL params, new password + confirm, success auto-login

#### 3b.4 Auth guards
- [x] `RequireAuth` — redirects to `/login?next=<path>` if no session (existing)
- [x] `RedirectIfAuth` — redirects to `/dashboard` if already logged in (existing)
- [x] `SessionCheck` — mounted in `AppShell`, fires `useSession()` on mount, dispatches `rehydrate`/`sessionExpired` to Redux via `useEffect`

#### 3b.5 Profile menu + TopBar
- [x] `TopBar` refactored: self-contained auth via `useAuth()`, renders `ProfileMenu` or sign-in link
- [x] `ProfileMenu` — avatar/initials + dropdown: name, email, Settings link, Sign Out button
  - Keyboard: Enter/Space to open, Arrow keys to navigate, Escape to close, focus trap
  - `aria-haspopup`, `aria-expanded`, `role="menu"`, `role="menuitem"`

#### 3b.6 MSW handlers (test-only)
- [x] `test/msw/handlers/auth.ts` — handlers for signup, forgot-password, reset-password; all return `{ user, session }` matching server
- [x] `test/msw/fixtures/auth.ts` — shared test data (existing, extended)

#### 3b.7 Wire existing features to real backend

The existing Projects and Dashboard features already use the API client (`useApiClient()` → `baseUrl: '/api'`). Phase 3b's Vite proxy (3b.1) makes them automatically target the Phase 3a Express server:

- The **proxy configuration** in `vite.config.ts` handles forwarding `/api/*` to `:3001`
- Auth endpoints (Phase 3a) will work immediately after proxy setup
- Project/dashboard endpoints will return 404 until Phase 4 implements them
- Routes wired: signup, forgot-password, reset-password under `RedirectIfAuth` wrapper
- `AppShell` renders `<TopBar />` and `<SessionCheck />`; barrel exports updated

#### Fixes during 3b implementation
- [x] `AppShell.test.tsx` — added `QueryClientProvider` + `ApiClientProvider` wrappers for `SessionCheck`/`TopBar` (4 tests fixed)
- [x] `useAuth.test.tsx` — 6 pre-existing failures fixed:
  - Added `onMutate` to `useLogin`/`useSignup` for `loginRequested` dispatch
  - Rewrote `refresh()` to directly call API + dispatch (removed `useSession` observer dependency)
  - Made `onError` robust against non-Error throws (fallback message)
  - Fixed test mocks to match schema shapes (`SessionCheckSchema` vs flat `Session`)
- [x] `useAuth.ts` — `refresh()` uses `useRef` for fresh state + try/catch safety

#### Verification

```bash
pnpm dev          # Vite + Express concurrently
# Open http://localhost:5173/signup
# Create account → redirected to /login
# Login → redirected to /dashboard
# Profile menu shows user name/email
# Sign out → redirected to /login

pnpm test         # 325/325 passing (51 files)
pnpm typecheck    # 0 errors
pnpm test --coverage  # auth feature ≥ 75%
pnpm axe              # zero critical/serious on auth pages
```

---

### Phase 3c — Full-Stack Integration + E2E

> Wire everything together. True end-to-end tests against the real backend, user profile settings, release-quality hardening.

**Duration:** Days 14–15

#### 3c.1 Full-stack E2E (Playwright vs real API)
- [ ] E2E tests target the real Express API (not mockApi.ts) for critical auth flows:
  - `auth/signup.spec.ts` — create account via real API, verify redirect
  - `auth/login.spec.ts` — login via real API, verify dashboard
  - `auth/logout.spec.ts` — logout via real API, verify redirect
  - `auth/session-expiry.spec.ts` — wait for token expiry, verify redirect
- [ ] E2E tests still use `mockApi.ts` for scenarios requiring deterministic state (expired tokens, network errors)
- [ ] Add `E2E_SESSION_TOKEN` env var from seed data for authenticated E2E tests

#### 3c.2 User profile settings
- [ ] `SettingsPage` — real profile editor (not stub)
  - View name + email
  - Edit name
  - Change password (current password + new password)
  - Save/cancel with toast feedback
- [ ] Zod schemas for profile update requests
- [ ] Form validation + error handling (409 for duplicate email)

#### 3c.3 a11y hardening
- [ ] axe-core audit of all auth pages against real backend (no MSW delays, real error states)
- [ ] Manual NVDA + VoiceOver walkthrough of signup → login → profile → logout
- [ ] Keyboard-only full tab through every auth page

#### 3c.4 Edge case testing
- [ ] Offline: app shows friendly error, doesn't crash
- [ ] Session expires mid-session: 401 → `sessionExpired` → redirect to login
- [ ] Duplicate email signup: 409 → error message stays on form
- [ ] Invalid reset token: proper error + link to request new
- [ ] Network timeout: retry → fail → friendly message

#### Verification

```bash
pnpm dev                 # Full stack running
pnpm e2e --grep "auth"   # All auth E2E tests pass (some vs real API, some vs mock)
pnpm e2e --grep "@a11y"  # Zero critical/serious violations on auth pages

# Manual: full user journey
#   Signup → Login → Edit profile → Change password → Logout → Login with new password
```

---

## Phase 4 — Feature Module (Template) + Server Endpoints

> The pattern for every future feature. Once established, new features follow this template exactly.
> Also implements the project and dashboard API endpoints on the server (reserved `Project` model from Phase 3a).

**Duration:** Days 16–19

- [ ] `src/features/<name>/` convention:
  ```
  features/<name>/
  ├── api/                # React Query hooks + Zod schemas
  │   ├── <name>Api.ts
  │   └── <name>Api.test.ts
  ├── components/         # Feature-specific components
  │   ├── <name>List.tsx
  │   ├── <name>Detail.tsx
  │   └── <name>Form.tsx
  ├── hooks/              # Feature-specific hooks
  │   └── use<name>.ts
  ├── types/              # Feature-specific types
  │   └── index.ts
  ├── pages/              # Route-level page components
  │   ├── <name>ListPage.tsx
  │   ├── <name>DetailPage.tsx
  │   └── __tests__/
  ├── __tests__/          # Integration tests
  │   └── <name>.test.tsx
  └── index.ts            # Public exports
  ```
- [ ] Feature module checklist:
  - [ ] Query/mutation hooks with loading, error, empty, success states
  - [ ] Optimistic updates where latency matters
  - [ ] Error boundary at the feature root
  - [ ] Lazy-loaded route
  - [ ] MSW handlers for every API endpoint
  - [ ] Keyboard-navigable list + detail views
  - [ ] axe-clean at the page level
  - [ ] Bundle contribution < 50 kB gzip per route
- [ ] Integration test: list → select → detail → edit → save → list updated
- [ ] E2E test: critical user journey through the feature

### Server endpoints (Phase 4 new work)

The `Project` model in `server/prisma/schema.prisma` already exists from Phase 3a (reserved). Phase 4 implements the actual routes and services:

| Endpoint | Priority | Notes |
|---|---|---|
| `GET /api/projects` | High | Paginated list with filtering, sorting, search |
| `GET /api/projects/:id` | High | Single project detail |
| `POST /api/projects` | High | Create project, returns 201 |
| `PUT /api/projects/:id` | High | Update project |
| `DELETE /api/projects/:id` | Medium | Soft-delete or hard-delete (TBD) |
| `GET /api/dashboard/stats` | Medium | Aggregate: project counts, completion rate, recent activity |

Also needs:
- [ ] Server-side Zod schemas matching frontend contracts (from `docs/plans/phase-3-authentication.md` § Existing UI Data Contracts)
- [ ] Service tests + route integration tests for all project/dashboard endpoints
- [ ] Prisma seed data for projects (at least 5 sample projects with varied statuses)
- [ ] Update MSW handlers (`test/msw/handlers/`) if endpoint shapes changed
- [ ] Update `e2e/utils/mockApi.ts` for any new response shapes

**Design decisions needed in Phase 4:**
- `memberCount` — derived from project-team join table, or hardcoded field?
- `completionRate` — derived from project status distribution, or explicit metric?
- `RecentActivity` — event-sourced (separate audit table) or computed from project `updatedAt`?
- Pagination cursor vs offset-based (current UI uses offset-based: `page` + `pageSize`)
- Search — basic `ILIKE` on `name`, or full-text search?

### Verification

```bash
pnpm test              # all feature tests pass
pnpm test --coverage   # feature module ≥ 80%
pnpm e2e               # critical journey passes
pnpm build             # budget per route
pnpm axe               # zero critical/serious
```

---

## Phase 5 — Testing & A11y Hardening

> Coverage, accessibility audit, edge case hardening. The quality gate phase.

**Duration:** Days 20–22

### 5.1 Coverage push
- [ ] Every component in `src/shared/components/` has:
  - Render test (mounts without error)
  - Interaction test (click, type, focus)
  - Edge case test (empty, loading, error, disabled)
  - Accessibility test (axe-core)
- [ ] Every API hook has:
  - Success case test (data returned, loading states)
  - Error case test (network error, validation error, 401)
  - Loading state test
- [ ] Every page has:
  - Integration test (critical path through the page)
  - Error boundary test (simulated render error)

### 5.2 Accessibility audit
- [ ] Automated: entire app audited via axe-core (CI gate)
- [ ] Manual: NVDA + Firefox walkthrough of every route
- [ ] Manual: VoiceOver + Safari walkthrough of every route
- [ ] Keyboard-only: full tab through each route, verify:
  - Visible focus on every element
  - Logical tab order
  - No focus traps
  - Modals return focus to trigger
  - Skip-to-content present and functional
- [ ] Visual audit:
  - Contrast checked (text 4.5:1, UI 3:1) via devtools
  - No information conveyed by color alone
  - `prefers-reduced-motion` disables all non-essential animations
  - Zoom to 200%: no content cutoff

### 5.3 Edge case registry
- [ ] `docs/edge-cases.md` — documented per-feature:
  - Empty states (no data, filtered to zero)
  - Error states (network, timeout, 500, validation)
  - Loading states (initial load, paginated load, mutation in flight)
  - Offline behavior (stale-while-revalidate, retry on reconnect)
  - Large input (10k+ items in a list, virtualized)
  - Concurrent mutations (double-submit prevention, idempotency)

### Verification

```bash
pnpm test --coverage   # 80% lines / 75% branches / 80% functions — HARD REQUIREMENT
pnpm axe               # zero critical/serious
# Manual: NVDA + VoiceOver walkthrough complete
# docs/edge-cases.md documented for every feature
```

---

## Phase 6 — Performance Optimization

> Measure, identify, optimize, verify. Every optimization is data-driven.

**Duration:** Days 23–25

### 6.1 Baseline
- [ ] Lighthouse: LCP, INP, CLS, TBT, SI for every route (mobile, 4G, Moto G4)
- [ ] Bundle analysis: `vite build` + visualizer, identify top contributors
- [ ] DevTools Performance: record 3 interactions per route, identify long tasks

### 6.2 Optimization rounds

| Priority | Technique | Acceptance criteria |
|---|---|---|
| 1 | Route-level code splitting | Every route a separate chunk |
| 2 | Image optimization | AVIF/WebP, responsive srcset, lazy loading, preload LCP image |
| 3 | Bundle trimming | Replace heavy deps, tree-shake, prune dead code |
| 4 | List virtualization | @tanstack/react-virtual for lists > 50 rows |
| 5 | Memoization | React.memo, useMemo, useCallback ONLY with measured benefit |
| 6 | Deferred scripts | Third-party scripts loaded after interactive |
| 7 | Font optimization | Subset fonts, self-host, `font-display: swap` |

### 6.3 Targets
- **LCP:** < 2.5s (mobile, 4G, Moto G4)
- **INP:** < 200ms p75
- **CLS:** < 0.1
- **Bundle per route:** < 200 kB warn / 350 kB error (gzip)
- **Total JS (initial):** < 300 kB (gzip)

### 6.4 Monitoring
- [ ] Lighthouse CI in GitHub Actions (fail on regression)
- [ ] Bundle size tracking per PR (warn on +5%, fail on +10%)
- [ ] `docs/perf/<date>-baseline.md` — recorded for historical comparison

### Verification

```bash
pnpm build --analyze    # per-route bundle sizes
lighthouse-ci            # CWV pass
# DevTools: no long tasks > 100ms on typical interactions
```

---

## Phase 7 — CI/CD & Deployment Pipeline

> Automated quality gates, preview deployments, production release.

**Duration:** Days 26–28

### 7.1 CI (GitHub Actions)
- [ ] PR workflow:
  - `lint` + `typecheck` (parallel)
  - `test --coverage` (upload coverage report)
  - `build` (check budget)
  - `axe` (upload a11y report)
  - `e2e` (Playwright, sharded by spec)
  - Lighthouse CI (budget assertions)
  - Bundle size diff comment
  - Status check: all gates green before merge
- [ ] Server CI: `cd server && pnpm test` (unit + integration against test DB)
- [ ] Main branch workflow:
  - Same as PR + build for deployment
  - Server build + migrations run before frontend deploy
  - Version bump + CHANGELOG auto-extract
  - Publish to staging

### 7.2 CD
- [ ] Vercel / Netlify / Cloudflare Pages deployment
  - Preview deployment per PR (comment with URL)
  - Production deployment on merge to main
  - Staged rollouts (optional)

### 7.3 Quality gates (enforced)

| Gate | Threshold | Action |
|---|---|---|
| ESLint | zero errors | Block merge |
| TypeScript strict | zero errors | Block merge |
| Test coverage | 80/75/80 | Block merge |
| Bundle budget | 200/350 kB gzip | Block merge |
| aXe-core | zero critical/serious | Block merge |
| Lighthouse | LCP < 2.5s, CLS < 0.1 | Warn |

### Verification

```bash
# Push a PR branch → CI triggers
# All gates green within 5 minutes
# Preview URL posted as PR comment
# Merge to main → production deployed within 2 minutes
```

---

## Phase 8 — Documentation & Knowledge Base

> ADRs, component documentation, runbooks, onboarding guide.

**Duration:** Days 29–30

- [ ] `docs/adr/` — Architecture Decision Records:
  - `0001-use-vite.md` — why Vite over CRA/Next
  - `0002-state-management.md` — why Redux + React Query split
  - `0003-typescript-strict.md` — strict mode decisions
  - `0004-design-system.md` — component architecture
  - `0005-routing-strategy.md` — lazy routes, auth guards
  - (Add as new decisions are made)
- [ ] `src/features/__README__.md` — detailed convention for feature authors
- [ ] `src/shared/components/__README__.md` — DS usage guide with examples
- [ ] `docs/runbook.md` — daily operations: dev, test, build, deploy, rollback
- [ ] `docs/onboarding.md` — 30-minute onboarding: clone, deps, agents, first PR
- [ ] Every exported function: JSDoc with `@param`, `@returns`, `@throws`, `@example`
- [ ] CHANGELOG.md — compiled per release

### Verification

```bash
# Every exported symbol has JSDoc
# docs/ readable by a new engineer within 15 min
# ADRs indexed with status
```

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Agent hallucinates API / library API | Every agent prompt includes hallucination watch-list; `/review` gate catches mismatches |
| Bundle grows silently | Budget enforced at build time; CI fails on > 350 kB gzip per route |
| Accessibility regressions | axe-core CI gate + manual NVDA/VoiceOver per release |
| Coverage drops | CI blocks merge; PR comment with diff report |
| Design system inconsistency | `shared/components/` with canonical tests; no feature-specific UI primitives |
| Token / secret leak | CSP, `.env` gitignored, `secrets/**` denied in every tool config |
| Postgres not running on :5242 | `psql -p 5242` check in server startup; Docker Compose fallback documented |
| Prisma schema drift between machines | `prisma migrate dev` auto-detects drift; document workflow |
| Server + client port conflicts | `strictPort: true` on Vite; Express on 3001; documented in onboarding |

---

## 10. Definition of Done (per phase)

- [ ] `pnpm lint` — zero errors
- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm test --coverage` — gates met
- [ ] `pnpm build` — bundle within budget
- [ ] `pnpm axe` — zero critical/serious
- [ ] JSDoc on every new export
- [ ] CHANGELOG entry for user-facing change
- [ ] ADR filed if novel decision was made
- [ ] At least one CODEOWNER approval
- [ ] No `TODO` without a linked ticket

---

## 11. Verification Commands

```bash
pnpm lint             # ESLint flat config
pnpm typecheck        # tsc --noEmit (strict)
pnpm test             # Vitest (watch mode)
pnpm test --coverage  # Coverage report
pnpm build            # Production build
pnpm build --analyze  # Bundle visualization
pnpm e2e              # Playwright (all specs)
pnpm e2e --ui         # Playwright UI mode
pnpm axe              # aXe-core a11y audit
lighthouse-ci         # CWV audit (CI)
```

---

> *Roadmap v1 — Agent configuration complete; Phase 0 (project scaffold) is the next concrete step.*