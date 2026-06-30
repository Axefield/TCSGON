# Plan — Phase 1: Core Infrastructure

**Status:** Awaiting human review. Compiled from six subagent plans (architecture, react, typescript, testing, accessibility, performance).
**Scope:** Phase 1 of `roadmap.md` — routing, API layer, auth, theme, error handling, shell layout.
**Owning agents:** architecture → react → typescript → testing → accessibility → performance.

---

## How to read this plan

This plan is intentionally **layered**. Each section is owned by one agent and can be reviewed independently:

| § | Section | Owning agent |
|---|---|---|
| 1 | Module map (runtime) | architecture |
| 2 | Folder structure (all new/modified files) | architecture |
| 3 | Module dependencies | architecture |
| 4 | State decision | architecture |
| 5 | Routing strategy | architecture |
| 6 | API client contract | architecture |
| 7 | Theme system | architecture |
| 8 | Shell layout | architecture |
| 9 | Architecture risks | architecture |
| 10 | React component breakdown | react |
| 11 | Hook specifications | react |
| 12 | Lazy boundaries | react |
| 13 | Render strategy per route | react |
| 14 | Re-render risk register | react |
| 15 | Accessibility-implicated component shapes | accessibility |
| 16 | TypeScript contracts | typescript |
| 17 | Branded types | typescript |
| 18 | Zod schemas | typescript |
| 19 | Request/response interfaces | typescript |
| 20 | Component prop interfaces (`exactOptionalPropertyTypes`) | typescript |
| 21 | Redux slice types | typescript |
| 22 | Router route handle types | typescript |
| 23 | MSW handler types | typescript |
| 24 | TypeScript risks | typescript |
| 25 | Test inventory | testing |
| 26 | Per-module test plan | testing |
| 27 | MSW handler tests | testing |
| 28 | Test isolation rules | testing |
| 29 | Coverage targets | testing |
| 30 | E2E critical paths | testing |
| 31 | a11y E2E routes | accessibility |
| 32 | Regression test discipline | testing |
| 33 | Testing risks | testing |
| 34 | Audit-by-component matrix (WCAG 2.2 AA) | accessibility |
| 35 | Keyboard navigation map | accessibility |
| 36 | Focus management | accessibility |
| 37 | Live region inventory | accessibility |
| 38 | Color contrast | accessibility |
| 39 | Motion + animation | accessibility |
| 40 | Forms (login) | accessibility |
| 41 | Theme + color | accessibility |
| 42 | Screen reader smoke test | accessibility |
| 43 | Axe false-positive mitigations | accessibility |
| 44 | Manual a11y verification checklist | accessibility |
| 45 | Accessibility risks | accessibility |
| 46 | Bundle budget allocation | performance |
| 47 | Core Web Vitals targets | performance |
| 48 | Lazy chunk strategy | performance |
| 49 | Render performance hot paths | performance |
| 50 | Network waterfall | performance |
| 51 | Image + asset strategy | performance |
| 52 | Font strategy | performance |
| 53 | Memory + long-running concerns | performance |
| 54 | Measurement plan | performance |
| 55 | Bundle delta from Phase 0 | performance |
| 56 | Optimization recommendations | performance |
| 57 | Performance risks | performance |
| 58 | Cross-cutting verification plan | all |
| 59 | Decisions for human review | all |

---

## 1. Module map (runtime)

```
                   ┌──────────────────────────────────┐
                   │  index.html  (inline no-flash    │
                   │  script reads localStorage)      │
                   └──────────────┬───────────────────┘
                                  │ mount #root
                                  ▼
                   ┌──────────────────────────────────┐
                   │  main.tsx                        │
                   │  <StrictMode>                    │
                   │   <ReduxProvider>                │
                   │    <QueryClientProvider>         │
                   │     <ThemeSync> (useLayoutEffect)│
                   │      <RouterProvider>            │
                   │       <RootErrorBoundary>        │
                   │        <AppShell>                │
                   │         <Sidebar/> <TopBar/>     │
                   │         <main id="main">         │
                   │          <Outlet/>               │
                   │         </main>                  │
                   │         <ToastRegion/>           │
                   │        </AppShell>               │
                   │      </ThemeSync>                │
                   │     </RouterProvider>            │
                   └──────────────┬───────────────────┘
                                  │ route data loaders / useQuery
                                  ▼
   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
   │ features/auth/  │   │  routes lazy    │   │ shared/api/     │
   │  hooks, pages   │◀─▶│  index.tsx      │──▶│  client.ts      │
   └────────┬────────┘   └─────────────────┘   └────────┬────────┘
            │ token (write)                              │ fetch + retry + Zod
            ▼                                            ▼
   ┌─────────────────────────┐                ┌─────────────────────┐
   │ store/slices/authSlice  │◀─── 401 ───────│  shared/api/errors  │
   │ store/slices/uiSlice    │                │  (discriminated)    │
   └─────────────────────────┘                └─────────────────────┘
            │ persist (auth only)
            ▼
       localStorage("tcs.auth")
```

---

## 2. Folder structure (exact paths)

All new/modified files Phase 1 ships.

| Path | Action | Purpose |
|---|---|---|
| `src/main.tsx` | mod | Wire `<RouterProvider>`, `<RootErrorBoundary>`, `<ThemeSync>`; provider order Redux→RQ→Router |
| `src/App.tsx` | mod | Becomes `<RootErrorBoundary><RouterProvider/></RootErrorBoundary>`; `App.module.css` kept |
| `src/App.module.css` | mod | Shell layout primitives (grid, sidebar widths) |
| `src/routes/index.tsx` | new (replaces `index.ts`) | `createBrowserRouter([...])` tree; lazy import per route |
| `src/routes/RequireAuth.tsx` | new | Redirects unauth to `/login?next=...`; renders `<Outlet/>` |
| `src/routes/RedirectIfAuth.tsx` | new | Opposite: authed users hit `/login` get bounced to `/dashboard` |
| `src/routes/NotFoundPage.tsx` | new | 404 with `role="heading"` + home link |
| `src/routes/RootErrorBoundary.tsx` | new | Route-level boundary; reportError hook stub + retry |
| `src/routes/RouteFallback.tsx` | new | `<Spinner/>` for `<Suspense>` while lazy chunk loads |
| `src/routes/RouteErrorElement.tsx` | new | Inline error UI for `errorElement` on a route |
| `src/routes/breadcrumbs.ts` | new | Pure function `(matches) => Crumb[]`; URL is source of truth |
| `src/routes/router.tsx` | new | `createAppRouter()` factory |
| `src/routes/lazy.ts` | new | Pure re-exports of `React.lazy` factories |
| `src/layouts/AppShell.tsx` | new | Grid: sidebar / topbar / main; mounts `<ToastRegion/>` |
| `src/layouts/AppShell.module.css` | new | Responsive grid |
| `src/layouts/AuthLayout.tsx` | new | Minimal centered card layout for unauthenticated pages |
| `src/layouts/Sidebar.tsx` | new | `<nav>` with collapsible state from `uiSlice` |
| `src/layouts/Sidebar.module.css` | new | Collapse animation (gated by `prefers-reduced-motion`) |
| `src/layouts/TopBar.tsx` | new | Theme toggle, profile menu slot, breadcrumbs |
| `src/layouts/TopBar.module.css` | new | Sticky top bar styles |
| `src/layouts/SkipLink.tsx` | new | First focusable; `href="#main"`; visually hidden until focus |
| `src/layouts/SkipLink.module.css` | new | `:focus-visible` reveal |
| `src/features/auth/api/authApi.ts` | new | `useLogin`/`useLogout`/`useSession` (RQ hooks, Zod-validated) |
| `src/features/auth/api/authSchemas.ts` | new | Zod schemas: `UserSchema`, `SessionSchema`, `LoginInputSchema` |
| `src/features/auth/api/authApi.test.ts` | new | Hook tests with MSW + `renderWithProviders` |
| `src/features/auth/components/LoginForm.tsx` | new | RHF + Zod resolver, error aria-describedby, submit focus |
| `src/features/auth/components/ProfileMenu.tsx` | new | Avatar dropdown; a11y (Esc, arrow, return-focus) |
| `src/features/auth/hooks/useAuth.ts` | new | Composite selector: `status`, `user`, `isAuthed` |
| `src/features/auth/pages/LoginPage.tsx` | new | Public page; renders `<LoginForm/>` |
| `src/features/auth/pages/DashboardPage.tsx` | new | First authed page; placeholders for later features |
| `src/features/auth/pages/SettingsPageStub.tsx` | new | Stub route target |
| `src/features/auth/pages/NotFoundPage.tsx` | new | 404 page (also imported by routes) |
| `src/features/auth/slice/authSlice.ts` | new | RTK slice: `user`, `token`, `status`, `error` |
| `src/features/auth/slice/authSlice.test.ts` | new | Reducer + selector tests |
| `src/features/auth/slice/authPersistence.ts` | new | `loadAuth()` / `saveAuth()` over localStorage; schema-validated |
| `src/features/auth/index.ts` | new | Public barrel |
| `src/shared/api/client.ts` | new | `request<TIn,TOut>(...)` typed fetch wrapper |
| `src/shared/api/errors.ts` | new | Discriminated `ApiError` union + `kind` field |
| `src/shared/api/schemas.ts` | new | `defineSchema<T>()` helper + central registry export |
| `src/shared/api/queryClient.ts` | mod | Pass-through retry classifier |
| `src/shared/api/queryClient.test.ts` | mod | Add retry-classification test |
| `src/shared/api/__tests__/client.test.ts` | new | Fetch wrapper: success, 4xx, 5xx, abort, retry, validation |
| `src/shared/hooks/useTheme.ts` | new | Returns `theme` + `setTheme`; side-effect applies `data-theme` to `<html>` |
| `src/shared/hooks/usePrefersReducedMotion.ts` | new | `matchMedia('(prefers-reduced-motion: reduce)')` listener |
| `src/shared/hooks/useToast.ts` | new | `toast.success/error/info/warn` dispatching `uiSlice` actions |
| `src/shared/components/Spinner.tsx` | new | `<svg role="status" aria-label="Loading"/>`; static when reduced-motion |
| `src/shared/components/Spinner.module.css` | new | CSS `@keyframes`; disabled in reduced-motion media query |
| `src/shared/components/Skeleton.tsx` | new | Shimmer placeholder; no animation in reduced-motion |
| `src/shared/components/Toast.tsx` | new | Single toast card; `role="status"` or `role="alert"` per kind |
| `src/shared/components/Toast.module.css` | new | Slide-in (respects reduced-motion) |
| `src/shared/components/ToastRegion.tsx` | new | `aria-live="polite"`, reads `state.ui.toasts` |
| `src/shared/components/ToastRegion.module.css` | new | Fixed bottom-right stack |
| `src/store/index.ts` | mod | Register `authReducer`; install middleware; hydrate auth on boot |
| `src/store/hooks.ts` | mod | (no change to exports) |
| `src/store/middleware.ts` | new | `errorReporter`, `localStorageSync('auth')`, dev logger |
| `src/store/slices/uiSlice.ts` | mod | Add `sidebar`, `toasts`, `modals`, `reducedMotion` |
| `src/store/slices/uiSlice.test.ts` | mod | Tests for new reducers |
| `src/test/msw/handlers.ts` | new | MSW v2 handlers: `/api/auth/login`, `/api/auth/logout`, `/api/auth/session` |
| `src/test/msw/server.ts` | new | `setupServer(...handlers)` exported for Vitest setup |
| `src/test-setup.ts` | mod | `beforeAll(server.listen); afterEach(server.reset)` |
| `index.html` | mod | Inline `<script>`: read `localStorage.theme` + `prefers-color-scheme`, set `data-theme` before paint |
| `src/styles/tokens.css` | mod | Add dark palette, full spacing scale, breakpoints, motion tokens |
| `src/styles/reset.css` | mod | `prefers-reduced-motion: reduce` global overrides |
| `docs/plans/phase-1-core-infrastructure.md` | new | This plan (finalized with measured deltas post-implementation) |

---

## 3. Module dependencies

```
main.tsx
  └─▶ App.tsx
        └─▶ RootErrorBoundary
              └─▶ RouterProvider (routes/router.tsx → routes/index.tsx)
                    ├─▶ AppShell
                    │     ├─▶ SkipLink
                    │     ├─▶ Sidebar ──▶ store/slices/uiSlice
                    │     ├─▶ TopBar  ──▶ shared/hooks/useTheme
                    │     ├─▶ Outlet  ──▶ routes/* (lazy)
                    │     └─▶ ToastRegion ──▶ store/slices/uiSlice + shared/components/Toast
                    ├─▶ routes/RequireAuth ──▶ store/slices/authSlice
                    ├─▶ routes/RedirectIfAuth ──▶ store/slices/authSlice
                    ├─▶ routes/RouteFallback ──▶ shared/components/Spinner
                    ├─▶ routes/RouteErrorElement ──▶ RootErrorBoundary (visual reuse)
                    └─▶ routes/breadcrumbs (pure; no side effects)

features/auth/api/authApi
  ├─▶ shared/api/client
  ├─▶ shared/api/schemas
  ├─▶ features/auth/api/authSchemas
  └─▶ store/slices/authSlice (writes only via dispatch; no read import)

store/middleware
  ├─▶ store/slices/authSlice (reads + writes for persistence)
  └─▶ (dev only) console

shared/api/client
  ├─▶ shared/api/errors
  ├─▶ shared/api/schemas
  └─▶ store/slices/authSlice (reads `state.auth.token` via injected getToken — see Risk 1)

shared/hooks/useTheme
  ├─▶ store/slices/uiSlice
shared/hooks/useToast
  └─▶ store/slices/uiSlice

test/msw/server ──▶ test/msw/handlers ──▶ shared/api/client (URL parity)
```

**No cycles. No upward arrows.** `shared` is leaf (no feature imports). `features/*` may import `shared/*` and `store/*` but not other features. `store/middleware` is the only non-leaf that imports slices.

**Flag (not a violation):** `shared/api/client` reading `authSlice` is a slight upward edge (shared → store). Mitigation: inject a `getToken: () => string | null` resolver in `client.ts` constructor, defaulting to `() => store.getState().auth.token`. Keeps shared layer ignorant of store.

---

## 4. State decision

| State | Owner | Why |
|---|---|---|
| **Auth (user, token, status)** | Redux `authSlice` + localStorage mirror | Crosses 3+ trees (router guard, top bar avatar, every authed page) and survives reload. Justifies Redux per AGENTS.md §3. Persisted token in localStorage via middleware on every `setAuth` action; rehydrated synchronously in `store/index.ts` before `createRoot` to avoid guard flicker. |
| **Theme** | `uiSlice.theme` + `useTheme` hook + inline `index.html` script | UI-only, but needs to drive `data-theme` on `<html>` (side effect outside React) and survive reload. Redux chosen over Context because sibling `ui.toasts`/`ui.modals` already live in the slice; DevTools shows theme toggling; `useTheme` can `useAppSelector` and dispatch without prop drilling. Initial value decided by inline script and passed in via `preloadedState`. |
| **Sidebar collapsed** | `uiSlice.sidebar` | Read by Sidebar, AppShell (main offset), TopBar (mobile menu trigger) — 3 trees. Redux justified. |
| **Toasts** | `uiSlice.toasts` (array, capped at 4, FIFO) | Region renders from slice; any component dispatches via `useToast`. Crosses 3+ trees → Redux. |
| **Modals** | `uiSlice.modals` (registry by id) | Same as toasts. |
| **Server cache (auth/session, future endpoints)** | React Query | Pure server state. Slice gets a copy of `user` for synchronous guards. Never duplicate fetched data back into Redux. |

Forbidden placements avoided: no server data in slice; no Context for global UI; no Redux for purely local state (e.g., `LoginForm` keeps `isSubmitting` local).

---

## 5. Routing strategy

**Tree shape:**

```
/                      redirect: → /login (unauth) | /dashboard (auth)
/login                 RedirectIfAuth-wrapped, lazy LoginPage
/signup                RedirectIfAuth-wrapped, lazy SignupPageStub (Phase 3)
/forgot-password       RedirectIfAuth-wrapped, lazy
/                      AppShell (authed section, RequireAuth)
  ├─ /dashboard        lazy DashboardPage
  └─ /settings         lazy SettingsPageStub
*                      NotFoundPage
```

**Lazy boundaries:** every page component is `lazy(() => import('@/features/.../pages/X'))`. Route file is the only place that knows all paths.

**ErrorBoundary placement:**
- `<RootErrorBoundary>` above `<RouterProvider>` — catches provider/mount failures.
- `errorElement` on the root route → `RouteErrorElement` (graceful in-app fallback).
- `errorElement` on each lazy route → same component, scoped.

**Auth guard semantics:**
- `RequireAuth` reads `auth.status`: `loading` → render `<RouteFallback/>`; `unauthenticated` → `<Navigate to="/login" replace state={{ next: location.pathname + location.search + location.hash }} />`; `authenticated` → `<Outlet/>`.
- 401 from API: `client.ts` dispatches `authSlice.actions.sessionExpired()`; `RequireAuth` re-evaluates and redirects.

**Breadcrumbs source of truth:** URL params. `routes/breadcrumbs.ts` derives `Crumb[]` from `useMatches()`; each route's `handle.crumb` produces the label.

---

## 6. API client contract

**Signature:**

```ts
interface RequestConfig<TIn, TOut> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: TIn;
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  schema?: z.ZodType<TOut>;
  skipAuth?: boolean;
  timeoutMs?: number;
}

type RequestResult<TOut> =
  | { ok: true;  data: TOut; status: number }
  | { ok: false; error: ApiError };

async function request<TIn = void, TOut = unknown>(
  config: RequestConfig<TIn, TOut>
): Promise<RequestResult<TOut>>;
```

**Discriminated error union (`shared/api/errors.ts`):**

```ts
type ApiErrorKind = 'network' | 'timeout' | 'aborted' | 'http' | 'validation' | 'unauthorized';

type ApiError =
  | { kind: 'network';   cause?: unknown; message: string; correlationId: string }
  | { kind: 'timeout';   timeoutMs: number; message: string; correlationId: string }
  | { kind: 'aborted';   message: string; correlationId: string }
  | { kind: 'http';      status: number; body: unknown; message: string; correlationId: string }
  | { kind: 'validation'; issues: { path: string; message: string }[]; message: string; correlationId: string }
  | { kind: 'unauthorized'; loginUrl?: string; message: string; correlationId: string };
```

**Retry policy:**
- Retry: `network`, `timeout`, `http` 502/503/504 only.
- No retry: `aborted`, `http` 4xx (incl. 401), `validation`.
- Backoff: `min(30s, 500ms * 2^attempt) + jitter(0..250ms)`; max 3 attempts.
- RQ owns retry policy via `retry: (failureCount, err) => isRetriable(err) && failureCount < 3`. **One retry layer only** — `client.ts` itself retries only when `config.retry !== false` (off by default).

**Auth header injection:** `getToken: () => string | null` resolver passed to `request()` constructor. Default resolver calls `store.getState().auth.token`.

**Cancellation:** every request accepts `signal`. RQ passes its own; components use `AbortController` + cleanup. `client.ts` throws `{ kind: 'aborted' }` on `AbortError`.

---

## 7. Theme system

**`data-theme` set on `<html>` — three guards:**

1. **Inline `<script>` in `index.html`** (no-FOUC): reads `localStorage.tcsgon:theme` first, falls back to `matchMedia('(prefers-color-scheme: dark)')`. Runs before first paint.

2. **`store/index.ts` `preloadedState.ui.theme`** mirrors the inline-script decision. Slice hydration consistent.

3. **`useTheme` hook** subscribes to slice and re-applies `data-theme` on every change via `useLayoutEffect`. If mismatch with localStorage, writes back.

**`prefers-color-scheme`:** initial-paint only via inline script. Slice stores explicit `'light' | 'dark'`. "Follow system" deferred to Phase 2.

**Token expansion (`tokens.css`):**
- Full color palette light + dark (`--color-bg-elevated`, `--color-fg-inverse`, `--color-border`, `--color-success`, `--color-warning`, `--color-focus`, `--color-danger` dark-safe)
- Spacing scale: keep 4 px base, add `--space-5/10/12/16`
- Typography: full type scale, `--leading-*`, `--tracking-*`
- Breakpoints: `--bp-sm/md/lg/xl` (consumed via `@media`)
- Radii: `--radius-sm/md/lg/full`
- Shadows: `--shadow-sm/md/lg`
- Motion: `--motion-fast/base/slow` + `--motion-ease-standard`
- Toast: `--color-toast-bg/fg/success/error/info`, `--color-toast-error-border`

**`prefers-reduced-motion`:** CSS in `reset.css` (global); per-component hooks read `usePrefersReducedMotion` for behavior gating (e.g., Sidebar collapse).

---

## 8. Shell layout

**Breakpoints (`AppShell.module.css`):**
- `< 768px` (mobile): single column, sidebar = off-canvas drawer triggered by TopBar menu button
- `768–1023px` (tablet): sidebar = 64px collapsed by default, expands on hover/focus
- `≥ 1024px` (desktop): sidebar = 240px, no collapse

**Skip-link behavior:** `<SkipLink/>` is first focusable element. Visually hidden via `clip-path` until `:focus-visible`. Anchors to `<main id="main-content" tabindex="-1">` and triggers `.focus()`.

**Toast region location:** DOM last child of `<AppShell>`, after `<Outlet/>`. `aria-live="polite"` + `aria-relevant="additions"`. Errors in a separate sibling region with `role="alert"`.

---

## 9. Architecture risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | localStorage hydration race with initial render | `store/index.ts` calls `loadAuth()` **before** `configureStore`, passes `preloadedState`. No `loading` flash. |
| 2 | Theme flash on first paint | Inline script sets `data-theme` before stylesheet evaluation. `preloadedState.ui.theme` mirrors. |
| 3 | RQ retry + custom retry in fetch wrapper double-retrying | `client.ts` retry off by default; RQ owns policy. Test asserts ≤ 3 calls. |
| 4 | Toast deduplication with React 18 strict-mode double-render | `pushToast` reducer uses UUID id. Dedupe by id. Tests assert one toast, not two. |
| 5 | Bundle bloat from lazy chunks importing shared heavy deps | Add `vendor-validation` to manualChunks. CI budget check in Phase 7. |
| 6 | Auth guard redirect loops on deep links | `next` = `pathname + search + hash`; round-trip test with complex query string. |
| 7 | ErrorBoundary error swallowing in production | `componentDidCatch` calls `reportError(err, info)`. Ship console impl + Sentry-shaped signature. |
| 8 | `verbatimModuleSyntax: true` + `JSX.Element` return types | Use `import type { ReactElement }` and `: ReactElement`; ban `: JSX.Element` via ESLint. |
| 9 | `useEffect` for derived state | Selectors compute during render. `useAuth()` returns memoized `isAuthed`. |
| 10 | MSW + Vitest startup ordering | `test-setup.ts` imports server + `beforeAll(server.listen)`; `afterEach(server.reset)`. |

---

## 10. React component breakdown (high level)

Full list in the agent's output. Key signatures:

```tsx
// AppShell.tsx
export interface AppShellProps { readonly outlet?: ReactNode }
export function AppShell({ outlet }: AppShellProps): ReactElement

// SkipLink.tsx
export interface SkipLinkProps { readonly targetId?: string }
export function SkipLink({ targetId = 'main-content' }: SkipLinkProps): ReactElement

// Sidebar.tsx
export interface SidebarProps {
  readonly state: 'closed' | 'open' | 'pinned';
  readonly onToggle: () => void;
  readonly onPin: (pinned: boolean) => void;
  readonly children: ReactNode;
}
export function Sidebar(props: SidebarProps): ReactElement

// TopBar.tsx
export interface TopBarProps {
  readonly title: string;
  readonly onMenuClick: MouseEventHandler<HTMLButtonElement>;
  readonly theme: Theme;
  readonly onThemeToggle: () => void;
  readonly user: User | null;
}
export function TopBar(props: TopBarProps): ReactElement

// LoginForm.tsx
export interface LoginFormProps {
  readonly onSubmit: (input: LoginInput) => void | Promise<void>;
  readonly initialEmail?: string;
  readonly autoFocus?: boolean;
  readonly disabled?: boolean;
}
export function LoginForm(props: LoginFormProps): ReactElement

// ProfileMenu.tsx
export interface ProfileMenuProps {
  readonly user: User;
  readonly onSignOut: MouseEventHandler<HTMLButtonElement>;
  readonly align?: 'start' | 'end';
}
export function ProfileMenu(props: ProfileMenuProps): ReactElement

// Toast.tsx (compound)
export interface ToastProps {
  readonly entry: ToastEntry;
  readonly onDismiss: (id: ToastId) => void;
}
export function Toast(props: ToastProps): ReactElement
// Toast.Region / Toast.Item as compound exports

// Spinner.tsx
export interface SpinnerProps {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly label?: string;
  readonly decorative?: boolean;
}
export function Spinner({ size = 'md', label }: SpinnerProps): ReactElement

// Skeleton.tsx
export interface SkeletonProps {
  readonly width?: number | string;
  readonly height?: number | string;
  readonly radius?: number;
  readonly label?: string;
}
export function Skeleton(props: SkeletonProps): ReactElement

// RootErrorBoundary.tsx
export interface RootErrorBoundaryProps {
  readonly fallback?: ReactNode;
  readonly onError?: (e: Error, info: ErrorInfo) => void;
  readonly children: ReactNode;
}
export function RootErrorBoundary(props: RootErrorBoundaryProps): ReactElement

// RouteFallback.tsx
export interface RouteFallbackProps {
  readonly reason?: 'loading' | 'error' | 'empty';
  readonly error?: Error;
}
export function RouteFallback(props: RouteFallbackProps): ReactElement

// RequireAuth.tsx
export interface RequireAuthProps { readonly children: ReactNode }
export function RequireAuth({ children }: RequireAuthProps): ReactElement

// RedirectIfAuth.tsx
export interface RedirectIfAuthProps { readonly children: ReactNode }
export function RedirectIfAuth({ children }: RedirectIfAuthProps): ReactElement
```

**Compound components:** `Toast.Region` + `Toast.Item` exported from same module.

---

## 11. Hook specifications

```ts
export function useTheme(): {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

export function usePrefersReducedMotion(): boolean;

export function useToast(): {
  toasts: ReadonlyArray<ToastEntry>;
  push: (input: Omit<ToastEntry, 'id' | 'createdAt' | 'durationMs'> & { durationMs?: number }) => ToastId;
  dismiss: (id: ToastId) => void;
  clear: () => void;
};

export function useAuth(): {
  status: 'anonymous' | 'authenticating' | 'authenticated' | 'error';
  user: User | null;
  session: Session | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  error: string | null;
};
```

---

## 12. Lazy boundaries

| Route file | Lazy target | Imported via |
|---|---|---|
| `routes/router.tsx` | `LoginPage` | `lazy(() => import('@/features/auth/pages/LoginPage'))` |
| `routes/router.tsx` | `DashboardPage` | `lazy(() => import('@/features/auth/pages/DashboardPage'))` |
| `routes/router.tsx` | `SettingsPageStub` | `lazy(() => import('@/features/auth/pages/SettingsPageStub'))` |
| `routes/router.tsx` | `NotFoundPage` | `lazy(() => import('@/features/auth/pages/NotFoundPage'))` |

Boundary lives in `routes/lazy.ts` (one factory per route). `AppShell`, `RequireAuth`, `LoginForm` are **eager** (shell chunk).

---

## 13. Render strategy per route

| Segment | Suspense fallback | Error boundary | Loading UI | Guard |
|---|---|---|---|---|
| `/login` | `RouteFallback` (route level) | `RootErrorBoundary` | `Spinner` | `RedirectIfAuth` |
| `/dashboard` | `RouteFallback` | `RootErrorBoundary` | `Spinner` | `RequireAuth` |
| `/settings` | `RouteFallback` | `RootErrorBoundary` | `Spinner` | `RequireAuth` |
| `*` (404) | none (synchronous) | `RootErrorBoundary` | n/a | Neither |

---

## 14. Re-render risk register

- **`ToastRegion`** subscribes to `state.ui.toasts`. Mitigation: stable selector with shallow equality; cap to 4 toasts FIFO. No `React.memo` (selector isolation is cheaper).
- **`AppShell`** no slice subscription — safe. No memoization.
- **`Sidebar` collapse** — state in `uiSlice`; siblings don't observe it. No preemptive `memo`.
- **`ProfileMenu` open/close** — local `useState`. No memo.
- **`LoginForm`** — RHF-controlled; parent passes only `onSubmit` + `defaultValues`. `onSubmit` wrapped in `useCallback` in `LoginPage`. No memo on form.

**Rule:** `React.memo` only with measured benefit.

---

## 15. Accessibility-implicated component shapes (highlights)

- **`SkipLink`** — first focusable; visually hidden via `clip-path` until `:focus-visible`; `href="#main-content"`; activates target with `focus()`.
- **`ToastRegion`** — `role="region"` + `aria-live="polite"` + `aria-label="Notifications"`; portal to `document.body`. `Toast` per kind: `role="status"` (info/success) or `role="alert"` (error). Errors in separate sibling region with `role="alert"` to avoid double-announcement.
- **`Spinner`** — `role="status"` + visually-hidden label; SVG `aria-hidden="true"`.
- **`ProfileMenu`** — trigger: `<button aria-haspopup="menu" aria-expanded={open} aria-controls={menuId}>`. **Decision:** omit `role="menu"` and use plain `<ul>` of buttons — fewer traps, same a11y. Documented in JSDoc.
- **`LoginForm`** — `<form noValidate>`, `<label htmlFor>` on every input. Errors via `aria-describedby` + `aria-invalid="true"`. Submit `aria-busy={isSubmitting}`. Error summary `<div role="alert" tabindex="-1">` focused on failure.
- **`AppShell`** — semantic `<aside>` (sidebar), `<header>` (topbar), `<main id="main-content" tabIndex={-1}>`, `<nav aria-label="Primary">`. Single h1 per route.
- **`RootErrorBoundary`** — `role="alert"`, retry + go-home buttons. Stack traces hidden in prod.

---

## 16. TypeScript contracts — discriminated unions

```ts
export type AuthState =
  | { readonly kind: 'anonymous' }
  | { readonly kind: 'authenticating' }
  | { readonly kind: 'authenticated'; readonly user: User; readonly session: Session }
  | { readonly kind: 'error'; readonly error: string; readonly user: User | null };

export type ApiErrorKind =
  | 'network' | 'timeout' | 'aborted' | 'http' | 'validation' | 'unauthorized';

export type ApiError =
  | (ApiErrorBase & { kind: 'network';    cause?: unknown })
  | (ApiErrorBase & { kind: 'timeout';    timeoutMs: number })
  | (ApiErrorBase & { kind: 'aborted' })
  | (ApiErrorBase & { kind: 'http';       status: number; body: unknown })
  | (ApiErrorBase & { kind: 'validation'; issues: ReadonlyArray<{ path: string; message: string }> })
  | (ApiErrorBase & { kind: 'unauthorized'; loginUrl?: string });

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export type AsyncStatus =
  | { kind: 'idle' }
  | { kind: 'loading'; sinceMs: number }
  | { kind: 'success'; data: unknown; at: number }
  | { kind: 'error'; error: ApiError };
```

Exhaustive narrowing pattern uses `assertNever(x): never` in every `default` branch.

---

## 17. Branded types

```ts
declare const __brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type UserId    = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type ToastId   = Brand<string, 'ToastId'>;

export function asUserId(s: string): UserId    { return s as UserId; }
export function asSessionId(s: string): SessionId { return s as SessionId; }
export function asToastId(s: string): ToastId   { return s as ToastId; }
export function newUserId(): UserId       { return crypto.randomUUID() as UserId; }
export function newSessionId(): SessionId { return crypto.randomUUID() as SessionId; }
export function newToastId(): ToastId     { return crypto.randomUUID() as ToastId; }
```

---

## 18. Zod schemas (source of truth for entities)

```ts
export const UserSchema = z.object({
  id:    z.string().min(1).transform(asUserId),
  name:  z.string().min(1).max(120),
  email: z.string().email(),
});
export type User = z.infer<typeof UserSchema>;

export const SessionSchema = z.object({
  id:        z.string().min(1).transform(asSessionId),
  user:      UserSchema,
  token:     z.string().min(20),
  expiresAt: z.string().datetime(),
});
export type Session = z.infer<typeof SessionSchema>;

export const LoginInputSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8).max(200),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;
```

Hand-written `interface User` is forbidden when `UserSchema` exists.

---

## 19. Request/response interfaces

```ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig<TIn, TOut> {
  readonly method: HttpMethod;
  readonly path: string;
  readonly body?: TIn;
  readonly params?: Readonly<Record<string, string | number | boolean>>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
  readonly skipAuth?: boolean;
  readonly schema?: z.ZodType<TOut>;
  readonly timeoutMs?: number;
}

export type RequestResult<TOut> =
  | { readonly ok: true;  readonly data: TOut; readonly status: number }
  | { readonly ok: false; readonly error: ApiError };

export async function request<TIn = void, TOut = unknown>(
  config: RequestConfig<TIn, TOut>
): Promise<RequestResult<TOut>>;
```

---

## 20. Component prop interfaces (`exactOptionalPropertyTypes`)

All interfaces use `readonly` and avoid `| undefined` (the flag makes `?:` mean "absent OR `T`", not "absent OR `T | undefined`"):

```ts
interface RootErrorBoundaryProps {
  readonly fallback?: ReactNode;
  readonly onError?: (e: Error, info: ErrorInfo) => void;
  readonly children: ReactNode;
}
interface AppShellProps { readonly children: ReactNode; readonly skipToContentId?: string }
interface AuthLayoutProps { readonly children: ReactNode; readonly heading: string; readonly subheading?: string }
interface LoginFormProps {
  readonly onSubmit: (input: LoginInput) => void | Promise<void>;
  readonly initialEmail?: string;
  readonly autoFocus?: boolean;
  readonly disabled?: boolean;
}
interface ProfileMenuProps {
  readonly user: User;
  readonly onSignOut: MouseEventHandler<HTMLButtonElement>;
  readonly align?: 'start' | 'end';
}
interface SidebarProps {
  readonly state: 'closed' | 'open' | 'pinned';
  readonly onToggle: () => void;
  readonly onPin: (pinned: boolean) => void;
  readonly children: ReactNode;
}
interface TopBarProps {
  readonly title: string;
  readonly onMenuClick: MouseEventHandler<HTMLButtonElement>;
  readonly theme: Theme;
  readonly onThemeToggle: () => void;
  readonly user: User | null;
}
interface ToastProps { readonly entry: ToastEntry; readonly onDismiss: (id: ToastId) => void }
interface SpinnerProps { readonly size?: 'sm' | 'md' | 'lg'; readonly label?: string; readonly decorative?: boolean }
interface SkeletonProps { readonly width?: number | string; readonly height?: number | string; readonly radius?: number; readonly label?: string }
interface SkipLinkProps { readonly targetId: string; readonly children: ReactNode }
interface RouteFallbackProps { readonly reason?: 'loading' | 'error' | 'empty'; readonly error?: Error }
```

---

## 21. Redux slice types

`authSlice` reducers: `loginRequested`, `loginFulfilled`, `logout`, `authFailed`, `rehydrate`.

`uiSlice` reducers (extended): `setTheme`, `toggleTheme`, `setSidebar`, `toggleSidebar`, `pushToast`, `dismissToast`, `clearToasts`, `openModal`, `closeModal`, `setReducedMotion`.

Exhaustive narrowing enforced via `assertNever(x): never` in `default` branches.

---

## 22. Router route handle types

```ts
export interface RouteHandle {
  readonly crumb?: (params: Readonly<Record<string, string | undefined>>) => string;
  readonly title?: string;
  readonly icon?: ReactNode;
  readonly requiresAuth?: boolean;
}

export interface Breadcrumb { readonly label: string; readonly path: string }

export function deriveBreadcrumbs(
  pathname: string,
  routes: ReadonlyArray<{ path: string; handle?: RouteHandle }>
): ReadonlyArray<Breadcrumb>;
```

---

## 23. MSW handler types (v2)

```ts
import { http, HttpResponse, type HttpHandler } from 'msw';
export const handlers: ReadonlyArray<HttpHandler> = [
  http.post('/api/auth/login', async ({ request }) => {
    const json: unknown = await request.json();
    const parsed = LoginInputSchema.safeParse(json);
    if (!parsed.success) return HttpResponse.json({ kind: 'validation', ... }, { status: 400 });
    const session = await fakeSignIn(parsed.data);
    return HttpResponse.json(SessionSchema.parse(session), { status: 200 });
  }),
  // ...
];
```

---

## 24. TypeScript risks

1. `verbatimModuleSyntax: true` + `import type` enforcement — all type imports must use `import type`.
2. `exactOptionalPropertyTypes` foot-guns — re-enabling `| undefined` defeats the flag.
3. `noUncheckedIndexedAccess` + Zod-parsed arrays — `tags[0]` is `T | undefined`.
4. `useUnknownInCatchVariables` — narrow `err: unknown` via `instanceof Error` or `ApiError` discriminator.
5. Discriminated union exhaustiveness via `assertNever`.
6. Branded type ergonomic cost — apply only to IDs that cross trust boundaries.
7. `z.infer` vs `interface` — Zod is SOT for entities; hand-written `interface` for UI-internal props only.
8. `readonly` deep immutability — RTK Immer handles slices; raw arrays use `ReadonlyArray<T>`.
9. Zod `discriminatedUnion` vs `union` — use `discriminatedUnion` only when all variants share the literal key.
10. `import type` cycles — barrels re-exporting types can create value-level cycles.

---

## 25. Test inventory

| Type | Files | Tests |
|---|---|---:|
| Unit (Vitest) | 22 | ~118 |
| Integration (Vitest + RTL + MSW) | 4 | ~14 |
| E2E (Playwright) | 8 | ~22 |
| a11y (axe @a11y tag) | 4 routes × 6 tag sets | 24 assertions |

Key unit suites: `client.test.ts` (11 tests covering every error kind), `authSlice.test.ts`, `uiSlice.test.ts` extensions, `useAuth/useTheme/useToast/usePrefersReducedMotion.test.tsx`, `LoginForm.test.tsx`, `ProfileMenu.test.tsx`, `RequireAuth.test.tsx`, `AppShell.test.tsx`, `SkipLink.test.tsx`, `Sidebar.test.tsx`, `ToastRegion.test.tsx`.

---

## 26. Per-module test plan (highlights)

Full table in testing-agent output. Highlights:

- `client.test.ts` — success, 4xx, 5xx, abort, retry ≤ 3, Zod validation, 401, network, timeout, schema-mismatch, Authorization header, X-Request-Id, custom headers.
- `authSlice.test.ts` — loginRequested, loginFulfilled, logout, authFailed, rehydrate, selectors.
- `uiSlice.test.ts` extensions — theme, sidebar, pushToast/dismissToast (cap 4), openModal/closeModal, setReducedMotion.
- `middleware.test.ts` — localStorageSync, errorReporter, devLogger.
- `useTheme.test.tsx` — returns tuple, applies data-theme, localStorage round-trip.
- `useAuth.test.tsx` — status transitions, login dispatch+navigate, logout, refresh.
- `RequireAuth.test.tsx` — redirects with `?next=`, renders Outlet, loading state.
- `AppShell.test.tsx` — skip-link is first DOM node, sidebar+topbar+main+ToastRegion mounted.

---

## 27. MSW handler tests

| Handler | Happy | 4xx | 5xx | Schema validation |
|---|---|---|---|---|
| `POST /api/auth/login` | `200 { user, token, expiresAt }` | `401 invalid_credentials`, `400 validation` | `500 internal` | Validates body via shared `LoginInputSchema` |
| `POST /api/auth/logout` | `204` | `401 unauthenticated` | `503 unavailable` | No body; reads `Authorization` header |
| `GET /api/auth/session` | `200 { user }` | `401 expired`, `401 invalid` | `500` | Validates response via `SessionSchema` |

---

## 28. Test isolation rules

- Per-test `QueryClient` via `renderWithProviders` (already in Phase 0).
- Per-test store instance — replace `store` with `createTestStore()` helper.
- MSW `server.resetHandlers()` in `afterEach`; `beforeAll(listen)` / `afterAll(close)`.
- `localStorage.clear()` in `beforeEach`.
- Effects must be idempotent under StrictMode.
- `vi.useFakeTimers()` for toast auto-dismiss; `vi.stubGlobal('crypto', …)` for deterministic UUIDs.
- Portal cleanup relies on RTL `cleanup()` (already in `test-setup.ts`).

---

## 29. Coverage targets

- **Phase 1 total:** ≥ 80% lines / 75% branches / 80% functions (CI gate).
- **Per-folder stretch:** shared/api ≥ 90%, store ≥ 85%, routes ≥ 80%, features/auth ≥ 80%, layouts ≥ 75%, shared/components ≥ 80%.
- **Must-be-100%:** `client.ts`, `authSlice.ts`, `uiSlice.ts`, `middleware.ts`, `errors.ts`.
- **Exempt:** `main.tsx`, `vite-env.d.ts`, `test-utils.tsx`, `test-setup.ts`, MSW infra, stories, `*.test.*`, `e2e/**`, type-only re-exports.

---

## 30. E2E critical paths

| Journey | Assertions |
|---|---|
| Login happy | URL → `/dashboard`; user name visible; `localStorage.auth` has token; axe passes |
| Login 401 | stays `/login`; `role="alert"` shows error; `aria-invalid="true"` on email; focus on alert |
| Auth guard | unauthed `/dashboard` → `/login?next=%2Fdashboard`; after login lands on `/dashboard` |
| Theme persist | toggle → reload → `data-theme="dark"`; `aria-pressed="true"` on toggle |
| Sidebar persist | collapse → reload → `data-collapsed="true"`; `aria-current` reflects active route |
| Toast | visible `role="status"`; auto-dismisses; no leaked timers |
| Skip-link | first Tab → skip-link; Enter → focus `#main`; `tabindex="-1"` |
| 404 | heading "404"; link to `/`; dashboard chunk not mounted |
| Lazy chunk | `/dashboard` cold → network request for `DashboardPage-*.js`; second visit uses cache |

---

## 31. a11y E2E routes

4 routes × 6 tag sets = **24 axe assertions**: `/login`, `/dashboard`, `/` (redirect), `/404` × `{wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice}`.

Failures of `serious` or `critical` severity block merge.

---

## 32. Regression test discipline

- **Location:** co-located `<module>.regression.test.ts(x)` or escalated to `src/__tests__/regressions/<ticket-id>.test.tsx`.
- **Header block (mandatory):** `Regression: <ticket-id>` + Bug + Root cause + Fix + Added date.
- **Red-first protocol:** PR shows test failing on `main` and passing on fix branch.
- **Index:** `src/__tests__/REGRESSIONS.md` lists all regressions.
- **No expiry:** never deleted when bug fixed; only when underlying behavior is removed by ADR.

---

## 33. Testing risks

1. Async `act()` warnings around RQ + dispatch.
2. RTL `cleanup()` not running if test forgets `renderWithProviders`.
3. MSW handler-not-registered on first test.
4. Playwright `webServer` race (preview starts before build).
5. Lazy-chunk assertions flaking under parallel workers.
6. localStorage clear not flushing before store rehydrate.
7. `Date.now()` / `crypto.randomUUID()` in render making snapshots unstable.
8. Flaky `prefers-reduced-motion` tests (jsdom lacks `matchMedia` — mock in `test-setup.ts`).
9. Theme persistence race in mount effects.
10. Portal-driven `ToastRegion` duplication under StrictMode.
11. MSW unhandled request warnings (`onUnhandledRequest: 'error'` in dev, `'warn'` in CI).

---

## 34. Audit-by-component matrix (WCAG 2.2 AA)

| Component | WCAG SC | Pattern | Pitfalls |
|---|---|---|---|
| AppShell | 1.3.1, 2.4.1, 4.1.2 | `<header>`+`<nav>`+`<main>`+`<aside>`; SkipLink first | One `<main>` per route; no nested landmarks |
| SkipLink | 2.4.1, 2.4.7 | `<a href="#main">` visually hidden until focus; target `tabindex="-1"` | Don't `display:none`; ensure focus ring |
| Sidebar | 1.3.1, 2.1.1, 2.4.6, 4.1.2 | `<aside>`+`<nav>`+`<ul>/<li>/<a>`; collapse button `aria-expanded` | `aria-current` only on active item |
| TopBar | 1.3.1, 2.4.6, 4.1.2 | `<header>` + theme toggle `aria-pressed` + ProfileMenu trigger `aria-haspopup` | Two `<h1>` per page fails `page-has-heading-one` |
| ToastRegion | 4.1.3, 1.3.1 | `role="region" aria-live="polite"` + per-toast `role="status"` / sibling `role="alert"` for errors | Mount once at boot; no double-announcement |
| Spinner | 1.3.1, 4.1.2 | `role="status"` + visually-hidden label + `aria-hidden` SVG | Never `role="progressbar"` for indeterminate |
| Skeleton | 1.3.1, 1.4.1, 2.2.2 | Decorative: `aria-hidden`; meaningful: `role="status"` | Shimmer respects reduced-motion |
| ProfileMenu | 1.3.1, 2.1.1, 2.1.2, 4.1.2 | Trigger `aria-haspopup aria-expanded aria-controls`; **omit `role="menu"`** — use plain `<ul>` of buttons | If using `role="menu"`, full ARIA menu pattern required |
| LoginForm | 1.3.1, 3.3.1, 3.3.2, 3.3.3, 4.1.2 | `<form noValidate>` + `<label htmlFor>` + error summary `role="alert"` focused on failure | Required + invalid state announcement; autocomplete attributes |
| DashboardPage | 1.3.1, 2.4.2, 2.4.6 | `<main><h1>Dashboard</h1>` | Single h1; sign-out reachable |
| RootErrorBoundary | 4.1.3, 3.3.4, 2.2.1 | `role="alert"` + retry + go-home | No stack traces in prod; reset remounts |
| Theme / data-theme | 1.4.3, 1.4.11 | Inline script for initial paint; Redux + `useLayoutEffect` for changes | User override beats system; `forced-colors` fallbacks |

---

## 35. Keyboard navigation map

| Element | Tab order | Activation | Focus-visible |
|---|---|---|---|
| SkipLink | 1st | Enter → focus `#main` | 2px `var(--color-focus)` ≥3:1 |
| Sidebar collapse | After SkipLink | Enter/Space → `aria-expanded` | Same |
| Sidebar nav items | DOM order | Enter activates NavLink | Same |
| TopBar menu (mobile) | After TopBar branding | Enter/Space toggles Sidebar | Same |
| TopBar theme toggle | Following menu | Enter/Space → `aria-pressed` | Same |
| ProfileMenu trigger | Next | Enter/Space opens | Same |
| ProfileMenu items | Plain `<ul>` of buttons — Tab exits normally | Enter activates; Escape closes + returns focus | Same |
| Login email | First form control | Type | Native + custom ring |
| Login password | Second | Type; Enter submits | Same |
| Login submit | Third | Enter/Space; `disabled` + `aria-busy` while pending | Disabled must keep ring OR move focus |
| ErrorBoundary reset | After heading | Enter retries | Same |

---

## 36. Focus management

| Transition | Source | Target | When |
|---|---|---|---|
| Route navigation | Trigger | `<main tabindex="-1">` via route effect | On `useLocation` change |
| ProfileMenu open | Trigger | First item (or trigger keeps focus) | On open |
| ProfileMenu close | Trigger or item | Trigger | On Escape / outside click |
| Login error | Submit | `<div role="alert" tabindex="-1">` | On submit failure |
| Error summary link | Link | Invalid input + `scrollIntoView` | On Enter |
| ToastRegion | n/a | (no focus steal) | Never |
| ErrorBoundary retry | Reset button | First heading of remounted route | On success |
| Auth expiry | Any | `/login` main + "Session expired" toast | On 401 from any fetch |

---

## 37. Live region inventory

| Region | Politeness | Triggers |
|---|---|---|
| ToastRegion (info/success) | polite | `useToast.info()`, `useToast.success()` |
| ToastRegion (error) | assertive (separate region, `role="alert"`) | `useToast.error()` |
| Login form error summary | assertive (`role="alert"`) | Submit with invalid fields |
| RootErrorBoundary | assertive (`role="alert"`) | Uncaught render error |

All regions mounted at AppShell boot — never conditionally.

---

## 38. Color contrast

Computed ratios (WCAG luminance):

| Pair | Light | Dark | SC |
|---|---|---|---|
| `--color-fg` on `--color-bg` | 18.1:1 | 14.7:1 | 1.4.3 ✓ |
| `--color-fg-muted` on `--color-bg` | 4.83:1 | 6.71:1 | 1.4.3 ✓ |
| `--color-primary` on `--color-bg` | 11.0:1 | 5.94:1 | 1.4.3 ✓ |
| `--color-danger` on `--color-bg` (current) | 4.53:1 | **3.39:1 ❌** | Dark fails — replace with `#fca5a5` (8.6:1) |
| Focus ring (`--color-focus`) | needs ≥3:1 against all bgs | needs ≥3:1 | 1.4.11 ✓ |

**Token additions:** `--color-focus`, `--color-toast-*`, dark-safe `--color-danger`, `--color-border`.

---

## 39. Motion + animation

| Animation | CSS class | Reduced-motion fallback |
|---|---|---|
| Toast slide-in | `.toast[data-state="open"]` | `transition: none` |
| Sidebar collapse | `.sidebar[data-collapsed="true"]` width transition | Instant swap |
| Theme transition | Per-element color/bg only — **never on `<html>`** | N/A |
| Spinner rotation | `.spinner` keyframes | `animation: none` |
| Skeleton shimmer | `.skeleton::after` keyframes | Static muted bg |

---

## 40. Forms (login)

- `<label htmlFor>` on every input.
- Required: `aria-required="true"` + visible `*` or legend.
- Invalid: `aria-invalid="true"` + `aria-describedby` → error text.
- Error summary: `role="alert"` + `tabindex="-1"` + links to invalid fields.
- Submit: `disabled={isSubmitting}` + `aria-busy={isSubmitting}`.
- Autocomplete: `autoComplete="email"`, `autoComplete="current-password"` (not `password`).
- CapsLock warning optional via `getModifierState("CapsLock")`.

---

## 41. Theme + color

- Initial paint via inline `<script>` reading `localStorage.tcsgon:theme` then `prefers-color-scheme`.
- User override: TopBar toggle. Persists to `tcsgon:theme`. Values: `"light" | "dark" | "system"`.
- `useTheme` reads Redux; `useLayoutEffect` syncs `data-theme` to `<html>`.
- `forced-colors` (Windows High Contrast) override: `Canvas`/`CanvasText`/`LinkText`/`Highlight`/`Mark` tokens.

---

## 42. Screen reader smoke test (first announcement per route)

- `/login`: title "Sign in — TCSgon" → h1 "Sign in" → email field label → password field label → Sign in button.
- `/dashboard`: title "Dashboard — TCSgon" → skip-link → TopBar banner → Sidebar nav (current page) → main h1 "Dashboard".
- `/404`: title "Page not found — TCSgon" → h1 "404 — Page not found" → "Return home" link.

---

## 43. Axe false-positive mitigations

| Rule | Fix |
|---|---|
| `color-contrast` on placeholder | Use a token that passes 4.5:1 (not opacity) |
| `region` (landmark missing) | AppShell renders `<header>`+`<nav>`+`<main>`; every route is `<main>` |
| `heading-order` | Semantic `<h1>`–`<h6>`; AppShell branding is `<span>`, not `<h*>` |
| `aria-valid-attr` | ESLint `jsx-a11y/no-invalid-aria-attrs` |
| `page-has-heading-one` | Single h1 per route; Vitest assertion: every route renders exactly one h1 |
| `duplicate-id` | Generate ids with `useId()` |

---

## 44. Manual a11y verification checklist

- [ ] Tab walk — focus order matches DOM order; skip-link is first
- [ ] Skip-link → focus `<main>`; URL hash updates
- [ ] Activate every button → expected action fires
- [ ] Escape closes menus; focus returns to trigger
- [ ] NVDA on `/login` — hear field labels on focus; error summary announced on submit fail
- [ ] VoiceOver on `/dashboard` — VO+U rotor lists landmarks; navigate past sidebar
- [ ] Zoom 200%/400% — no horizontal scroll on body
- [ ] High-contrast mode (Windows) — focus ring visible, borders preserved
- [ ] `prefers-reduced-motion` toggle — no spinner rotation, no skeleton shimmer, no toast slide
- [ ] Keyboard-only sign-out — Tab → ProfileMenu → Enter → Arrow down → Enter → redirect
- [ ] Form re-focus on error — focus lands on error summary; link activates invalid field
- [ ] Toast non-interactivity — no focus steal; auto-dismiss doesn't move focus
- [ ] 404 via keyboard — heading announced, "Return home" link reachable

---

## 45. Accessibility risks

1. `aria-live` region mounted too late → first toast missed. Mitigation: mount region at AppShell boot.
2. Toast auto-dismiss stealing focus if accidentally focusable. Mitigation: toasts are live-only, never focusable.
3. Modal trap edge cases (Phase 2+). Mitigation: not needed Phase 1; pattern reserved.
4. Theme toggle contrast in dark mode (`--color-danger` fails). Mitigation: dark-safe token.
5. Skip-link target missing `tabindex="-1"`. Mitigation: explicit `<main id="main-content" tabindex="-1">`.
6. `prefers-reduced-motion` CSS specificity. Mitigation: lint rule forbidding `!important` outside `reset.css`.
7. `aria-current="page"` on sidebar wrapper. Mitigation: only on active `<a>`.
8. Double-announcement with `role="alert"` inside `aria-live` parent. Mitigation: separate sibling region for errors.
9. ProfileMenu `role="menu"` partial implementation. Mitigation: omit `role="menu"`, plain `<ul>` of buttons.
10. Auth expiry redirect focus loss. Mitigation: announce "Session expired" assertive toast before navigation.

---

## 46. Bundle budget allocation

| Chunk | Warn (kB gzip) | Error (kB gzip) | Contents |
|---|---:|---:|---|
| `vendor-react` | 140 | 220 | `react`, `react-dom`, `react-router-dom` |
| `vendor-state` | 35 | 60 | RTK, react-redux, react-query |
| `vendor-validation` (NEW) | 30 | 55 | Zod, RHF, `@hookform/resolvers` |
| `index` (app shell) | 12 | 25 | main, App, routes tree, providers, AppShell + sub-components, hooks, auth+ui slices, typed fetch, theme system, CSS |
| `LoginPage` (lazy) | 6 | 12 | LoginForm + schemas + page wrapper |
| `DashboardPage` (lazy) | 6 | 12 | Page wrapper + heading + placeholder |
| `SettingsPageStub` (lazy) | 2 | 4 | Stub |
| `NotFoundPage` (lazy) | 2 | 4 | Static markup |
| **Initial total** | **220** | **365** | vendor-react + vendor-state + vendor-validation + index |

---

## 47. Core Web Vitals targets

| Route | LCP | INP p75 | CLS | TBT | LCP element |
|---|---:|---:|---:|---:|---|
| `/login` | < 2.0s | < 150ms | < 0.05 | < 150ms | `<h1>` "Sign in" |
| `/dashboard` | < 2.5s | < 200ms | < 0.1 | < 200ms | `<h1>` "Dashboard" |
| `/` (redirect) | < 1.5s | < 100ms | 0 | < 100ms | n/a — track TTR < 300ms |

---

## 48. Lazy chunk strategy

- `LoginPage` chunk: page + LoginForm + schemas only. RHF + Zod in `vendor-validation`.
- `DashboardPage` chunk: page wrapper + heading + placeholder. ~2–3 kB on top of vendor.
- Any dep imported by ≥ 2 lazy chunks OR by `index` → vendor chunk.

---

## 49. Render performance hot paths

- **ToastRegion** — stable selector + shallow equality + 4-toast FIFO cap. No `React.memo`.
- **Sidebar collapse** — CSS `transform` only; `will-change` during animation; reduced-motion skips entirely.
- **useAuth** — selector returns primitive `isAuthenticated` + stable `user` reference (createSelector).
- **Theme toggle** — single `setAttribute` on `<html>`; no `transition: all` on tokens.
- **ProfileMenu** — render once with `hidden`/`aria-expanded`; no conditional children.
- **LoginForm submit** — `useTransition` around onSubmit.

---

## 50. Network waterfall

1. `index.html` (with `<link rel="modulepreload">` for vendor chunks)
2. CSS (reset, tokens, route CSS — `cssCodeSplit: true`)
3. `vendor-react` (~44 kB gzip)
4. `vendor-state` (~19 kB gzip)
5. `vendor-validation` (~21 kB gzip)
6. `index` (~10 kB gzip)
7. Lazy page chunk (3–5 kB gzip)
8. RQ queries — none in Phase 1

Preload targets: `modulepreload` for vendor chunks (auto by Vite); no preload for lazy chunks.

---

## 51. Image + asset strategy (Phase 2+ preview)

- AVIF → WebP → PNG fallback via `<picture><source type="image/avif">`.
- `srcset` at 1×/2×/3×.
- `loading="lazy"` + `decoding="async"` below-fold; LCP image `loading="eager" fetchpriority="high"`.
- Inline SVG icons via SVGR (no icon fonts).

---

## 52. Font strategy

- Phase 1: system fonts only (no font request, no FOUT, no CLS).
- Phase 2+: `@fontsource/<family>`, self-host, subset Latin, `font-display: swap`, preload 1–2 weights above the fold, `size-adjust`/`ascent-override` to prevent CLS.

---

## 53. Memory + long-running concerns

| Concern | Verification |
|---|---|
| ToastRegion `setTimeout` cleanup | Unit test: render → queue → unmount → advance timers → no dispatch |
| `useAuth.login` mid-unmount | `AbortController` per call; RQ `signal`; mutation hook ignores result post-unmount |
| MSW handler registration | `beforeAll(listen)` / `afterEach(reset)` / `afterAll(close)` |
| `matchMedia` listener cleanup | Unit test asserts `removeEventListener` called |
| StrictMode double-invoke | All effects idempotent; queue uses UUID id |
| ResizeObserver on Sidebar | Prefer CSS-only collapse; if JS, `disconnect()` on cleanup |

---

## 54. Measurement plan

**Pre-merge (every PR):**

1. `pnpm build` — assert all chunks within budget (§46).
2. `pnpm build:analyze` — `dist/stats.html` shows expected contributors.
3. `pnpm test:coverage` — 80/75/80 still met.

**Manual perf pass per route:**

4. `pnpm preview` → DevTools Performance → CPU 4×, Slow 4G.
5. 5 interactions per route — long-task gate: no main-thread task > 50ms.

**Phase 6 Lighthouse CI assertions** (deferred): `lcp<2500`, `inp<200`, `cls<0.1`, `total-byte-weight<250000`, `unused-javascript<5000`.

---

## 55. Bundle delta from Phase 0

| Chunk | Phase 0 (kB gzip) | Phase 1 est. (kB gzip) | Δ |
|---|---:|---:|---:|
| `vendor-react` | 43.17 | 44 | +0.83 |
| `vendor-state` | 18.26 | 19 | +0.74 |
| `vendor-validation` | — | 21 | +21 (NEW) |
| `index` | 1.06 | 10 | +8.94 |
| CSS (initial) | 0.91 | 3 | +2.09 |
| **Initial total** | **~63** | **~97** | **+34** |
| `LoginPage` lazy | — | 5 | (lazy) |
| `DashboardPage` lazy | — | 3 | (lazy) |

**Within budget:** initial 97 kB is 52% under the 200 kB warn / 72% under the 350 kB error budget.

---

## 56. Optimization recommendations

**None required.** No preemptive `React.memo`, `useMemo`, or `useCallback` without measured reason. No Zod tree-shaking hacks. No replacing RHF.

---

## 57. Performance risks

1. Lazy chunk 404 on missing preconnect — Vite emits hashed filenames + modulepreload for entry graph.
2. Pre-existing bundles grow when lazy chunks import from them — verify with `pnpm build:analyze`.
3. MSW leaks into production — gated behind `import.meta.env.DEV`; CI asserts `dist/` does not contain `msw` strings.
4. Theme transition animating `<html>` cascades — no transition on `[data-theme]` selector itself.
5. ToastRegion `setTimeout` cleanup — unit test asserts; 4-toast FIFO cap.
6. `useAuth.login` race on double-click — RHF `isSubmitting` disables button; integration test asserts single mutation.
7. Vite `manualChunks` drift — unit test imports `vite.config.ts` and asserts each entry resolves.
8. `ProfileMenu` focus trap interfering with SR virtual cursor — manual NVDA pass.
9. DevTools React Profiler overhead hides real perf — always measure on `pnpm preview` build.
10. `data-theme` attribute write triggers reflow on large trees — wrap in `requestAnimationFrame`; debounce rapid toggles.
11. Zod schema duplication — co-locate in `src/shared/api/schemas/` as SOT.

---

## 58. Cross-cutting verification plan

```bash
pnpm lint                  # 0 errors / 0 warnings
pnpm typecheck             # 0 errors
pnpm test:coverage         # ≥ 80/75/80, must-be-100% files all 100%
pnpm build                 # all chunks within budget (§46)
pnpm build:analyze         # verify vendor chunks + MSW exclusion
pnpm e2e                   # all 8 specs pass
pnpm axe                   # all 4 routes × 6 tags zero critical/serious
```

**Manual smoke checklist:**

- [ ] App loads, no FOUC on theme
- [ ] `/` redirects to `/login` (no token) or `/dashboard` (with token)
- [ ] Deep link `/dashboard?foo=bar` → login → redirects back with `?foo=bar` intact
- [ ] Theme toggle persists across reload
- [ ] Sidebar collapse persists; `prefers-reduced-motion` skips animation
- [ ] Tab → skip-link → Enter → focus `#main`
- [ ] Trigger a 500 → toast appears, `aria-live` announces
- [ ] Hard reload on `/dashboard` (authed) → no "logged out" flash
- [ ] Escape in profile menu closes it; focus returns to trigger
- [ ] `pnpm build && pnpm preview` — no chunk 404s; network shows separate chunks per route

---

## 59. Decisions for human review

Before implementation, the human engineer should confirm:

1. **Compound `Toast.Region` + `Toast.Item`** — Yes (idiomatic ARIA pair). `AppShell` as compound is **rejected**.
2. **`role="menu"` on ProfileMenu** — **Omit**; use plain `<ul>` of buttons. Fewer traps, same a11y. Document choice in JSDoc.
3. **`<main id="main-content">`** — Stable ID `main-content` (was `main` in some sketches; `main-content` avoids colliding with element name in HTML if a child also has `id="main"`).
4. **`vendor-validation` chunk** — Confirmed; includes Zod + RHF + `@hookform/resolvers`.
5. **MSW production exclusion** — Gate behind `import.meta.env.DEV`; CI assertion (`dist/` must not contain `msw` strings).
6. **`localStorage` key for theme** — `tcsgon:theme` (values: `"light" | "dark" | "system"`). Inline script reads first, falls back to `prefers-color-scheme`.
7. **Sidebar state union** — `'closed' | 'open' | 'pinned'` (not just boolean) — supports desktop pin + mobile drawer.
8. **ToastRegion** — Single polite region for info/success + separate sibling assertive region for errors (avoids double-announcement).
9. **`exactOptionalPropertyTypes` interfaces** — All component props use `readonly T` with `?:` only — no `| undefined` re-enabling.
10. **Branding in TopBar** — `<span>` (not `<h1>`); each route owns its h1.
11. **SkipLink target tabindex** — `<main id="main-content" tabindex="-1">` (focusable via JS, not in tab order).
12. **`localStorage` key for auth** — `tcs.auth` (token + user + expiresAt; rehydrated synchronously before `configureStore`).

---

> **Hand-off for implementation:**
> 1. `react-agent` builds component shapes from §10–§15
> 2. `typescript-agent` produces all contracts from §16–§24 (and writes the source files with `verbatimModuleSyntax` + `exactOptionalPropertyTypes`)
> 3. `testing-agent` writes the test inventory from §25–§33 (MSW handlers + RTL + Playwright)
> 4. `accessibility-agent` reviews §34–§45 during PR review
> 5. `performance-agent` measures §46–§57 after the new chunks land
> 6. `code-review-agent` validates against this plan + AGENTS.md §6