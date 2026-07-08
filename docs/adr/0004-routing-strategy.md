# ADR 0004 — Routing Strategy: Lazy Routes + Auth Guards

**Status:** Accepted  
**Date:** 2026-07-07  
**Decision makers:** Architecture Agent, Tech Lead  
**Tags:** routing, react-router, code-splitting, auth

---

## Context

The application needs a routing strategy that supports:

1. **Code splitting** — each route loads independently to meet bundle budgets
2. **Authentication gating** — some routes require auth, some redirect if already authenticated
3. **Error handling** — render crashes, loader/action errors, and not-found pages must be graceful
4. **Synchronous auth reads** — route guards must not flash the login page while checking auth

We considered React Router v6 (`createBrowserRouter`) vs Next.js-style file-based routing vs a custom solution.

---

## Decision

Use **React Router v6 `createBrowserRouter`** with:

- **Route-level code splitting** via `React.lazy` + `Suspense`
- **`RequireAuth` guard** — reads Redux auth state synchronously, redirects to `/login?next=<path>` if unauthenticated
- **`RedirectIfAuth` guard** — redirects to `/dashboard` if already authenticated
- **`RootErrorBoundary`** — catches render crashes at the top level
- **`RouteErrorElement`** — handles loader/action errors per route
- **`RouteFallback`** — Suspense fallback per route (skeleton or spinner)
- **Breadcrumbs** — derived from URL params

---

## Route tree

```
/                  → LandingPage (eager — always first route)
/login             → LoginPage (lazy, RedirectIfAuth)
/signup            → SignupPage (lazy, RedirectIfAuth)
/forgot-password   → ForgotPasswordPage (lazy, RedirectIfAuth)
/reset-password    → ResetPasswordPage (lazy, RedirectIfAuth)
/dashboard         → DashboardPage (lazy, RequireAuth)
/projects          → ProjectListPage (lazy, RequireAuth)
/projects/new      → ProjectCreatePage (lazy, RequireAuth)
/projects/:id      → ProjectDetailPage (lazy, RequireAuth)
/projects/:id/edit → ProjectEditPage (lazy, RequireAuth)
/settings          → SettingsPage (lazy, RequireAuth)
/*                 → NotFoundPage (lazy)
```

---

## Rationale

1. **`createBrowserRouter`** is the officially recommended data-router API since React Router v6.4. It supports loaders, actions, error elements, and lazy loading natively.

2. **`React.lazy` + `Suspense`** is the simplest code-splitting primitive. No extra dependencies. Every route is a separate chunk.

3. **Eager `LandingPage`** — the index route is always visited first. Lazy loading it would add a network round-trip before the user sees anything.

4. **Synchronous auth guards** — `RequireAuth` reads from Redux (`useAppSelector`), not from React Query. This prevents flash-of-login-page when the user refreshes while authenticated.

5. **Error boundary per route** — a render crash in one route doesn't take down the entire app.

---

## Consequences

### Positive

- Every route (except landing) is a separate chunk under 200 kB gzip
- Auth guards render instantly (no network dependency)
- Error isolation — crash in `/projects` doesn't affect `/dashboard`
- Clear route hierarchy in a single file

### Negative

- Route-level code splitting means a brief Suspense fallback on first visit to each lazy route
- Cannot use `useRoutes` hook pattern (requires `createBrowserRouter` with element tree)
- Adding a new route requires touching the router definition

### Mitigations

- Preload critical routes on hover/intersection (future enhancement)
- Suspense fallback is a skeleton matching the page layout (not a spinner)
- Route tree is centralized in `src/routes/index.tsx` — easy to audit

---

## Error handling

| Error location | Handler | Behavior |
|----------------|---------|----------|
| Render crash | `RootErrorBoundary` | Full-page fallback with retry |
| Route loader/action | `RouteErrorElement` | Per-route error display with retry |
| Lazy load failure | `RouteFallback` + `Suspense` | Shows fallback, retry on next navigation |
| Not found | `NotFoundPage` | 404 with link to home |

---

## Related

- ADR 0002 — State Management (synchronous auth reads from Redux)
- AGENTS.md §3 — Code splitting mandatory, Suspense + lazy for route-level
