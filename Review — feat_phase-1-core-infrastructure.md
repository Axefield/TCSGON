# Review — `feat/phase-1-core-infrastructure`

**99 files changed, +6,878 / −173 | Tests: 195/195 pass (30 files) | Coverage: 86.1% lines / 80.74% branches | Typecheck: 1 error (unused import)**

---

## Blocking

### 1. Theme persistence key mismatch — flash on page reload

**Files:** `src/index.html:18` ↔ `src/shared/hooks/useTheme.ts:21`

The inline flash-prevention script in `index.html` reads from `localStorage.getItem('tcsgon-theme')` (hyphen separator), but `useTheme.ts` writes to `'tcsgon:theme'` (colon separator). The script never finds the saved preference, so every page refresh falls back to the OS scheme regardless of user choice.

**Fix:** Unify the key to a single convention across both locations.

---

### 2. `RequireAuth` lets unauthenticated states through to protected content

**File:** `src/routes/RequireAuth.tsx:15`

```tsx
if (status === 'anonymous' && !isAuthenticated) {
  // redirect
}
return <Outlet />;
```

The guard only redirects the `'anonymous'` state. During `'authenticating'` or `'error'` states, it renders `<Outlet />`, meaning protected pages (Dashboard, Settings) render before authentication completes or after a failure. This is a **security concern**.

**Fix:** Only render `<Outlet />` when `status === 'authenticated'`. Show a `Spinner` for `'authenticating'`, and redirect or show an error for other states.

---

### 3. Open redirect via unvalidated `next` parameter

**File:** `src/features/auth/pages/LoginPage.tsx:27`

```tsx
const next = searchParams.get('next') ?? '/dashboard';
navigate(next, { replace: true });
```

`searchParams.get('next')` is passed directly to `navigate()` without allowlist validation. Per AGENTS.md §3 (Security): *"User-supplied URLs validated against an allowlist before navigation."* An attacker could forge a login link with `?next=https://evil.com`.

**Fix:** Validate that `next` starts with `/` and does not contain `://` before navigating.

---

### 4. Module-level mutable singleton in `useAuth`

**File:** `src/features/auth/hooks/useAuth.ts:48-65`

```ts
let _apiClient: ApiClient | null = null;

export function injectAuthApiClient(client: ApiClient): void {
  _apiClient = client;
}
```

Per AGENTS.md §5 (Forbidden): *"Hidden global state, module-level mutable singletons."* This prevents tree-shaking, complicates testing, and any component mounting before `injectAuthApiClient` is called (from `main.tsx`) will crash with a throw.

**Fix:** Inject the `apiClient` via React Context or pass it as a parameter to `useAuth`. Remove the module-level variable.

---

### 5. Inline styles instead of CSS modules

**Files:**
- `src/features/auth/components/LoginForm.tsx` — entire form uses inline `style` objects
- `src/features/auth/components/ProfileMenu.tsx` — menu positioning and appearance via inline styles

Per AGENTS.md §2 (Maintainability) and the project's consistent use of CSS Modules everywhere else (`*.module.css`), these should use CSS modules. Inline styles also cause unnecessary re-renders (new object reference per render).

**Fix:** Extract all inline styles into `.module.css` files.

---

## Non-blocking suggestions

### 6. ProfileMenu `role="listbox"` without keyboard handling

**File:** `src/features/auth/components/ProfileMenu.tsx:122`

JSDoc explicitly says *"omit `role="menu"` — use a plain `<ul>` of buttons"*, but the code applies `role="listbox"`. `role="listbox"` requires keyboard arrow navigation and `aria-activedescendant` which aren't implemented.

**Suggestion:** Either remove the role entirely (plain `<ul>`) or implement full listbox keyboard interaction.

---

### 7. Bypassed type safety via `as unknown as Session`

**File:** `src/features/auth/hooks/useAuth.ts:87,123`

```ts
dispatch(authActions.loginFulfilled(result.data as unknown as Session));
```

This double-cast bypasses compile-time safety. The API response should be validated through a Zod schema before dispatching.

**Suggestion:** Add a Zod schema validation step before casting the response data.

---

### 8. `RedirectIfAuth` returns `null` instead of rendering children

**File:** `src/routes/RedirectIfAuth.tsx:18`

When the user is not authenticated, the component returns `null`. As a layout-route guard, it should render `<Outlet />` (or `children`) to pass through to nested public routes.

**Suggestion:** Replace `return null` with `return <Outlet />`.

---

### 9. Unused `onPin` prop in Sidebar

**File:** `src/layouts/Sidebar.tsx:28`

`onPin` is destructured in the function signature but never called. The pin functionality exists in the `uiSlice` reducer but isn't wired in the component.

**Suggestion:** Either wire up the pin behavior or remove the prop.

---

### 10. `usePrefersReducedMotion` dispatches in `useEffect` — paint delay

**File:** `src/shared/hooks/usePrefersReducedMotion.ts:31`

The initial `dispatch(setReducedMotion(...))` fires after paint in `useEffect`, potentially causing a brief animation flash before the store value is synced.

**Suggestion:** Use `useLayoutEffect` or initialize the store from the `matchMedia` query directly in the preloaded state.

---

### 11. Module-level singleton in `App.tsx`

**File:** `src/App.tsx:22`

```ts
let productionRouter: RouterProviderProps['router'] | undefined;
```

Another module-level mutable singleton, same concern as #4.

**Suggestion:** Use `useRef` inside `getDefaultRouter` or restructure to avoid the outer variable.

---

### 12. React Router v7 future flags not set

**Console warning:** React Router will begin wrapping state updates in `React.startTransition` in v7, and relative route resolution within splat routes is changing.

**Suggestion:** Enable `v7_startTransition` and `v7_relativeSplatPath` future flags in `createBrowserRouter`.

---

### 13. Unused import causing TS error

**File:** `src/routes/RedirectIfAuth.test.tsx:6`

```ts
import { render, screen } from '@testing-library/react';
```

`screen` is imported but never used, causing a `noUnusedLocals` compile error (`tsc --noEmit` fails).

**Suggestion:** Remove the unused `screen` import.

---

### 14. Token stored in localStorage

**File:** `src/features/auth/slice/authPersistence.ts`

Session tokens are persisted in `localStorage`, which is accessible to any JavaScript on the same origin. This is an accepted trade-off for Phase 1.

**Suggestion:** Document as a known risk in an ADR and plan migration to HttpOnly cookies or an in-memory pattern with refresh tokens for Phase 2.

---

### 15. File-level coverage gaps below 80%

| File | Lines | Branches |
|------|-------|----------|
| `useAuth.ts` | 34.14% | 50% |
| `authPersistence.ts` | 55.55% | 33.33% |
| `client.ts` | 68.88% | 76.92% |
| `RouteFallback.tsx` | 14.28% | 100% |
| `SettingsPageStub.tsx` | 0% | 0% |

Project totals (86.1% lines, 80.74% branches) meet the gate, but these files will surface regressions when their code paths are exercised.

**Suggestion:** Add tests covering the untested branches in a follow-up commit.

---

## Required follow-ups

1. **Unify theme storage key** — pick one convention and apply to both `index.html` and `useTheme.ts`.
2. **Fix `RequireAuth` guard** — only render `<Outlet />` when `status === 'authenticated'`; show a Spinner for `'authenticating'` and redirect/error for other states.
3. **Validate `next` parameter** — add an allowlist check before navigating.
4. **Replace module-level singletons** — inject `apiClient` via Context; remove `App.tsx` module-level `productionRouter`.
5. **Migrate LoginForm and ProfileMenu inline styles** to CSS modules.
6. **Fix the unused `screen` import** in `RedirectIfAuth.test.tsx` to unblock the typecheck.

---

## Approval

**❌ BLOCKED** — Blocking items 1–5 must be resolved before merge. Items 6–15 are non-blocking but should be addressed in this phase or a follow-up commit.

### Summary

The Phase 1 architecture is sound and well-documented. The code shows careful attention to:
- **Discriminated unions** for auth state and API errors
- **Zod schemas** as the single source of truth for wire types
- **Branded types** for non-interchangeable IDs
- **Accessibility** — semantic HTML, skip links, aria attributes, keyboard handling, reduced motion
- **Route-level code splitting** via lazy loading
- **Error boundaries** at route boundaries
- **Test coverage** — 195 tests across 30 files, all passing

The blocking issues are focused — primarily the theme persistence key mismatch, the auth guard logic, the open redirect, and the module-level singletons — and should be quick to fix. Once resolved, this branch is ready for merge.
