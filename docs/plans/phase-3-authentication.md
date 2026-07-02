# Plan — Phase 3: Authentication Feature

> Full login / signup / password reset / session management flow. The first end-to-end feature.

**Scope:** roadmap.md §3 — Authentication Feature.

**Status:** Planned

> **Updated:** Phase 3 is now split into 3a (Backend API + Postgres), 3b (Frontend — this document), and 3c (Full-Stack Integration).
> See `docs/plans/phase-3a-backend-auth.md` for the backend plan.
> The frontend hooks in this plan now target the real Express server at `http://localhost:3001` via Vite proxy.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  React Router v6 (createBrowserRouter)                               │   │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  ┌─────────────┐│   │
│  │  │ LoginPage │  │ SignupPage│  │ ForgotPasswordPage│ │ ResetPass-  ││   │
│  │  │ (lazy)    │  │ (lazy)    │  │ (lazy)           │ │ wordPage    ││   │
│  │  └─────┬─────┘  └─────┬─────┘  └────────┬─────────┘ │ (lazy)      ││   │
│  │        │              │                  │            └──────┬──────┘│   │
│  │        └──────────────┴──────────────────┴───────────────────┘       │   │
│  │                              │                                       │   │
│  │                     ┌───────┴────────┐                               │   │
│  │                     │   AuthLayout   │  (shared shell)               │   │
│  │                     └───────┬────────┘                               │   │
│  │                             │                                        │   │
│  │              ┌──────────────┼──────────────┐                         │   │
│  │              ▼              ▼              ▼                         │   │
│  │     ┌─────────────┐ ┌──────────────┐ ┌──────────────┐               │   │
│  │     │ LoginForm   │ │ SignupForm   │ │ ForgotPass   │               │   │
│  │     │ (+enhance)  │ │ +PwdStrength │ │ Form         │               │   │
│  │     └──────┬──────┘ └──────┬───────┘ └──────┬───────┘               │   │
│  │            │               │                │                        │   │
│  │            └───────┬───────┴────────────────┘                        │   │
│  │                    ▼                                                  │   │
│  │         ┌──────────────────┐                                         │   │
│  │         │   React Query    │  useLogin / useSignup / useLogout       │   │
│  │         │   Auth Hooks     │  useResetPassword / useSession          │   │
│  │         │  (authApi.ts)    │                                         │   │
│  │         └────────┬─────────┘                                         │   │
│  │                  │                                                   │   │
│  │         ┌────────┴─────────┐                                         │   │
│  │         │   API Client     │  (typed fetch wrapper, token injector,  │   │
│  │         │  (shared/api/)   │   401 → dispatch sessionExpired)        │   │
│  │         └────────┬─────────┘                                         │   │
│  │                  │                                                   │   │
│  │         ┌────────┴─────────┐                                         │   │
│  │         │  Vite Proxy      │  /api → http://localhost:3001           │   │
│  │         │  (dev only)      │                                         │   │
│  │         └────────┬─────────┘                                         │   │
│  │                  │                                                   │   │
│  │         ┌────────┴─────────┐                                         │   │
│  │         │   Express API    │  (Phase 3a — runs on :3001)             │   │
│  │         │   Server         │  Handles auth, sessions, users          │   │
│  │         └────────┬─────────┘                                         │   │
│  │                  │                                                   │   │
│  │         ┌────────┴─────────┐                                         │   │
│  │         │   Redux Store    │  authSlice (sync auth state)            │   │
│  │         │  (store/)        │  uiSlice (toast notifications)          │   │
│  │         └────────┬─────────┘                                         │   │
│  │                  │                                                   │   │
│  │         ┌────────┴─────────┐                                         │   │
│  │         │   localStorage   │  <tcs.auth> key (Session JSON)          │   │
│  │         └──────────────────┘                                         │   │
│  │                                                                       │   │
│  │  Auth Guards (synchronous — read Redux, no network):                 │   │
│  │  ┌────────────┐  ┌──────────────┐  ┌───────────┐                    │   │
│  │  │ RequireAuth│  │RedirectIfAuth│  │SessionCheck│ (app mount)        │   │
│  │  └────────────┘  └──────────────┘  └─────┬─────┘                    │   │
│  │                                          │                           │   │
│  │  Profile Menu (enhanced):                │                           │   │
│  │  ┌─────────────┐                         │                           │   │
│  │  │  TopBar     │──┐                      │                           │   │
│  │  │  ┌────────┐ │  │                      │                           │   │
│  │  │  │Profile  │ │  │                      │                           │   │
│  │  │  │Menu     │◄┘                      │                           │   │
│  │  │  └────────┘ │                         │                           │   │
│  │  └─────────────┘                         │                           │   │
│  └──────────────────────────────────────────┼────────────────────────────┘   │
│                                             │                                │
│                              NETWORK        │                                │
│                              ┌──────────────┴──────────────┐                │
│                              │  Vite Proxy (:5173)          │                │
│                              │  → Express Server (:3001)    │                │
│                              │  /api/auth/* → auth routes   │                │
│                              │  /api/users/* → user routes  │                │
│                              │  GET  /session → session val │                │
│                              └─────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘

Data Flow:
  User Action → Form Component → React Query Mutation → API Client → Vite Proxy
                                                                       ↓
  UI Update   ← Redux Auth Slice ← React Query onSuccess ←  Express Route Handler
                                                               ↓
                                                          Prisma → PostgreSQL

---

## Folder Structure

### New files

```
src/
├── features/
│   └── auth/
│       ├── api/
│       │   ├── authApi.ts              # React Query hooks + Zod schemas (NEW)
│       │   ├── authApi.test.tsx        # Tests for auth hooks (NEW)
│       │   └── index.ts                # Barrel (NEW)
│       ├── components/
│       │   ├── SignupForm.tsx           # New signup form with password strength (NEW)
│       │   ├── SignupForm.test.tsx      # (NEW)
│       │   ├── SignupForm.module.css    # (NEW)
│       │   ├── ForgotPasswordForm.tsx   # Email-only form (NEW)
│       │   ├── ForgotPasswordForm.test.tsx # (NEW)
│       │   ├── ForgotPasswordForm.module.css # (NEW)
│       │   ├── ResetPasswordForm.tsx    # Password + confirm form (NEW)
│       │   ├── ResetPasswordForm.test.tsx # (NEW)
│       │   ├── ResetPasswordForm.module.css # (NEW)
│       │   ├── PasswordStrengthIndicator.tsx # with aria-live (NEW)
│       │   ├── PasswordStrengthIndicator.test.tsx # (NEW)
│       │   └── PasswordStrengthIndicator.module.css # (NEW)
│       ├── pages/
│       │   ├── SignupPage.tsx           # New signup page (NEW)
│       │   ├── SignupPage.test.tsx      # (NEW)
│       │   ├── ForgotPasswordPage.tsx   # New forgot password page (NEW)
│       │   ├── ForgotPasswordPage.test.tsx # (NEW)
│       │   ├── ResetPasswordPage.tsx    # New reset password page (NEW)
│       │   └── ResetPasswordPage.test.tsx # (NEW)
│       └── __tests__/
│           └── authFlow.test.tsx        # Integration test: full auth flow (NEW)
├── test/
│   ├── msw/
│   │   ├── handlers/
│   │   │   ├── auth.ts                 # MSW handlers for auth endpoints (NEW)
│   │   │   └── index.ts                # Aggregate all handlers (NEW)
│   │   └── server.ts                   # MSW server instance (NEW)
│   └── fixtures/
│       └── auth.ts                     # Auth test fixtures (NEW)
└── shared/
    └── types/
        └── user.ts                     # EXTENDED: +SignupInput, +ForgotPasswordInput,
                                        #          +ResetPasswordInput schemas
```

### Modified files

```
src/
├── main.tsx                            # Wire getToken resolver to API client
├── App.tsx                             # Add SessionCheck component
├── routes/
│   └── index.tsx                       # Add SignupPage, ForgotPasswordPage, ResetPasswordPage routes
├── layouts/
│   ├── AppShell.tsx                    # Wire TopBar with auth props
│   ├── TopBar.tsx                      # Replace inline user display with ProfileMenu
│   └── TopBar.test.tsx                 # Update tests for ProfileMenu integration
├── features/
│   └── auth/
│       ├── index.ts                    # Export new components, hooks, pages
│       ├── hooks/
│       │   ├── useAuth.ts              # Add RQ-based login/logout/refresh
│       │   └── useAuth.test.tsx        # Update tests
│       ├── slice/
│       │   └── authSlice.ts            # Add setSession action for RQ integration
│       ├── components/
│       │   ├── LoginForm.tsx            # Minor enhancements (optional)
│       │   └── ProfileMenu.tsx          # Enhance with arrow keys, settings link, email display
│       └── pages/
│           └── LoginPage.tsx            # Minor enhancements
├── shared/
│   └── api/
│       └── schemas.ts                  # Register new schemas
└── store/
    └── index.ts                        # Export token accessor for API client
```

---

## Module Dependencies

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │                        DEPENDENCY GRAPH                              │
  │  (arrow = "depends on")                                              │
  │                                                                      │
  │  AppShell ──→ TopBar ──→ ProfileMenu ──→ useAuth ──→ authSlice      │
  │     │                                       │                        │
  │     │                                       └──→ authApi ──→ apiClient│
  │     └──→ RequireAuth ──→ useAuth                                    │
  │     └──→ ToastRegion                                                 │
  │                                                                      │
  │  LoginPage ──→ AuthLayout                                            │
  │     ├──→ LoginForm ──→ useAuth ──→ authSlice                        │
  │     │                                    │                           │
  │     └──→ [LoginForm]────────┐            └──→ authPersistence       │
  │                             ▼                                        │
  │  SignupPage ──→ AuthLayout ───→ useSignup ──→ authApi ──→ apiClient  │
  │     └──→ SignupForm ──→ PasswordStrengthIndicator                    │
  │                                                                      │
  │  ForgotPasswordPage ──→ AuthLayout                                   │
  │     └──→ ForgotPasswordForm ──→ apiClient ──→ authApi                │
  │                                                                      │
  │  ResetPasswordPage ──→ AuthLayout                                    │
  │     └──→ ResetPasswordForm ──→ authApi ──→ apiClient                 │
  │                                                                      │
  │  Router ──→ lazy imports (code-split)                                │
  │     ├──→ LoginPage                                                   │
  │     ├──→ SignupPage                                                  │
  │     ├──→ ForgotPasswordPage                                          │
  │     └──→ ResetPasswordPage                                           │
  │                                                                      │
  │  main.tsx ──→ createApiClient(getToken: store.getState)              │
  │     ├──→ ReduxProvider                                               │
  │     ├──→ QueryClientProvider                                         │
  │     └──→ ApiClientProvider ──→ App                                   │
  │                                                                      │
  │  test/msw/handlers/auth.ts ──→ shared/types/user (schemas)           │
  │                                                                      │
  │  No cyclic dependencies.                                             │
  │  authApi depends on apiClient, not vice versa.                       │
  │  Forms depend on hooks; hooks depend on slice + apiClient.           │
  │  Router imports pages (lazy); pages do NOT import router.            │
  └─────────────────────────────────────────────────────────────────────┘
```

### Key dependency rules

| Module | Can import from | Cannot import from |
|---|---|---|
| `authApi.ts` | `shared/api/client`, `shared/api/errors`, `shared/types/user`, `@tanstack/react-query`, `store/hooks` | Any feature module, any component |
| `useAuth.ts` | `authSlice`, `authApi`, `store/hooks`, `shared/api/ApiClientContext` | Any component, any page |
| Forms | Only hooks & `shared/types/user` | Redux directly, API directly |
| Pages | Only forms, layouts, hooks | API directly, Redux directly (prefer hooks) |
| `authSlice.ts` | `authState`, `shared/types/user` | `authApi`, React Query, components |
| Router | Only page components (lazy) | Form components, hooks, API |
| MSW handlers | Only `shared/types/user`, `zod` | React, Redux, components |
| `TopBar` | `ProfileMenu`, `shared/types/user`, `store/slices/uiSlice` | Auth API directly |

---

## State Decision with Justification

### Existing (carries forward)

| State | Location | Decision | Justification |
|---|---|---|---|
| Auth kind (anonymous/auth/error) | Redux `authSlice` | **Redux** | Crosses 3+ trees: `RequireAuth`, `TopBar`, `ProfileMenu`, every authed page. Needs synchronous access on route transitions — no async fetch allowed. |
| User + Session | Redux `authSlice` | **Redux** (with localStorage sync) | Written on login/rehydrate, read synchronously by guards. Token needed by API client on every request. *Justification per AGENTS.md §3: "global state crossing 3+ feature trees"* |
| Auth token (persisted) | localStorage `tcs.auth` | **localStorage** | Synchronous rehydration on page reload prevents flash to login (ADR 0001). Validated via `SessionSchema` on read/write. |

### New (Phase 3)

| State | Location | Decision | Justification |
|---|---|---|---|
| Login mutation status | React Query `useMutation` | **React Query** | Transient per-call state. No other tree needs to know "is login currently in flight". |
| Signup mutation status | React Query `useMutation` | **React Query** | Same as login. One-shot mutation. |
| Logout mutation status | React Query `useMutation` | **React Query** | Best-effort; local state cleared synchronously via Redux regardless of network result. |
| Reset password mutation | React Query `useMutation` | **React Query** | One-shot mutation tied to form lifecycle. |
| Session (server check) | React Query `useQuery` | **React Query** | Server state by definition. Stale-while-revalidate allows instant render from Redux cache while background refetch validates. |
| Password strength | Local `useState` | **Local** | Purely presentational, no other consumer. Calculated during render from form value. |
| Form field values | React Hook Form | **Local** | Form state belongs to form. RHF manages field-level state internally. |
| Token accessor function | `createApiClient` getToken | **Context (ApiClient)** | Wired at app boot in `main.tsx` via `store.getState()`. No re-renders required. |

### Session check on app mount

```
App mount
    │
    ├── Redux preloadedState from localStorage ──→ { kind: 'authenticated' }
    │                                                    │
    ├── React Query: useSession() fires                  │
    │     │                                              │
    │     ├── 200: data matches store → no-op            │
    │     ├── 200: new data → dispatch rehydrate          │
    │     └── 401: dispatch sessionExpired                │
    │                                                    │
    └── UI renders immediately (from Redux, no flash)    │
          │                                              │
          └── RequireAuth reads Redux synchronously ─────┘
```

**Rationale:** Session is server state → naturally belongs in React Query. But route guards need synchronous access on every render → Redux. Solution: React Query writes to Redux on success/error; guards always read from Redux. This is a justified exception to "never duplicate server state into Redux" because:
1. The Redux copy is written only by React Query callbacks (single writer)
2. Guards need sync reads on route transitions (cannot `await` RQ)
3. The localStorage persistence layer already writes to Redux anyway

---

## Risks

### Coupling

| Risk | Severity | Mitigation |
|---|---|---|
| `useAuth` hook couples Redux and React Query | Medium | `useAuth` is the only bridge. No component reads both directly. If we later remove Redux auth, only `useAuth` and `RequireAuth` change. |
| MSW handlers import Zod schemas from `shared/types/user` | Low | Schemas are the public contract. MSW should validate the same way the app does. |
| Router knows about all auth pages (imports them lazily) | Low | Lazy imports are runtime-free; each page is a separate chunk. By design for route-level code splitting. |

### Performance

| Risk | Severity | Mitigation |
|---|---|---|
| React Query session refetch on every mount | Low | `staleTime: 5 * 60 * 1000` (5 min). Background refetch never blocks UI because Redux holds the synchronous cache. |
| Token accessor calls `store.getState()` on every request | Low | `getState()` is O(1), no re-render. |
| 3 new lazy routes = 3 additional JS chunks | Low | Each auth page is small (< 5 kB gzip). Total well under budget. |
| Unnecessary re-renders if `useAuth` returns new object refs | Low | Return shape is stable (same reference if deps haven't changed). Memoize with `useMemo` in the hook. |

### Testability

| Risk | Severity | Mitigation |
|---|---|---|
| Hooks depend on both Redux and React Query providers | Low | `renderWithProviders` in `test-utils.tsx` already provides both. |
| MSW server needs to be available for integration tests | Low | `test-setup.ts` already imports `@test/msw/server`. Creating the file fixes the missing link. |
| `useAuth` logic spans two state systems — harder to mock | Medium | Test `useAuth` via integration test with real Redux store + real React Query + MSW handlers. |

### Extensibility

| Risk | Severity | Mitigation |
|---|---|---|
| Adding a new auth provider (OAuth, SSO) would require new hooks | Low | Extend `authApi.ts` with new mutations. The `useAuth` bridge remains the same interface. |
| If token refresh is added later, the 401 interceptor needs to queue requests | Low | `authSlice` already has `sessionExpired`. A refresh queue can slot in at the API client level without touching components. |
| If we migrate to HttpOnly cookies (ADR 0001 plan), the `getToken` resolver becomes a no-op | Low | Change `main.tsx`'s `getToken`. No component changes needed. |

---

## Interfaces (TypeScript Shapes)

### New Zod schemas (extend `src/shared/types/user.ts`)

```typescript
export const SignupInputSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(120),
    email: z.string().email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(200),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SignupInput = z.infer<typeof SignupInputSchema>;

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email('Valid email is required'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export const ResetPasswordInputSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(200),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const ForgotPasswordResponseSchema = z.object({
  message: z.string(),
});
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;
```

### React Query auth hooks (in `src/features/auth/api/authApi.ts`)

```typescript
// Query key factory
export const authKeys = {
  all: ['auth'] as const,
  session: () => ['auth', 'session'] as const,
};

// Hook return types
export interface UseLoginResult {
  readonly login: UseMutationResult<Session, Error, LoginInput>;
}
export interface UseSignupResult {
  readonly signup: UseMutationResult<Session, Error, SignupInput>;
}
export interface UseLogoutResult {
  readonly logout: UseMutationResult<void, Error, void>;
}
export interface UseResetPasswordResult {
  readonly resetPassword: UseMutationResult<Session, Error, ResetPasswordInput>;
}
export interface UseForgotPasswordResult {
  readonly forgotPassword: UseMutationResult<ForgotPasswordResponse, Error, ForgotPasswordInput>;
}
export interface UseSessionResult {
  readonly data: Session | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
}

// Hooks
export function useLogin(): UseLoginResult;
export function useSignup(): UseSignupResult;
export function useLogout(): UseLogoutResult;
export function useResetPassword(): UseResetPasswordResult;
export function useForgotPassword(): UseForgotPasswordResult;
export function useSession(): UseSessionResult;
```

### Enhanced `useAuth` hook (updated return type)

```typescript
export interface UseAuthResult {
  // Synchronous state (from Redux)
  readonly status: AuthState['kind'];
  readonly user: User | null;
  readonly session: Session | null;
  readonly error: string | null;
  readonly isAuthenticated: boolean;

  // Mutations (React Query)
  readonly login: UseLoginResult['login'];
  readonly signup: UseSignupResult['signup'];
  readonly logout: UseLogoutResult['logout'];
  readonly resetPassword: UseResetPasswordResult['resetPassword'];
  readonly forgotPassword: UseForgotPasswordResult['forgotPassword'];

  // Queries
  readonly refresh: () => Promise<unknown>;
}
```

### Enhanced `authSlice` (additions)

```typescript
export const setSession = createAction<Session>('auth/setSession');
```

### ProfileMenu enhanced props

```typescript
export interface ProfileMenuProps {
  readonly user: User;
  readonly onSettings: MouseEventHandler<HTMLButtonElement>;
  readonly onSignOut: MouseEventHandler<HTMLButtonElement>;
  readonly align?: 'start' | 'end';
}
```

### PasswordStrengthIndicator

```typescript
export interface PasswordStrengthResult {
  readonly score: 0 | 1 | 2 | 3 | 4;
  readonly label: string;
  readonly feedback: string | null;
}

export interface PasswordStrengthIndicatorProps {
  readonly password: string;
}
```

Scoring: +1 length ≥ 8, +1 has upper+lower, +1 has digit, +1 has special char.

### Token accessor (in `main.tsx`)

```typescript
const getToken = (): string | null => {
  const state = store.getState().auth;
  if (state.kind === 'authenticated') {
    return state.session.token;
  }
  return null;
};
const apiClient = createApiClient({ baseUrl: '/api', getToken });
```

### Route additions

```typescript
{
  path: '/signup',
  lazy: () => import('@/features/auth/pages/SignupPage').then((m) => ({ Component: m.SignupPage })),
  handle: { crumb: 'Sign up' },
},
{
  path: '/forgot-password',
  lazy: () => import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ Component: m.ForgotPasswordPage })),
  handle: { crumb: 'Forgot password' },
},
{
  path: '/reset-password',
  lazy: () => import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ Component: m.ResetPasswordPage })),
  handle: { crumb: 'Reset password' },
},
```

---

## Component Breakdown

### New components

| Component | Description | State | A11y notes |
|---|---|---|---|
| `SignupForm` | Name + email + password + confirm password fields. Submits to `useSignup()`. | React Hook Form + Zod | Labels, errors via `aria-describedby`, loading state disables submit |
| `ForgotPasswordForm` | Email-only form. Submits to `useForgotPassword()`. | React Hook Form + Zod | Labels, errors, success feedback |
| `ResetPasswordForm` | Password + confirm fields. Token from page. Submits to `useResetPassword()`. | React Hook Form + Zod | Labels, errors, match validation |
| `PasswordStrengthIndicator` | Visual indicator + aria-live announcement during signup. | Derived from `password` prop | `role="status"`, `aria-live="polite"`, `aria-atomic="true"` |

### Enhanced components

| Component | Changes |
|---|---|
| `ProfileMenu` | Avatar initials, email display, Settings link, keyboard nav (arrow keys, Home, End, Escape), `aria-expanded` on trigger, focus trap |
| `TopBar` | Replace inline user display with `<ProfileMenu>` component |
| `LoginForm` | Minor: verify existing meets Phase 3 requirements; add `?next=` redirect support |

### New pages

| Page | Lazy route | Form component | Redirect on success |
|---|---|---|---|
| `SignupPage` | `/signup` | `SignupForm` | `/login` (with success toast) |
| `ForgotPasswordPage` | `/forgot-password` | `ForgotPasswordForm` | (stays, shows success message) |
| `ResetPasswordPage` | `/reset-password?token=...` | `ResetPasswordForm` | `/login` |

### Auth guards

| Guard | Route | Behavior |
|---|---|---|
| `RequireAuth` (exists) | Protected routes | Reads Redux synchronously; redirects to `/login?next=<path>` if not authenticated |
| `RedirectIfAuth` (exists) | Auth pages | Redirects to `/dashboard` if already authenticated |
| `SessionCheck` (new) | App mount | Fires `useSession()` query; on 401 dispatches `sessionExpired` to Redux |

---

## Verification Plan

### Unit tests

| Test file | What it covers |
|---|---|
| `authApi.test.tsx` | `useLogin`, `useSignup`, `useLogout`, `useResetPassword`, `useForgotPassword`, `useSession` — success, network error, validation error, 401, loading state |
| `SignupForm.test.tsx` | Renders fields, validates, calls `onSubmit`, shows password strength, shows busy state |
| `ForgotPasswordForm.test.tsx` | Renders email field, validates, calls `onSubmit`, handles errors |
| `ResetPasswordForm.test.tsx` | Renders password + confirm, validates match, shows busy state |
| `PasswordStrengthIndicator.test.tsx` | Correct score/label for each level. Verifies `aria-live` region. |
| `ProfileMenu.test.tsx` | Renders avatar, name, email, settings, logout. Keyboard nav. `aria-expanded`. |
| `authSlice.ts` (extend) | New `setSession` action sets authenticated state correctly |

### Integration tests

| Test file | What it covers |
|---|---|
| `authFlow.test.tsx` | Full: LoginPage → fill form → MSW login → Redux state updated → RequireAuth passes → dashboard |
| `SignupPage.test.tsx` | Render → fill → MSW → success toast → redirect to /login |
| `ForgotPasswordPage.test.tsx` | Render → fill → MSW → success feedback |
| `ResetPasswordPage.test.tsx` | Render with valid token → fill → MSW → redirect to /login |

### E2E tests (Playwright)

| Test file | Route | Flow |
|---|---|---|
| `auth/signup.spec.ts` | `/signup` | Complete form, see success toast, redirected to /login |
| `auth/login.spec.ts` | `/login` | Fill credentials, redirected to /dashboard |
| `auth/forgot-password.spec.ts` | `/forgot-password` | Submit email, see confirmation |
| `auth/logout.spec.ts` | (authenticated) | Profile menu → sign out → redirected to /login |
| `auth/session-expiry.spec.ts` | (authenticated) | Mock API returns 401 → app redirects to /login |

### Accessibility (axe-core)

| Route | Critical checks |
|---|---|
| `/signup` | Labels associated, errors announced via `aria-describedby`, password strength via `aria-live`, keyboard-navigable form |
| `/forgot-password` | Email field labeled, error messages announced |
| `/reset-password` | Token from URL (hidden), password fields labeled, match errors announced |
| `/login` (enhanced) | Existing axe tests + keyboard navigation |
| Profile menu | `aria-expanded`, `aria-haspopup`, focus management, arrow key navigation |

### Edge cases

| Scenario | Expected behavior |
|---|---|
| Empty field submit | Validation errors per field (RHF + Zod) |
| Wrong credentials | API 401 → error message, no redirect |
| Offline submit | Network error → friendly message, no redirect |
| Double-click submit | Button disabled while loading |
| Page refresh while authenticated | Session persists (localStorage → Redux), no flash |
| Token expired mid-session | 401 response → `sessionExpired` → login redirect |
| /login while authenticated | `RedirectIfAuth` → `/dashboard` |
| /dashboard while anonymous | `RequireAuth` → `/login?next=/dashboard` |
| Signup password mismatch | `confirmPassword` field shows "Passwords do not match" |
| Forgot password, unknown email | API returns 200 (don't reveal existence), generic success |
| Reset with expired token | API 400/401 → error, link to request new reset |
| Reset with invalid URL token | Validate before rendering form → error |
| Profile menu: click outside | Closes |
| Profile menu: Escape | Closes, focus returns to trigger |
| Profile menu: Tab while open | Focus cycles within menu (focus trap) |

### Verification commands

```bash
pnpm test -- --coverage          # auth feature ≥ 75% lines, branches, functions
pnpm typecheck                   # zero errors
pnpm e2e --grep "auth"           # all auth E2E tests pass
pnpm axe                         # zero critical/serious on all auth pages
pnpm build                       # within budget per route (200 kB warn / 350 kB error)
pnpm lint                        # zero errors
```

---

## Phasing within Phase 3

Phase 3 could be delivered in up to 3 sub-phases:

### Sub-phase 3a — Auth API + session management
- `authApi.ts` with all hooks
- MSW handlers for auth endpoints
- `setSession` action in `authSlice`
- Token accessor wiring in `main.tsx`
- `SessionCheck` in `AppShell`
- **Mergeable:** Yes — no UI changes, auth works in background

### Sub-phase 3b — Auth pages
- `SignupForm`, `ForgotPasswordForm`, `ResetPasswordForm`
- `PasswordStrengthIndicator`
- Corresponding pages + routes
- Enhanced `ProfileMenu` + `TopBar`
- **Mergeable:** Yes — all pages behind lazy routes, doesn't break existing

### Sub-phase 3c — E2E + a11y hardening
- E2E tests for all auth flows
- axe-core audit of all auth pages
- Manual: token refresh, 401 handling, password reset flow
- **Mergeable:** Yes — tests only, no production code changes

---

## Component Specifications

### 1. `PasswordStrengthIndicator`

**File:** `src/features/auth/components/PasswordStrengthIndicator.tsx`

```typescript
export interface PasswordStrengthIndicatorProps {
  readonly password: string;
}

export interface PasswordStrengthResult {
  readonly score: 0 | 1 | 2 | 3 | 4;
  readonly label: string;
  readonly feedback: string | null;
}
```

**Scoring:** +1 if length ≥ 8, +1 if upper+lower, +1 if digit, +1 if special char.
| Score | Label | Feedback |
|---|---|---|
| 0 | None | null |
| 1 | Weak | "Consider a longer password with mixed characters." |
| 2 | Fair | "Add numbers and special characters for a stronger password." |
| 3 | Strong | "Good password." |
| 4 | Very strong | null |

**Behavior:**
- Renders `<div role="progressbar">` with 4 segments + `<span role="status" aria-live="polite">`.
- Returns `null` when password is empty.
- Pure render-time computation (no effect).

**A11y:** `role="status"` + `aria-live="polite"` + `aria-atomic="true"` for announcements. Color not sole indicator.

---

### 2. `SignupForm`

**File:** `src/features/auth/components/SignupForm.tsx`

```typescript
export interface SignupFormProps {
  readonly onSubmit: (input: SignupInput) => void | Promise<void>;
  readonly disabled?: boolean;
}
```

**State:** React Hook Form (`useForm<SignupInput>`, `zodResolver(SignupInputSchema)`). Password strength derived from `watch('password')`. Submit loading from `isSubmitting`.

**Fields:** Name, Email, Password, Confirm Password. Password strength indicator below password field. Validation mode `onTouched`.

**Behavior:**
- Calls `await onSubmit(data)` on submit.
- On error: `setError('root', { message })` + focus error summary.
- Auto-focus Name field via `setFocus`.
- `autoComplete`: name, email, new-password, new-password.

**A11y:** Labels via `htmlFor`, errors via `aria-describedby`, `aria-invalid`, `aria-required`. Error summary `<div role="alert" tabIndex={-1}>`.

---

### 3. `ForgotPasswordForm`

**File:** `src/features/auth/components/ForgotPasswordForm.tsx`

```typescript
export interface ForgotPasswordFormProps {
  readonly onSubmit: (input: ForgotPasswordInput) => Promise<ForgotPasswordResponse>;
  readonly disabled?: boolean;
}
```

**State:** React Hook Form + `useState<'idle' | 'success'>` local state. On success, form switches to confirmation view with message from API response.

**Fields:** Single email field. `autoComplete="email"`.

**Behavior:**
- Success: display API response message + "Back to sign in" link.
- Error: `setError('root', ...)` + focus error summary.

---

### 4. `ResetPasswordForm`

**File:** `src/features/auth/components/ResetPasswordForm.tsx`

```typescript
export interface ResetPasswordFormProps {
  readonly onSubmit: (input: ResetPasswordInput) => void | Promise<void>;
  readonly token: string;
  readonly disabled?: boolean;
}
```

**State:** React Hook Form. Merges `token` prop with field data before calling `onSubmit`.

**Fields:** New Password, Confirm New Password. Both `autoComplete="new-password"`.

**A11y:** Same label/error pattern. Cross-field mismatch error on confirmPassword field.

---

### 5. `SessionCheck`

**File:** `src/features/auth/components/SessionCheck.tsx`

```typescript
export interface SessionCheckProps {
  readonly children: ReactNode;
}
```

**State:** React Query `useSession()` with 5-min `staleTime`. Dispatches `sessionExpired` on 401.

**Behavior:**
- Mounted once in `AppShell`. Calls `useSession()` on mount.
- Renders `{children}` directly — no DOM wrapper.
- Does NOT block rendering (Redux has synchronous cache).

**Edge cases:** Fresh load valid session → background refetch no-op. Expired session → 401 → clear Redux → `RequireAuth` redirects. Network error → conservative clear.

---

### 6. `ProfileMenu` (enhanced)

**File:** `src/features/auth/components/ProfileMenu.tsx`

```typescript
export interface ProfileMenuProps {
  readonly user: User;
  readonly onSettings: MouseEventHandler<HTMLButtonElement>;
  readonly onSignOut: MouseEventHandler<HTMLButtonElement>;
  readonly align?: 'start' | 'end';
}
```

**State:** `useState(false)` for open, `useState(0)` for focused index.

**Keyboard navigation:**
| Key | Action |
|---|---|
| Enter/Space (trigger) | Toggle open |
| ArrowDown (open) | Next item, wrap |
| ArrowUp (open) | Previous item, wrap |
| Home/End (open) | First/Last item |
| Escape (open) | Close, return focus to trigger |
| Tab (open) | Focus trap within menu |

**Items:** Email (non-interactive), Settings button, Sign Out button.

**A11y:** `aria-haspopup="true"`, `aria-expanded={open}`, `role="menu"` on `<ul>`, `role="menuitem"` on items. Focus trap. `aria-controls` linking.

---

### 7. `TopBar` (enhanced)

**File:** `src/layouts/TopBar.tsx`

Replaces `<span>{user.name}</span>` with `<ProfileMenu>` component. Adds `onSettings` and `onSignOut` props (optional). When `user` is null, shows "Sign in" text (existing behavior preserved).

---

### 8. `LoginForm` (verification)

No code changes needed. `?next=` redirect is handled at the page level. The form already exposes `LoginInput`; the page controls navigation after submit.

---

### 9. `SignupPage`

**File:** `src/features/auth/pages/SignupPage.tsx`

- Lazy route at `/signup`. Wraps `<SignupForm>` in `<AuthLayout>`.
- If already authenticated: `<Navigate to="/dashboard" />`.
- On success: toast + `navigate('/login', { replace: true })`.
- On error: passes through to form.

---

### 10. `ForgotPasswordPage`

**File:** `src/features/auth/pages/ForgotPasswordPage.tsx`

- Lazy route at `/forgot-password`. Wraps `<ForgotPasswordForm>` in `<AuthLayout>`.
- No auth check needed (anyone can access).
- On success: form internally switches to confirmation view.

---

### 11. `ResetPasswordPage`

**File:** `src/features/auth/pages/ResetPasswordPage.tsx`

- Lazy route at `/reset-password?token=...`.
- Extracts `token` from `useSearchParams()`. If missing: error state + link to `/forgot-password`.
- Passes token to `<ResetPasswordForm>`. On success: toast + `navigate('/login', { replace: true })`.

---

### Route additions

```typescript
{
  path: '/signup',
  lazy: () => import('@/features/auth/pages/SignupPage').then((m) => ({ Component: m.SignupPage })),
  handle: { crumb: 'Sign up' },
},
{
  path: '/forgot-password',
  lazy: () => import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ Component: m.ForgotPasswordPage })),
  handle: { crumb: 'Forgot password' },
},
{
  path: '/reset-password',
  lazy: () => import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ Component: m.ResetPasswordPage })),
  handle: { crumb: 'Reset password' },
},
```

### SessionCheck integration

Mount `<SessionCheck>` in `AppShell.tsx` wrapping the shell content. `SessionCheck` fires `useSession()` on mount and dispatches `sessionExpired` on 401.

---

## Hand-off Summary

| Agent | Deliverables |
|---|---|
| **react-agent** | Component specs above — `SignupForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `PasswordStrengthIndicator`, enhanced `ProfileMenu`, updated `TopBar`, `SessionCheck` |
| **typescript-agent** | Zod schemas in `shared/types/user.ts`, `authKeys` factory, `authApi.ts` hook signatures, `setSession` action, `PasswordStrengthResult` type |
| **testing-agent** | Unit/integration tests for all new components + hooks, MSW handlers, E2E specs |
| **performance-agent** | Verify 3 new lazy routes stay under 50 kB gzip each; total auth bundle < 50 kB |

---

## Type Contracts

*Generated by typescript-agent*

### 1. Zod Schemas (extend `src/shared/types/user.ts`)

```typescript
/**
 * Signup input — validates against the server's expected shape.
 * `confirmPassword` is validated client-side via `.refine()` and sent
 * to the server for verification.
 */
export const SignupInputSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(120),
    email: z.string().email('Valid email is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(200, 'Password must be at most 200 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SignupInput = z.infer<typeof SignupInputSchema>;

/**
 * Forgot-password input — email-only request to trigger a reset email.
 */
export const ForgotPasswordInputSchema = z.object({
  email: z.string().email('Valid email is required'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

/**
 * Reset-password input — token from email link + new password with confirmation.
 */
export const ResetPasswordInputSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(200, 'Password must be at most 200 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

/**
 * Forgot-password response — generic success message from the server.
 * The server always returns 200 to avoid leaking user existence.
 */
export const ForgotPasswordResponseSchema = z.object({
  message: z.string(),
});
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;
```

### 2. React Query Hook Contracts (`src/features/auth/api/authApi.ts`)

```typescript
// Query key factory
export const authKeys = {
  all: ['auth'] as const,
  session: () => ['auth', 'session'] as const,
} as const;

// Hook result interfaces
export interface UseLoginResult {
  readonly login: UseMutationResult<Session, Error, LoginInput>;
}

export interface UseSignupResult {
  readonly signup: UseMutationResult<Session, Error, SignupInput>;
}

export interface UseLogoutResult {
  readonly logout: UseMutationResult<void, Error, void>;
}

export interface UseResetPasswordResult {
  readonly resetPassword: UseMutationResult<Session, Error, ResetPasswordInput>;
}

export interface UseForgotPasswordResult {
  readonly forgotPassword: UseMutationResult<ForgotPasswordResponse, Error, ForgotPasswordInput>;
}

export interface UseSessionResult {
  readonly data: Session | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<unknown>;
}

// Hook signatures
export function useLogin(): UseLoginResult;
export function useSignup(): UseSignupResult;
export function useLogout(): UseLogoutResult;
export function useResetPassword(): UseResetPasswordResult;
export function useForgotPassword(): UseForgotPasswordResult;
export function useSession(): UseSessionResult;
```

### 3. Redux Slice Addition (`setSession` action)

```typescript
/**
 * `setSession` — dispatched by React Query `useSession()` on successful
 * background refetch. Semantically identical to `rehydrate` but signals
 * a server-initiated update rather than a localStorage hydration.
 */
export const setSession = createAction<Session>('auth/setSession');
```

### 4. Enriched `useAuth` hook return type

```typescript
export interface UseAuthResult {
  readonly status: AuthState['kind'];
  readonly user: User | null;
  readonly session: Session | null;
  readonly error: string | null;
  readonly isAuthenticated: boolean;

  readonly login: UseLoginResult['login'];
  readonly signup: UseSignupResult['signup'];
  readonly logout: UseLogoutResult['logout'];
  readonly resetPassword: UseResetPasswordResult['resetPassword'];
  readonly forgotPassword: UseForgotPasswordResult['forgotPassword'];

  readonly refresh: () => Promise<unknown>;
}
```

### 5. PasswordStrengthIndicator types

```typescript
export interface PasswordStrengthResult {
  readonly score: 0 | 1 | 2 | 3 | 4;
  readonly label: string;
  readonly feedback: string | null;
}

export interface PasswordStrengthIndicatorProps {
  readonly password: string;
}
```

### Key design decisions (typescript-agent)

1. **Mutations dispatch to Redux on `onSuccess`/`onError`** — keeps Route Guards (`RequireAuth`, `RedirectIfAuth`) synchronous readers of Redux, never awaiting RQ.
2. **`useSession` syncs to Redux via `useEffect`** — RQ v5 removed query-level callbacks. `useEffect` is the canonical replacement. `data → rehydrate`, `unauthorized error → sessionExpired`.
3. **Logout is best-effort** — `mutationFn` catches all errors; `onSettled` always clears local state. `mutateAsync()` never rejects for logout.
4. **`setSession` as `createAction` + `extraReducers`** — keeps the mutation hooks decoupled from the slice definition while still handling the action within the same slice.
5. **Explicit `<TIn, TOut>` on `apiClient.request()`** — avoids Zod input/output type resolution depth issues with branded transforms.

---

## Test Strategy

*Generated by testing-agent*

### Provider setup pattern (for all RTL tests needing auth hooks)

Phase 3 hooks (`useAuth`, `useSignup`, etc.) require three providers. The existing `renderWithProviders` from `@/test-utils` already provides all three. For hook tests, follow the `createWrapper` pattern from `useAuth.test.tsx`.

```tsx
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={testApiClient}>
          {children}
        </ApiClientProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
```

### Test File 1: `PasswordStrengthIndicator.test.tsx`

**Path:** `src/features/auth/components/PasswordStrengthIndicator.test.tsx`

| # | Test name | Input | Expected assertions |
|---|---|---|---|
| 1 | `renders nothing for empty password` | `password=""` | `expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()` |
| 2 | `renders score 0 for short password` | `password="Ab1!"` (len 4) | Score 0, label "None", 4 unfilled segments |
| 3 | `renders score 1 (Weak) for length-only` | `password="abcdefgh"` | Score 1, label "Weak", feedback "Consider a longer password…" |
| 4 | `renders score 2 (Fair) for length+case` | `password="Abcdefgh"` | Score 2, label "Fair", feedback "Add numbers and special chars…" |
| 5 | `renders score 3 (Strong) for length+case+digit` | `password="Abcdefg1"` | Score 3, label "Strong", feedback "Good password." |
| 6 | `renders score 4 (Very strong) for all criteria` | `password="Abcd!f1g"` | Score 4, label "Very strong", feedback `null` |
| 7 | `has aria-live polite region for screen readers` | Any non-empty password | `role="status"`, `aria-live="polite"`, `aria-atomic="true"` |
| 8 | `color is not the sole indicator of strength` | Any password | Text labels rendered alongside segments |

### Test File 2: `SignupForm.test.tsx`

**Path:** `src/features/auth/components/SignupForm.test.tsx`

| # | Test name | Interaction | Expected assertions |
|---|---|---|---|
| 1 | `renders all form fields` | Render | Fields: Name, Email, Password, Confirm Password. Submit button "Sign Up" |
| 2 | `renders password strength indicator` | Render | `role="progressbar"` present when password non-empty |
| 3 | `shows required validation errors on empty submit` | Submit empty | Name required, valid email required, pwd 8 chars, confirm pwd required |
| 4 | `shows email format error` | Type invalid email, submit | "Valid email is required" |
| 5 | `shows password length error` | Type 4-char password, submit | "Password must be at least 8 characters" |
| 6 | `shows confirmPassword mismatch error` | Mismatched passwords, submit | "Passwords do not match" on confirmPassword |
| 7 | `calls onSubmit with trimmed input on valid submit` | Fill valid, submit | `onSubmit({ name, email, password, confirmPassword })` |
| 8 | `shows loading state during submit` | Non-resolving promise | Button disabled, text "Signing up…", `aria-busy="true"` |
| 9 | `shows server error on rejected submit` | Submit throws | Error in `role="alert"`, focus moves to summary |
| 10 | `disables submit when disabled prop is true` | `disabled={true}` | Button disabled |

### Test File 3: `ForgotPasswordForm.test.tsx`

**Path:** `src/features/auth/components/ForgotPasswordForm.test.tsx`

| # | Test name | Interaction | Expected assertions |
|---|---|---|---|
| 1 | `renders email field and submit button` | Render | Email field, button "Send Reset Link" |
| 2 | `shows required error on empty submit` | Submit empty | "Valid email is required" |
| 3 | `shows email format error` | Invalid email, submit | "Valid email is required" |
| 4 | `calls onSubmit with email on valid submit` | Valid email, submit | `onSubmit({ email })` |
| 5 | `shows loading state` | Non-resolving promise | Button disabled, text "Sending…" |
| 6 | `shows success message after submit` | Resolves | Success message, "Back to sign in" link |
| 7 | `shows server error on reject` | Throws | Error in `role="alert"` |

### Test File 4: `ResetPasswordForm.test.tsx`

**Path:** `src/features/auth/components/ResetPasswordForm.test.tsx`

| # | Test name | Interaction | Expected assertions |
|---|---|---|---|
| 1 | `renders password fields and submit button` | Render with token | New Password, Confirm New Password, "Reset Password" button |
| 2 | `does not render token field in UI` | Render | No visible token input |
| 3 | `shows password length error` | Short pwd, submit | "Password must be at least 8 characters" |
| 4 | `shows confirmPassword mismatch error` | Mismatch, submit | "Passwords do not match" |
| 5 | `calls onSubmit with token merged into input` | Valid, submit | `onSubmit({ token, password, confirmPassword })` |
| 6 | `shows loading state` | Non-resolving promise | Button disabled |
| 7 | `shows server error on reject` | Throws | Error in `role="alert"` |
| 8 | `disables when disabled prop is true` | `disabled={true}` | Button disabled |

### Test File 5: `SessionCheck.test.tsx`

**Path:** `src/features/auth/components/SessionCheck.test.tsx`

| # | Test name | Setup | Expected assertions |
|---|---|---|---|
| 1 | `renders children when session exists` | MSW 200 | Children visible |
| 2 | `renders nothing extra on initial load` | Loading | No extra DOM from SessionCheck |
| 3 | `dispatches rehydrate when session is valid` | MSW returns data | Redux → `authenticated` |
| 4 | `dispatches sessionExpired on 401` | MSW 401 | Redux → `anonymous` |
| 5 | `renders children during loading state` | Pending | Children visible immediately |
| 6 | `does not unmount children on network error` | MSW 500 | Children remain, Redux unchanged |

### Test File 6: `ProfileMenu.test.tsx`

**Path:** `src/features/auth/components/ProfileMenu.test.tsx`

| # | Test name | Expected assertions |
|---|---|---|
| 1 | `renders user name and initial on trigger` | Name "Alice", initial "A" |
| 2 | `renders user email in menu when open` | "alice@example.com" |
| 3 | `renders settings and sign out buttons` | Settings button, Sign Out button |
| 4 | `sign out button calls onSignOut` | `onSignOut` called |
| 5 | `settings button calls onSettings` | `onSettings` called |
| 6 | `menu is closed by default` | Menu items NOT visible |
| 7 | `trigger has aria-haspopup and aria-expanded` | `aria-haspopup="true"`, `aria-expanded` toggles |
| 8 | KB: Enter opens menu | Menu visible after Enter |
| 9 | KB: Space opens menu | Menu visible after Space |
| 10 | KB: Escape closes menu, focus returns | Closed, activeElement = trigger |
| 11 | KB: ArrowDown cycles forward | Focus moves through items |
| 12 | KB: ArrowUp cycles backward | Focus moves backward |
| 13 | KB: Home goes to first item | Focus on first item |
| 14 | KB: End goes to last item | Focus on last item |
| 15 | KB: Tab traps focus | Focus cycles within menu |
| 16 | Click outside closes menu | Menu closes |

### Test File 7: `useAuth.test.tsx` (extended)

**Path:** `src/features/auth/hooks/useAuth.test.tsx`

New describe blocks for Phase 3:
- `signup` dispatches `loginFulfilled` on success, dispatches `authFailed` on error
- `resetPassword` dispatches `loginFulfilled` on success, dispatches `authFailed` on expired token
- `forgotPassword` returns `ForgotPasswordResponse` on success, does NOT change Redux state

### Test File 8: `AuthFlow.test.tsx` (Integration)

**Path:** `src/features/auth/__tests__/authFlow.test.tsx`

Full cycle: signup → auto-login → profile → logout → login → profile. Uses `renderWithProviders` + `<MemoryRouter>` + MSW handlers.

### Test File 9: `test/msw/handlers/auth.test.ts`

**Path:** `test/msw/handlers/auth.test.ts`

MSW handler unit tests — verify mock responses:
- `POST /api/auth/login`: 200 for valid, 401 for invalid
- `POST /api/auth/signup`: 200 for valid, 409 for duplicate email
- `POST /api/auth/logout`: 200
- `POST /api/auth/forgot-password`: 200 for any email (no enumeration)
- `POST /api/auth/reset-password`: 200 for valid token, 400 for expired
- `GET /api/auth/session`: 200 for valid auth header, 401 without

### E2E Test Files (Playwright)

| File | Path | Scenarios |
|---|---|---|
| `e2e/auth/signup.spec.ts` | `/signup` | Fill form, submit, redirect to `/login` with success toast; validation errors; duplicate email |
| `e2e/auth/login.spec.ts` | `/login` | Fill form, redirect to `/dashboard`; invalid credentials; redirect from protected route |
| `e2e/auth/forgot-password.spec.ts` | `/forgot-password` | Submit email, success message; validation error |
| `e2e/auth/logout.spec.ts` | (authenticated) | Profile menu → sign out → redirect to `/login`; Escape closes menu |
| `e2e/auth/session-expiry.spec.ts` | (authenticated) | Expired token → redirect to `/login`; `?next=` query param preserved |

### Axe-core checks (extend `e2e/axe.spec.ts`)

| Route | Setup | Wait condition | Manual check |
|---|---|---|---|
| `/signup` | Clear localStorage | Heading "Sign Up" | Tab order: Name→Email→Password→Confirm→Submit; error focus |
| `/forgot-password` | Clear localStorage | Heading "Forgot Password" | Success message focus |
| `/reset-password` | Clear, navigate with `?token=valid` | Submit button visible | Missing token error state |
| `/settings` | Seed session | Heading "Settings" | ProfileMenu keyboard nav |
| `/login` (error) | Submit invalid creds | `role="alert"` visible | Error summary focus |

### Supporting files to create/update

| File | Action | Contents |
|---|---|---|
| `test/msw/handlers/auth.ts` | **Expand** | Add signup, forgot-password, reset-password, session endpoints |
| `test/msw/fixtures/auth.ts` | **Create** | `testUserAlice`, `testSessionAlice`, `validSignupInput`, `validResetInput`, `expiredSession` |
| `e2e/utils/mockApi.ts` | **Enhance** | Add `seedSession(page, session)` and `clearSession(page)` helpers |

### Coverage gates

| File | Lines | Branches | Functions |
|---|---|---|---|
| `src/features/auth/api/authApi.ts` | 80% | 75% | 80% |
| `src/features/auth/components/PasswordStrengthIndicator.tsx` | 100% | 100% | 100% |
| `src/features/auth/components/SignupForm.tsx` | 90% | 85% | 100% |
| `src/features/auth/components/ForgotPasswordForm.tsx` | 90% | 85% | 100% |
| `src/features/auth/components/ResetPasswordForm.tsx` | 90% | 85% | 100% |
| `src/features/auth/components/SessionCheck.tsx` | 85% | 80% | 100% |
| `src/features/auth/components/ProfileMenu.tsx` | 90% | 85% | 100% |
| `src/features/auth/hooks/useAuth.ts` | 80% | 75% | 80% |
| `src/features/auth/slice/authSlice.ts` | 90% | 80% | 100% |
| `test/msw/handlers/auth.ts` | 85% | N/A | 85% |

**Total new tests:** ~84 (not counting preserved existing useAuth tests)

---

## Accessibility Compliance Matrix

*Generated by accessibility-agent*

### 1. PasswordStrengthIndicator

| WCAG SC | Requirement | Pass Criteria | Verification Method |
|---|---|---|---|
| 1.1.1 | Bar segments have text equivalent | Text label per tier (None/Weak/Fair/Strong/Very strong) | `screen.getByText('Weak')` |
| 1.4.1 | Color not sole differentiator | Text label + optional pattern per tier | Manual inspection |
| 1.4.3 | Segments have 3:1 contrast | Bar fill even at lowest tier has sufficient contrast | axe `color-contrast` |
| 4.1.2 | Progressbar exposes correct semantics | `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={4}`, `aria-label="Password strength"` | axe `aria-valid-attr` |
| 4.1.3 | Dynamic changes announced | `aria-live="polite"` region + `aria-atomic="true"` | Manual: type password, verify SR announces |

**Recommended ARIA pattern:**
```tsx
<>
  <div role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={4} aria-label="Password strength">
    {segments}
  </div>
  <span role="status" aria-live="polite" aria-atomic="true">
    {password ? `Password strength: ${label}` : ''}
  </span>
</>
```

### 2. SignupForm

| WCAG SC | Requirement | Pass Criteria |
|---|---|---|
| 1.3.1 | Programmatic label-field association | `<label htmlFor={id}>` on all 4 fields |
| 1.4.3 | Error text ≥ 4.5:1 | Check error summary contrast; `#dc2626` on `#fecaca` may be only ~2.5:1 |
| 1.4.10 | No horizontal scroll at 320px | Form `max-width: 24rem` with stacking — pass |
| 2.1.1 | All fields keyboard reachable | Tab: Name→Email→Password→Confirm→Submit |
| 2.4.7 | Visible focus ring | `:focus-visible` outline ≥ 2px |
| 3.3.1 | Errors described inline | Each field shows error with `role="alert"` |
| 3.3.2 | Labels visible and persistent | Labels always visible (not placeholder) |
| 4.1.3 | Submission status announced | `aria-busily="true"` on form; button text changes |
| 2.5.3 | Button accessible name matches text | "Sign Up" / "Signing up…" |

**Critical pre-implementation directives:**
- Root error summary must be tabbable (`tabIndex={-1}`) and auto-focused after submission failure
- Submit button `disabled` + text "Signing up…"; form gets `aria-busy="true"`
- Dispatch success toast before navigation to `/login`
- `autocomplete` attributes: `name`, `email`, `new-password`, `new-password`

### 3. ForgotPasswordForm

| WCAG SC | Requirement | Pass Criteria |
|---|---|---|
| 1.3.1 | Single field labeled | `<label htmlFor="forgot-email">` |
| 2.4.4 | "Back to sign in" link purpose clear | `<Link to="/login">Back to sign in</Link>` |
| 3.3.2 | Visible label + optional hint | Consider "Enter your account email address" |
| 4.1.3 | Success message announced | `<div role="status">` with API message; focus moved to it |

### 4. ResetPasswordForm

| WCAG SC | Requirement | Pass Criteria |
|---|---|---|
| 1.3.1 | Hidden token field labeled | Use `aria-label="Reset token"` on hidden input |
| 3.3.3 | Specific match error on confirmPassword | "Passwords do not match" |
| 4.1.3 | Invalid token error announced | Error in `role="alert"`, focused on render |

**Edge cases:**
- **Missing token in URL**: render `role="alert"` error + link to `/forgot-password` without mounting form
- **Invalid token format**: show error before API call if token too short

### 5. SessionCheck

No direct a11y impact — renders `{children}` directly, no DOM wrapper.

### 6. ProfileMenu (Enhanced)

| WCAG SC | Requirement | Pass Criteria |
|---|---|---|
| 1.1.1 | Avatar has alt or initials announced | If `<img>`: `alt={user.name}`. If initials: `aria-label` on parent |
| 1.3.1 | Menu items grouped semantically | `role="menu"` on `<ul>`, `role="menuitem"` on items |
| 1.4.11 | Menu border contrast ≥ 3:1 | Darker border needed if using `#e2e8f0` on white (1.4:1 — FAIL) |
| 2.1.1 | All items keyboard operable | Arrow keys, Home/End, Enter/Space, Escape |
| 2.1.2 | No keyboard trap | Escape closes, focus returns to trigger |
| 2.4.3 | Open moves focus to first item | `useLayoutEffect` on open |
| 2.4.11 | Focus not obscured | `z-index: 300` on menu |
| 4.1.2 | Trigger correctly identified | `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` |

**Existing ProfileMenu issues to fix:**
| Issue | Fix |
|---|---|
| No `aria-labelledby` on menu | Add `aria-labelledby={TRIGGER_ID}` |
| Email `<li>` no `role="menuitem"` | Add `role="menuitem" aria-disabled="true" tabIndex={-1}` |
| No arrow key navigation | Implement `onKeyDown` handler |
| No focus management on open | `useLayoutEffect` to focus first item |
| No Settings item | Add `<button role="menuitem">Settings</button>` |
| No focus trap | Tab cycles within menu items |
| No close-on-blur with `relatedTarget` | Implement `onBlur` handler |
| No `aria-label` on trigger | `aria-label="User menu for {user.name}"` |
| Trigger has no `id` | Add `id={TRIGGER_ID}` for `aria-labelledby` |

### 7. TopBar (Enhanced)

- Replace `<span className={styles.userName}>{user.name}</span>` with `<ProfileMenu>`
- When `user` is null, show `<Link to="/login">Sign in</Link>` (keyboard accessible)

### 8. General Page-Level Requirements

| Requirement | Implementation |
|---|---|
| Skip link | Already in `AppShell` targeting `#main-content` — pass |
| Page title | Each new page sets `<title>` via `useEffect`: "Sign Up — TCSgon", "Forgot Password — TCSgon", "Reset Password — TCSgon", "Settings — TCSgon" |
| Heading hierarchy | Exactly one `<h1>` per page from `AuthLayout` |
| Focus on route change | `AuthLayout` uses `useLayoutEffect` + `ref.focus()` on `<h1 tabIndex={-1}>` |
| Consistent navigation | TopBar + ProfileMenu consistent across all authed pages |

### Testing — jest-axe patterns

Consider adding `vitest-axe` (or `@axe-core/vitest`) for component-level a11y assertions. Current project uses `@axe-core/playwright` for E2E axe audits only.

---

## Performance Audit

*Generated by performance-agent*

**Status:** ✅ Pass — no blocking-performance issues found

### 1. Bundle Budget Analysis

| Route | Status | Est. gzip (new) | Total route gzip | Budget (warn/error) | Status |
|---|---|---|---|---|---|
| `/login` | Modified | 0 KB | ~178 KB | 200 / 350 KB | ✅ |
| `/signup` | **NEW** | ~4.5 KB | ~182.5 KB | 200 / 350 KB | ✅ |
| `/forgot-password` | **NEW** | ~2.3 KB | ~180.3 KB | 200 / 350 KB | ✅ |
| `/reset-password` | **NEW** | ~3.0 KB | ~181 KB | 200 / 350 KB | ✅ |
| `/settings` | Enhanced | ~0.5 KB | ~178.5 KB | 200 / 350 KB | ✅ |

**Critical note:** Auth hooks (`authApi.ts` + `useAuth.ts`) shift from per-page (loaded only on `/login`) to **eager** because `SessionCheck` is mounted in `AppShell`. This is the **right trade-off**: these hooks are shared infrastructure (used by ProfileMenu, guards, LoginPage, SignupPage) and the hooks total only ~2.5 KB gzip. Loading them eagerly avoids redundant fetching across pages.

#### Detailed new code sizing

| File | Raw | Est. gzip |
|---|---|---|
| `PasswordStrengthIndicator.tsx` + CSS | ~2.5 KB | ~0.8 KB |
| `SignupForm.tsx` + CSS | ~9 KB | ~2.8 KB |
| `ForgotPasswordForm.tsx` + CSS | ~5 KB | ~1.5 KB |
| `ResetPasswordForm.tsx` + CSS | ~7 KB | ~2.2 KB |
| `SignupPage.tsx` | ~1.5 KB | ~0.5 KB |
| `ForgotPasswordPage.tsx` | ~1 KB | ~0.3 KB |
| `ResetPasswordPage.tsx` | ~2 KB | ~0.7 KB |
| `SessionCheck.tsx` | ~2 KB | ~0.7 KB |
| Enhanced `ProfileMenu.tsx` | ~+3 KB raw | ~+1 KB |
| Enhanced `TopBar.tsx` | ~+0.3 KB | ~+0.1 KB |
| **Total new code** | **~33.3 KB raw** | **~10.6 KB gzip** |

### 2. Render Cost Analysis

#### PasswordStrengthIndicator (highest scrutiny)
- Algorithm: O(n) with n ≤ 200 (4 char-class scans per render)
- Executes on every render when form `watch('password')` changes
- **Risk: Low** — Mitigation: add `useDeferredValue(password)` + `useMemo` for score calculation

```typescript
// Prophylactic mitigation (3 lines):
const deferredPassword = useDeferredValue(password);
const strength = useMemo(() => scorePassword(deferredPassword), [deferredPassword]);
```

#### SignupForm
- React Hook Form `mode: 'onTouched'` — validation on blur, not every keystroke
- Zod `.refine()` only runs when either password or confirmPassword validated
- **Risk: None**

#### ProfileMenu
- `useState(false)` — conditional rendering, `null` when closed
- Keyboard nav uses `useCallback` handlers
- **Risk: None**

#### SessionCheck → useSession → Redux bridge
- `staleTime: 5 * 60 * 1000` — refetch at most once per 5 min
- `retry: false` — no retry cascade
- Effect deps change only on query status change
- **Risk: None**

#### TopBar → ProfileMenu
- Replacing `<span>` with `<ProfileMenu>` adds negligible DOM
- **Risk: None**

### 3. Code-Splitting Strategy ✅

| Element | Strategy | Status |
|---|---|---|
| `SignupPage` | `React.lazy(() => import(...))` | ✅ In spec |
| `ForgotPasswordPage` | `React.lazy(() => import(...))` | ✅ In spec |
| `ResetPasswordPage` | `React.lazy(() => import(...))` | ✅ In spec |
| Auth forms | Loaded as part of page chunk | ✅ Correct |
| `vendor-forms` chunk | Already configured in vite.config.ts | ✅ |
| Auth hooks (shared) | Loaded eagerly via SessionCheck | ✅ Intentional |

### 4. Risk Assessment

| # | Risk | Severity | Likelihood | Mitigation | Residual |
|---|---|---|---|---|---|
| R1 | PasswordStrengthIndicator jank on keystroke | Low | Medium | Add `useDeferredValue` | Negligible |
| R2 | Auth hooks in eager bundle (+2.5 KB) | Low | Certain | Trade-off accepted | ✅ Acceptable |
| R3 | vendor-forms (35 KB) on first auth page visit | Low | Medium | Cached after first load | ✅ Acceptable |
| R4 | Duplicate mutation boilerplate (~0.4 KB waste) | Trivial | Certain | Not worth extracting yet | ✅ Acceptable |
| R5 | useEffect fires on mount even if cached match | Low | Certain | Immer = no re-render | ✅ Acceptable |
| R6 | CSS module files add ~0.3 KB gzip each | Low | Certain | Vite tree-shakes unused CSS | ✅ Acceptable |

### 5. Measurement Plan

#### Pre-implementation baseline
```bash
pnpm build:analyze    # generates dist/stats.html
```
Record per-route gzip sizes in `docs/perf/phase-3-auth-baseline.md`.

#### Post-implementation comparison
```bash
pnpm build:analyze
# Verify all routes under 200 KB gzip
```

#### CWV measurement
```bash
pnpm lhci          # runs Lighthouse CI
```
Targets per route: LCP < 2.5s, INP < 200ms, CLS < 0.1, TBT < 200ms.

#### Render profiling
- Open React DevTools → Profiler
- Navigate to `/signup`, type 10 chars into password field rapidly
- Record PasswordStrengthIndicator render time (expect < 1ms)
- If > 2ms on 4x throttled CPU: apply `useDeferredValue`

### Acceptance Gates

| Gate | Command | Criterion |
|---|---|---|
| Bundle budget | `pnpm build --mode analyze` | Each route < 200 KB gzip |
| CWV | `pnpm lhci` | LCP < 2.5s, INP < 200ms, CLS < 0.1 |
| Render cost | React DevTools Profiler | No component renders > 2ms on keystroke |
| TypeScript | `pnpm typecheck` | Zero errors |
| Tests | `pnpm test:run --coverage` | Lines ≥ 80%, branches ≥ 75% |

**Summary:** Phase 3 has no blocking performance issues. Total new code: ~10.6 KB gzip spread across 5 routes and 1 eager component. Every new route stays > 17 KB under the 200 KB warn threshold. One minor recommendation: add `useDeferredValue` to `PasswordStrengthIndicator` as a prophylactic measure (3 lines).

---

## Existing UI Data Contracts

> **Purpose:** The TCSgon UI already renders data for Projects, Dashboard, and User settings. These are the exact shapes the frontend expects — documented here so Phase 3a's backend schema can be designed with these contracts in mind, and future phases know the precise API surface.
>
> All non-auth endpoints are currently served by MSW handlers (unit tests) or `mockApi.ts` (E2E). Real server endpoints for projects and dashboard are planned for Phase 4+.

### Entity: `Project`

**Zod schema** (in `src/features/projects/types/index.ts`):

```typescript
export const ProjectStatusSchema = z.enum(['active', 'paused', 'completed', 'archived']);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectSchema = z.object({
  id: z.string().min(1).transform(asProjectId),  // branded ProjectId
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  status: ProjectStatusSchema,
  leadName: z.string().min(1).max(120),
  memberCount: z.number().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof ProjectSchema>;
```

**UI display locations:**

| Field | Display location |
|---|---|
| `id` | URL param `/projects/:id`, table row key |
| `name` | Table cell, detail page title, form field |
| `description` | Detail page description, form textarea |
| `status` | Table badge, detail page, form select |
| `leadName` | Table meta text, detail page, form field |
| `memberCount` | Table column "Members", detail page |
| `createdAt` | Detail page "Created", sortable |
| `updatedAt` | Table column "Updated", sortable |

### Payload: `ProjectInput` (create/update)

```typescript
export const ProjectInputSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  description: z.string().max(2000).optional(),
  status: ProjectStatusSchema.optional().default('active'),
  leadName: z.string().min(1, 'Lead name is required.').max(120),
});
export type ProjectInput = z.infer<typeof ProjectInputSchema>;
```

Note: `memberCount` is NOT part of the input — it's computed by the server.

### Paginated list: `ProjectListResponse`

```typescript
export interface ProjectListResponse {
  readonly items: ReadonlyArray<Project>;
  readonly total: number;       // nonnegative — total matching records
  readonly page: number;        // positive int — current page
  readonly pageSize: number;    // positive int — items per page
  readonly totalPages: number;  // positive int — derived from total/pageSize
}
```

**Query parameters** for `GET /projects`:

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | 1 | Page number (1-indexed) |
| `pageSize` | `number` | 3 | Items per page (hardcoded in UI, clamped 1–100 in hook) |
| `sort` | `'name' \| 'status' \| 'createdAt' \| 'updatedAt'` | `'updatedAt'` | Sort field |
| `order` | `'asc' \| 'desc'` | `'desc'` | Sort direction |
| `search` | `string` | `''` | Full-text search (implementation-defined) |
| `status` | `ProjectStatus` | `undefined` (all) | Filter by status |

### Entity: `DashboardStats`

**Zod schema** (in `src/features/dashboard/api/dashboardApi.ts`):

```typescript
export const DashboardStatsSchema = z.object({
  totalProjects: z.number().nonnegative(),
  activeProjects: z.number().nonnegative(),
  teamMembers: z.number().nonnegative(),
  completionRate: z.number().min(0).max(100),
  recentActivity: z.array(RecentActivitySchema),
});
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
```

### Entity: `RecentActivity` (nested in DashboardStats)

```typescript
export const ActivityTypeSchema = z.enum([
  'project_created',
  'project_updated',
  'status_changed',
  'member_added',
]);

export const RecentActivitySchema = z.object({
  id: z.string().min(1),
  type: ActivityTypeSchema,
  message: z.string().min(1),
  createdAt: z.string().datetime(),
  projectId: z.string().min(1),
});
```

**UI display:** `RecentActivityList` component — `message` as main text, `createdAt` as relative time ("5m ago"). `type` and `projectId` reserved for future navigation links.

### HTTP Contract Summary (non-auth)

| Method | URL | Request | Response | UI Hook | Status |
|---|---|---|---|---|---|
| `GET` | `/projects` | Query params | `ProjectListResponse` | `useProjects()` | **Deferred** — needs server endpoint |
| `GET` | `/projects/:id` | — | `Project` | `useProject()` | **Deferred** — needs server endpoint |
| `POST` | `/projects` | `ProjectInput` | `Project` (201) | `useCreateProject()` | **Deferred** — needs server endpoint |
| `PUT` | `/projects/:id` | `ProjectInput` | `Project` | `useUpdateProject()` | **Deferred** — needs server endpoint |
| `DELETE` | `/projects/:id` | — | `void` (204) | `useDeleteProject()` | **Deferred** — needs server endpoint |
| `GET` | `/dashboard/stats` | — | `DashboardStats` | `useDashboardStats()` | **Deferred** — needs server endpoint |

### Cross-feature invalidation

All project mutations (`create`, `update`, `delete`) also invalidate `['dashboard', 'stats']` on success. This is handled at the React Query level (in the mutation's `onSuccess` callback), not by the server.

### Existing data flow (without real server)

Currently all non-auth endpoints are served by:
- **MSW handlers** (`test/msw/handlers/`) — used in unit/integration tests
- **`e2e/utils/mockApi.ts`** — used in E2E tests for deterministic state
- **`src/test-utils.tsx`** `renderWithProviders` — wraps tests with MSW server

When real server endpoints ship, the MSW handlers become test-only fallbacks and the E2E mock API is used only for scenarios needing deterministic state (error states, edge cases).

### Future considerations

| Consideration | When |
|---|---|
| `Project` model + CRUD endpoints on server | Phase 4+ |
| `DashboardStats` aggregate endpoint on server | Phase 4+ |
| `memberCount` — derived from project-team join table, or hardcoded | Phase 4+ design decision |
| `completionRate` — derived from project statuses or separate metric | Phase 4+ design decision |
| `RecentActivity` — event-sourced or computed from project audit log | Phase 4+ design decision |
