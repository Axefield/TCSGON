# Plan — Phase 1 Review Remediation

**Status:** Planned. To be executed after `feat/phase-1-core-infrastructure` review.
**Scope:** Fix all blocking and non-blocking issues identified in `Review — feat_phase-1-core-infrastructure.md`.
**Owning agents:** react → typescript → testing → accessibility.

---

## How to read this plan

Each section addresses one finding from the code review, ordered by execution dependency. Fixes flow bottom-up (leaves first) so each commit keeps tests green.

| # | Finding | Severity | Effort | Agent |
|---|---|---|---|---|
| 1 | Theme persistence key mismatch | Blocking | 5 min | react |
| 2 | RequireAuth guard logic | Blocking | 30 min | react |
| 3 | Open redirect via `next` parameter | Blocking | 15 min | react + typescript |
| 4 | Module-level singleton in `useAuth` | Blocking | 1 hr | react + testing |
| 5 | Inline styles in LoginForm + ProfileMenu | Blocking | 2 hr | react |
| 6 | ProfileMenu `role="listbox"` mismatch | Non-blocking | 15 min | accessibility |
| 7 | Bypassed type safety (`as unknown as Session`) | Non-blocking | 30 min | typescript |
| 8 | `RedirectIfAuth` returns `null` | Non-blocking | 5 min | react |
| 9 | Unused `onPin` prop in Sidebar | Non-blocking | 10 min | react |
| 10 | `usePrefersReducedMotion` paint delay | Non-blocking | 15 min | react |
| 11 | Module-level singleton in `App.tsx` | Non-blocking | 15 min | react |
| 12 | React Router v7 future flags | Non-blocking | 10 min | react |
| 13 | Unused `screen` import | Non-blocking | 2 min | typescript |
| 14 | Token in localStorage (document) | Non-blocking | 30 min | documentation |
| 15 | Coverage gaps | Non-blocking | 2 hr | testing |

**Total estimated effort:** ~7 hours.

---

## Commit sequence

Each commit is independently testable. Order respects dependency: if commit B imports from a module changed in commit A, A ships first.

```
1.  chore: align theme storage key between index.html and useTheme
2.  fix: add next-param allowlist validation to LoginPage
3.  fix: replace module-level singleton in App.tsx with useRef
4.  refactor: inject apiClient via Context instead of module-level singleton
5.  fix: guard RequireAuth to only render Outlet for authenticated state
6.  a11y: remove role="listbox" from ProfileMenu (use plain <ul>)
7.  fix: add Zod schema validation in useAuth for API responses
8.  refactor: extract LoginForm inline styles to CSS modules
9.  refactor: extract ProfileMenu inline styles to CSS modules
10. fix: RedirectIfAuth renders Outlet instead of null
11. chore: remove unused onPin prop from Sidebar
12. perf: useLayoutEffect for initial reduced-motion sync
13. chore: enable React Router v7 future flags
14. chore: remove unused screen import from RedirectIfAuth.test.tsx
15. docs: document token-in-localStorage risk in ADR
16. test: add coverage for useAuth login/logout/refresh paths
17. test: add coverage for authPersistence expiry/error paths
18. test: add RouteFallback and SettingsPageStub tests
```

---

## Detailed fixes

### 1. Theme persistence key mismatch

**Files:**
- `src/index.html` (line 18)
- `src/shared/hooks/useTheme.ts` (line 21)

**Problem:** `index.html` reads `localStorage.getItem('tcsgon-theme')` (hyphen) but `useTheme.ts` writes to `'tcsgon:theme'` (colon). The flash-prevention script never finds the saved preference.

**Fix:** Choose one convention. The codebase uses colon separators elsewhere (`tcs.auth` for auth storage), so standardize on colon:

```
// index.html line 18:
var saved = JSON.parse(localStorage.getItem('tcsgon:theme') || 'null');

// useTheme.ts line 21 — already correct:
const THEME_STORAGE_KEY = 'tcsgon:theme';
```

Also `index.html` stores raw strings via `JSON.parse`. Since `useTheme.ts` writes a plain string (`'dark'` / `'light'`), `JSON.parse('dark')` will throw and the catch handles it. Either change the index.html read to not use `JSON.parse`, or have `useTheme.ts` write `JSON.stringify(theme)`.

**Recommendation:** Align both to simpler pattern — no `JSON.parse` in index.html:

```js
// index.html
var saved = localStorage.getItem('tcsgon:theme');
var theme = saved === 'dark' || saved === 'light' ? saved : null;
```

**Verification:**
1. Toggle theme → reload page → theme persists
2. `tsc --noEmit` passes
3. Tests green

---

### 2. RequireAuth guard logic

**File:** `src/routes/RequireAuth.tsx`

**Problem:** The guard only redirects `'anonymous'` state, but passes through during `'authenticating'` and `'error'` states, exposing protected routes before auth completes.

**Fix:** Three-state handling:

```tsx
export function RequireAuth(): ReactElement {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  // Authenticated — render protected content
  if (status === 'authenticated') {
    return <Outlet />;
  }

  // Authenticating — show loading state (prevents flash of protected content)
  if (status === 'authenticating') {
    return (
      <main id="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Spinner label="Verifying session…" />
      </main>
    );
  }

  // Anonymous or error — redirect to login
  const next = encodeURIComponent(location.pathname + location.search + location.hash);
  return <Navigate to={`/login?next=${next}`} replace />;
}
```

**Verification:**
1. Unauthenticated user hits `/dashboard` → redirected to `/login?next=%2Fdashboard`
2. Authenticated user hits `/dashboard` → sees dashboard
3. `isAuthenticated` is derived from `status === 'authenticated'`, so remove the redundant `!isAuthenticated` check
4. Tests green

**Test impact:** Update `RequireAuth.test.tsx` to cover `'authenticating'` state (renders Spinner) and `'error'` state (redirects).

---

### 3. Open redirect via `next` parameter

**File:** `src/features/auth/pages/LoginPage.tsx` (line 27)

**Problem:** `searchParams.get('next')` is passed directly to `navigate()` without allowlist validation.

**Fix:** Add a validation helper:

```ts
// src/shared/utils/url.ts (or inline in LoginPage)
export function isValidRedirect(target: string): boolean {
  if (!target.startsWith('/')) return false;
  if (target.startsWith('//')) return false;  // protocol-relative URL
  if (target.includes('://')) return false;   // absolute URL
  return true;
}
```

Then use it:

```tsx
const rawNext = searchParams.get('next');
const next = rawNext && isValidRedirect(rawNext) ? rawNext : '/dashboard';
navigate(next, { replace: true });
```

**Verification:**
1. Login with `?next=/settings` → redirects to `/settings`
2. Login with `?next=https://evil.com` → redirects to `/dashboard`
3. Login with `?next=//evil.com` → redirects to `/dashboard`
4. Login without `?next` → redirects to `/dashboard`
5. Tests green

---

### 4. Module-level singleton in `useAuth`

**File:** `src/features/auth/hooks/useAuth.ts` (lines 48–65)

**Problem:** `let _apiClient: ApiClient | null = null` is a mutable module-level singleton. Forbidden per AGENTS.md §5.

**Fix:** Create an `ApiClientContext` and provide it from the app root, then consume via `useContext` in `useAuth`.

**Step 1 — Create context:**

```tsx
// src/shared/api/ApiClientContext.tsx
import { createContext, useContext, type ReactNode, type ReactElement } from 'react';
import type { ApiClient } from './client';

const ApiClientContext = createContext<ApiClient | null>(null);

export function ApiClientProvider({ client, children }: { client: ApiClient; children: ReactNode }): ReactElement {
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used within an ApiClientProvider');
  }
  return client;
}
```

**Step 2 — Provide in `main.tsx`:**

```tsx
// src/main.tsx
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';

const apiClient = createApiClient({
  baseUrl: '/api',
  // getToken wired later when store is available
});

createRoot(rootElement).render(
  <StrictMode>
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={apiClient}>
          <App />
        </ApiClientProvider>
      </QueryClientProvider>
    </ReduxProvider>
  </StrictMode>,
);
```

**Step 3 — Consume in `useAuth`:**

```tsx
// src/features/auth/hooks/useAuth.ts — remove injectAuthApiClient, use:
import { useApiClient } from '@/shared/api/ApiClientContext';

export function useAuth(): UseAuthResult {
  const apiClient = useApiClient();
  // ... use apiClient directly, no module-level variable
}
```

**Verification:**
1. `useAuth()` called outside of `ApiClientProvider` throws clear error
2. Login/logout/refresh work end-to-end
3. Tests green; no test relies on `injectAuthApiClient`

---

### 5. Inline styles in LoginForm + ProfileMenu

**Files:**
- `src/features/auth/components/LoginForm.tsx`
- `src/features/auth/components/ProfileMenu.tsx`

**Problem:** All styling uses inline `style` objects instead of CSS modules, causing re-renders and violating project conventions.

**Fix:** Create `LoginForm.module.css` and `ProfileMenu.module.css`, extract all style objects into CSS classes.

**`LoginForm.module.css` structure:**

```css
/* Form layout */
.form { max-width: 24rem; }
.field { margin-bottom: 1rem; }
.label { display: block; margin-bottom: 0.25rem; font-size: var(--font-size-sm, 0.875rem); }
.input { width: 100%; padding: 0.5rem 0.75rem; border-radius: var(--radius-md, 0.5rem); }
.inputError { border-color: var(--color-danger, #dc2626); }
.inputNormal { border-color: var(--color-border, #e2e8f0); }
.errorText { font-size: 0.75rem; color: var(--color-danger, #dc2626); margin-top: 0.25rem; }
.errorSummary { padding: 0.75rem; margin-bottom: 1rem; background: var(--color-toast-error-border, #fecaca); border-radius: var(--radius-md, 0.5rem); font-size: var(--font-size-sm, 0.875rem); color: var(--color-danger, #dc2626); }
.submitButton { width: 100%; padding: 0.625rem 1rem; background: var(--color-primary, #0b3d91); color: #ffffff; border: none; border-radius: var(--radius-md, 0.5rem); cursor: pointer; font-weight: var(--font-weight-medium, 500); }
.submitButton:disabled { opacity: 0.7; cursor: not-allowed; }
```

**`ProfileMenu.module.css` structure:**

```css
.wrapper { position: relative; }
.trigger { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.5rem; border: none; background: transparent; cursor: pointer; border-radius: var(--radius-md, 0.5rem); }
.avatar { width: 2rem; height: 2rem; border-radius: 50%; background: var(--color-primary, #0b3d91); color: #fff; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-sm, 0.875rem); font-weight: var(--font-weight-bold, 700); }
.name { font-size: var(--font-size-sm, 0.875rem); }
.menu { position: absolute; top: 100%; margin: 0.25rem 0 0; padding: 0.25rem 0; list-style: none; background: var(--color-bg, #ffffff); border: 1px solid var(--color-border, #e2e8f0); border-radius: var(--radius-md, 0.5rem); box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1)); min-width: 180px; z-index: 300; }
.menuStart { left: 0; }
.menuEnd { right: 0; }
.emailItem { padding: 0.5rem 1rem; font-size: 0.75rem; color: var(--color-fg-muted, #64748b); }
.menuItem { width: 100%; padding: 0.5rem 1rem; border: none; background: transparent; cursor: pointer; text-align: left; font-size: var(--font-size-sm, 0.875rem); }
```

**Verification:**
1. Visual diff: LoginForm and ProfileMenu appear identical before/after
2. No inline `style` props remain in either component
3. Tests green

---

### 6. ProfileMenu `role="listbox"` mismatch

**File:** `src/features/auth/components/ProfileMenu.tsx` (line 122)

**Problem:** The JSDoc says to omit `role="menu"` and use a plain `<ul>` of buttons, but the code applies `role="listbox"` (which requires keyboard arrow navigation not implemented here).

**Fix:** Remove the `role` prop from the `<ul>` entirely, or set `role="none"`:

```tsx
<ul
  id={MENU_ID}
  ref={menuRef}
  onKeyDown={handleKeyDown}
  // role="listbox" removed — plain <ul> per a11y JSDoc
  className={...}
>
```

**Verification:**
1. Screen reader reads menu items as a plain list of buttons
2. Escape still closes; focus returns to trigger
3. axe-core passes

---

### 7. Bypassed type safety in `useAuth`

**File:** `src/features/auth/hooks/useAuth.ts` (lines 87, 123)

**Problem:** `result.data as unknown as Session` bypasses compile-time type safety.

**Fix:** Validate the API response with the SessionSchema before dispatching:

```tsx
import { SessionSchema } from '@/shared/types/user';

// In login function:
if (result.ok) {
  const parsed = SessionSchema.safeParse(result.data);
  if (parsed.success) {
    dispatch(authActions.loginFulfilled(parsed.data));
  } else {
    dispatch(authActions.authFailed({
      message: 'Invalid session response.',
      user: null,
    }));
  }
}

// Same pattern in refresh():
if (result.ok) {
  const parsed = SessionSchema.safeParse(result.data);
  if (parsed.success) {
    dispatch(authActions.rehydrate(parsed.data));
  }
}
```

**Verification:**
1. API returns valid session → login succeeds
2. API returns malformed session → authFailed dispatched
3. `tsc --noEmit` passes with no `as` casts
4. Tests green

---

### 8. `RedirectIfAuth` returns `null`

**File:** `src/routes/RedirectIfAuth.tsx` (line 18)

**Problem:** Returns `null` when not authenticated — should render `<Outlet />` to support nested public routes.

**Fix:**

```tsx
export function RedirectIfAuth(): ReactElement | null {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
```

**Verification:**
1. Unauthenticated user on `/login` → sees login page content (via Outlet)
2. Authenticated user on `/login` → redirected to `/dashboard`
3. Tests green

---

### 9. Unused `onPin` prop in Sidebar

**File:** `src/layouts/Sidebar.tsx` (line 28)

**Problem:** `onPin` is destructured but never called. The pin action exists in the slice but isn't wired.

**Option A — Wire the pin behavior:** Add a pin button that calls `onPin(true)` / `onPin(false)`.

**Option B — Remove the prop (simpler, recommended for Phase 1):**

```tsx
export interface SidebarProps {
  readonly state: 'closed' | 'open' | 'pinned';
  readonly onToggle: () => void;
  // onPin removed — deferred to Phase 2
  readonly children: ReactNode;
}

export function Sidebar({ state, onToggle, children }: SidebarProps): ReactElement {
  // ...
}
```

**Verification:**
1. Sidebar toggle still works
2. No TypeScript errors
3. Tests green

---

### 10. `usePrefersReducedMotion` paint delay

**File:** `src/shared/hooks/usePrefersReducedMotion.ts` (line 28)

**Problem:** Initial `dispatch` fires in `useEffect` (after paint), potentially causing a brief animation flash.

**Fix:** Use `useLayoutEffect` so the dispatch runs synchronously before the first paint:

```tsx
import { useLayoutEffect } from 'react';

export function usePrefersReducedMotion(): boolean {
  const reducedMotion = useAppSelector(selectReducedMotion);
  const dispatch = useAppDispatch();

  useLayoutEffect(() => {
    const mql = window.matchMedia(MEDIA_QUERY);
    dispatch(setReducedMotion(mql.matches));

    const handler = (e: MediaQueryListEvent): void => {
      dispatch(setReducedMotion(e.matches));
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [dispatch]);

  return reducedMotion;
}
```

**Verification:**
1. No animation flash on initial render when `prefers-reduced-motion: reduce` is set
2. Tests pass (may need `mockWindowMatchMedia` in test setup)
3. `tsc --noEmit` passes

---

### 11. Module-level singleton in `App.tsx`

**File:** `src/App.tsx` (line 22)

**Problem:** `let productionRouter` is a mutable module-level singleton.

**Fix:** Use lazy initialization with a `useRef` inside the component, or simply remove the caching (router creation is cheap):

```tsx
// Option A: useRef inside component
export function App({ router }: AppProps): JSX.Element {
  const defaultRouterRef = useRef<RouterProviderProps['router']>();
  if (!defaultRouterRef.current) {
    defaultRouterRef.current = createAppRouter();
  }
  return (
    <RootErrorBoundary>
      <RouterProvider router={router ?? defaultRouterRef.current} />
    </RootErrorBoundary>
  );
}

// Option B: Remove caching entirely (simpler)
export function App({ router }: AppProps): JSX.Element {
  return (
    <RootErrorBoundary>
      <RouterProvider router={router ?? createAppRouter()} />
    </RootErrorBoundary>
  );
}
```

Option B is simpler — React Router's lazy loading already handles deduplication, and `createAppRouter()` is cheap (it just creates a function reference).

**Verification:**
1. App still renders correctly
2. Route navigation works
3. Tests green

---

### 12. React Router v7 future flags

**File:** `src/routes/index.tsx` (line 92)

**Problem:** Console warns about `v7_startTransition` and `v7_relativeSplatPath`.

**Fix:** Enable future flags in `createBrowserRouter`:

```tsx
export function createAppRouter(): ReturnType<typeof createBrowserRouter> {
  return createBrowserRouter(routes, {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  });
}
```

**Verification:**
1. Console warning disappears
2. Route navigation works
3. Tests green

---

### 13. Unused `screen` import

**File:** `src/routes/RedirectIfAuth.test.tsx` (line 6)

**Problem:** `screen` is imported but never used, causing `tsc --noEmit` to fail under `noUnusedLocals`.

**Fix:** Remove `screen` from the import:

```tsx
import { render } from '@testing-library/react';
```

**Verification:**
1. `tsc --noEmit` passes
2. `npx vitest run` still passes

---

### 14. Token-in-localStorage risk documentation

**New file:** `docs/adr/0001-token-persistence-strategy.md`

```markdown
# ADR 0001 — Token Persistence Strategy

**Status:** Accepted
**Date:** 2026-06-30

## Context
Phase 1 requires auth state to survive page reloads. The options are HttpOnly
cookies, in-memory tokens with refresh, or localStorage with schema validation.

## Decision
Use localStorage for Phase 1. The session token is stored alongside user info
in a single `tcs.auth` key, validated via Zod schema on read.

## Consequences
+ Synchronous read antes up preloadedState — no flash to login.
+ Simple to implement and debug.
- Token accessible to any JS on the same origin (XSS vulnerability).
- No automatic refresh mechanism.

## Mitigation plan (Phase 2)
Migrate to HttpOnly cookies with a refresh-token pattern. The API client already
handles 401 via the `'unauthorized'` error kind — the refresh logic will slot
into a response interceptor.
```

**Verification:** File exists, formatted correctly.

---

### 15. Coverage gaps

**Files requiring additional tests:**

| File | Target | Current | Effort |
|---|---|---|---|
| `useAuth.ts` | ≥ 80% lines | 34.14% | 1 hr |
| `authPersistence.ts` | ≥ 80% lines | 55.55% | 20 min |
| `client.ts` | ≥ 80% lines | 68.88% | 30 min |
| `RouteFallback.tsx` | ≥ 80% lines | 14.28% | 10 min |
| `SettingsPageStub.tsx` | ≥ 80% lines | 0% | 5 min |

**Key test scenarios to add:**

`useAuth.ts`:
- `login()` dispatches `loginRequested` then `loginFulfilled` on success
- `login()` dispatches `authFailed` on API error
- `login()` dispatches `authFailed` on exception
- `logout()` dispatches `logout` on success
- `logout()` dispatches `logout` on API error (best-effort)
- `refresh()` dispatches `rehydrate` on valid session
- `refresh()` dispatches `sessionExpired` on 401
- `refresh()` dispatches `sessionExpired` on exception
- `status` reflects state.kind
- `session` is null when not authenticated

`authPersistence.ts`:
- `loadAuth()` returns null when no stored data
- `loadAuth()` returns null for invalid JSON
- `loadAuth()` returns null for expired token
- `saveAuth()` writes to localStorage
- `clearAuth()` removes from localStorage

`client.ts` (remaining branches):
- Retry backoff timing
- Timeout abort vs caller abort distinction
- `FormData` body doesn't set Content-Type
- Schema validation failure returns `'validation'` error kind

**Verification:** `npx vitest run --coverage` shows per-file coverage ≥ 80%.

---

## Risk register

| # | Risk | Mitigation |
|---|---|---|
| R1 | Context refactor (fix #4) breaks existing tests that mock `injectAuthApiClient` | Create a test helper `createTestApiClientProvider`; update all tests that use `useAuth` |
| R2 | CSS module extraction (fix #5) changes visual appearance | Side-by-side visual comparison; keep CSS variable fallbacks identical |
| R3 | RequireAuth change (fix #2) introduces loading flash on valid auth | PreloadedState already sets `'authenticated'` before first render, so `'authenticating'` branch is only visible during actual login API calls |
| R4 | `useLayoutEffect` in fix #10 causes SSR/hydration warning | The hook only runs client-side (React Query + Redux are CSR); no SSR is configured |

---

## Verification plan (post-fix)

After all commits are applied:

1. **`tsc --noEmit`** — zero errors
2. **`npx vitest run`** — all 195+ tests green (expect ~210 after coverage additions)
3. **`npx vitest run --coverage`** — ≥ 80% lines / ≥ 75% branches overall AND per-file
4. **`npx playwright test`** — E2E critical paths pass (login, auth guard, theme persist, skip-link, 404)
5. **axe-core scan** — zero `serious` or `critical` violations on `/login`, `/dashboard`
6. **Manual theme test** — toggle → page reload → preference persists
7. **Manual redirect test** — login with `?next=https://evil.com` → safe redirect to `/dashboard`
8. **Keyboard walkthrough** — Tab, Enter, Escape flows work on LoginForm, ProfileMenu, Sidebar
