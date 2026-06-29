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

## Phase 3 — Authentication Feature

> Full login / signup / password reset / session management flow. The first end-to-end feature.

**Duration:** Days 8–10

### 3.1 API integration
- [ ] `src/features/auth/api/authApi.ts` — React Query hooks:
  - `useLogin`, `useSignup`, `useLogout`, `useResetPassword`, `useSession`
  - Zod schemas for every request/response
  - MSW handlers for development/testing
- [ ] Token storage: in-memory (Redux `auth` slice) + `localStorage` for persistence
- [ ] Axios interceptor: attach `Authorization: Bearer <token>`, handle 401 → logout

### 3.2 Pages
- [ ] `LoginPage` — email + password form, validation, error display, submit → redirect
  - Auto-focus first field, `aria-describedby` for errors, loading state on submit
  - Keyboard: Tab through fields, Enter to submit, Escape to clear
- [ ] `SignupPage` — name + email + password + confirm password
  - Password strength indicator (aria-live announcement)
  - Success toast → redirect to login
- [ ] `ForgotPasswordPage` — email-only form
- [ ] `ResetPasswordPage` — token from URL, new password + confirm
  - Token validation before showing form

### 3.3 Auth guards
- [ ] `RequireAuth` route wrapper — redirects to `/login` if no session, renders `<Outlet>`
- [ ] `RedirectIfAuth` route wrapper — redirects to `/dashboard` if already logged in
- [ ] Session check on app mount (React Query `useSession` query)
  - Show loading skeleton while session resolves
  - On 401: clear auth state, show login

### 3.4 Profile menu
- [ ] Avatar + dropdown in top bar: name, email, settings link, logout button
  - Keyboard: Enter to open, arrow keys to navigate, Escape to close
  - `aria-expanded` on the trigger

### Verification

```bash
pnpm test --coverage  # auth feature ≥ 75%
pnpm e2e              # login → dashboard → logout flow
pnpm axe              # zero critical/serious on all auth pages
# Manual: token refresh, 401 handling, password reset flow
```

---

## Phase 4 — Feature Module (Template)

> The pattern for every future feature. Once established, new features follow this template exactly.

**Duration:** Days 11–13

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

**Duration:** Days 14–16

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

**Duration:** Days 17–19

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

**Duration:** Days 20–22

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
- [ ] Main branch workflow:
  - Same as PR + build for deployment
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

**Duration:** Days 23–24

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