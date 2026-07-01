# Plan — Phase 2: Server State, Dashboard, E2E, Performance, Feature Module

**Status:** Reviewed — ready for implementation. See §14 for resolved decisions.
**Scope:** Builds on Phase 1's auth, API client, routing, Redux, and UI shell to deliver real server-state integration, a data-driven dashboard, Playwright E2E critical paths, performance baselining, and the first concrete CRUD feature module.
**Owning agents:** architecture → typescript → react → testing → accessibility → performance.

---

## How to read this plan

| § | Section | Owning agent |
|---|---|---|
| 1 | Module map (runtime) | architecture |
| 2 | Folder structure (all new/modified files) | architecture |
| 3 | Module dependencies | architecture |
| 4 | State decision | architecture |
| 5 | Architecture risks | architecture |
| 6 | Interfaces & TypeScript contracts | typescript |
| 7 | React component & hook specifications | react |
| 8 | Test inventory | testing |
| 9 | E2E critical paths | testing |
| 10 | Accessibility checkpoints | accessibility |
| 11 | Performance baselining | performance |
| 12 | Phasing within Phase 2 | all |

---

## 1. Module map (runtime)

```
                    ┌──────────────────────────────────────────┐
                    │  Phase 1 Infrastructure (unchanged)      │
                    │  ┌────────────────────────────────────┐  │
                    │  │ main.tsx                            │  │
                    │  │ <ReduxProvider>                     │  │
                    │  │  <QueryClientProvider>              │  │
                    │  │   <ApiClientProvider>               │  │
                    │  │    <App />                          │  │
                    │  └────────────────────────────────────┘  │
                    └──────────────┬───────────────────────────┘
                                   │
                                   ▼
          ┌──────────────────────────────────────────────┐
          │  Phase 2 Additions                           │
          │                                              │
          │  ┌─────────────────┐    ┌─────────────────┐  │
          │  │ features/dashboard │  │ features/projects│  │
          │  │ (replaces stub)  │  │ (new CRUD module)│  │
          │  └────────┬────────┘  └────────┬────────┘  │
          │           │                     │           │
          │           ▼                     ▼           │
          │  ┌────────────────────────────────────┐     │
          │  │  features/<name>/api/<name>Api.ts   │     │
          │  │  React Query hooks + Zod schemas    │     │
          │  └────────┬───────────────────────────┘     │
          │           │                                 │
          │           ▼                                 │
          │  ┌──────────────────────────────┐           │
          │  │  shared/api/client.ts        │           │
          │  │  (Phase 1 — unchanged)       │           │
          │  └──────────────────────────────┘           │
          │                                              │
          │  ┌──────────────────────────────┐           │
          │  │  test/msw/handlers.ts        │           │
          │  │  (expanded for new endpoints)│           │
          │  └──────────────────────────────┘           │
          │                                              │
          │  ┌──────────────────────────────┐           │
          │  │  docs/perf/<date>-baseline.md│           │
          │  │  Lighthouse CI config         │           │
          │  └──────────────────────────────┘           │
          └──────────────────────────────────────────────┘
                                   │
                                   ▼
          ┌──────────────────────────────────────────────┐
          │  E2E (Playwright, expanded)                   │
          │  e2e/login.spec.ts, e2e/dashboard.spec.ts,    │
          │  e2e/projects.spec.ts                          │
          └──────────────────────────────────────────────┘
```

Key data flow: every feature module owns a set of React Query hooks that call `shared/api/client`. Zod schemas validate responses. MSW handlers mirror every endpoint for tests. Redux is **not** written to by feature hooks — server state lives exclusively in React Query cache.

---

## 2. Folder structure (exact paths)

All new/modified files Phase 2 ships.

### 2.1 New files

| Path | Purpose |
|---|---|
| `src/features/dashboard/api/dashboardApi.ts` | `useDashboardStats` query hook + Zod schema |
| `src/features/dashboard/api/dashboardApi.test.ts` | Hook tests with MSW |
| `src/features/dashboard/components/StatCard.tsx` | Single metric card (value, label, trend) |
| `src/features/dashboard/components/StatCard.module.css` | Card styles |
| `src/features/dashboard/components/StatCard.test.tsx` | RTL tests |
| `src/features/dashboard/components/StatGrid.tsx` | Responsive grid of StatCards |
| `src/features/dashboard/components/StatGrid.module.css` | Grid layout |
| `src/features/dashboard/components/StatGrid.test.tsx` | RTL tests |
| `src/features/dashboard/components/RecentActivityList.tsx` | Table of recent items |
| `src/features/dashboard/components/RecentActivityList.module.css` | List styles |
| `src/features/dashboard/components/RecentActivityList.test.tsx` | RTL tests |
| `src/features/dashboard/components/DashboardSkeleton.tsx` | Loading skeleton composition |
| `src/features/dashboard/components/DashboardSkeleton.test.tsx` | RTL tests |
| `src/features/dashboard/hooks/useDashboard.ts` | Combines queries into a single view-model |
| `src/features/dashboard/pages/DashboardPage.tsx` | **Replaces** the Phase 1 stub |
| `src/features/dashboard/pages/DashboardPage.test.tsx` | Integration test |
| `src/features/dashboard/index.ts` | Public barrel |
| `src/features/projects/api/projectsApi.ts` | `useProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, `useDeleteProject` + Zod schemas |
| `src/features/projects/api/projectsApi.test.ts` | Hook tests with MSW |
| `src/features/projects/types/index.ts` | `Project`, `ProjectInput`, `ProjectStatus` types (derived from Zod) |
| `src/features/projects/components/ProjectList.tsx` | Sortable, keyboard-navigable table |
| `src/features/projects/components/ProjectList.module.css` | Table styles |
| `src/features/projects/components/ProjectList.test.tsx` | RTL tests |
| `src/features/projects/components/ProjectDetail.tsx` | Read-only detail view |
| `src/features/projects/components/ProjectDetail.module.css` | Detail styles |
| `src/features/projects/components/ProjectDetail.test.tsx` | RTL tests |
| `src/features/projects/components/ProjectForm.tsx` | RHF + Zod create/edit form |
| `src/features/projects/components/ProjectForm.module.css` | Form styles |
| `src/features/projects/components/ProjectForm.test.tsx` | RTL tests |
| `src/features/projects/hooks/useProjects.ts` | Convenience hook over multiple queries |
| `src/features/projects/pages/ProjectListPage.tsx` | Route page — list + create CTA |
| `src/features/projects/pages/ProjectListPage.test.tsx` | Integration test |
| `src/features/projects/pages/ProjectDetailPage.tsx` | Route page — detail + edit |
| `src/features/projects/pages/ProjectDetailPage.test.tsx` | Integration test |
| `src/features/projects/pages/ProjectCreatePage.tsx` | Route page — creation form |
| `src/features/projects/pages/ProjectEditPage.tsx` | Route page — edit form |
| `src/features/projects/index.ts` | Public barrel |
| `src/shared/components/EmptyState.tsx` | Reusable empty state (icon, heading, description, CTA) |
| `src/shared/components/EmptyState.module.css` | Styles |
| `src/shared/components/EmptyState.test.tsx` | RTL tests |
| `src/shared/components/ErrorDisplay.tsx` | Reusable API error display (retry button, message) |
| `src/shared/components/ErrorDisplay.module.css` | Styles |
| `src/shared/components/ErrorDisplay.test.tsx` | RTL tests |
| `src/shared/components/DataTable.tsx` | Accessible sortable table with sticky header |
| `src/shared/components/DataTable.module.css` | Table styles |
| `src/shared/components/DataTable.test.tsx` | RTL tests |
| `src/shared/components/Pagination.tsx` | Page navigation with `aria-current="page"` |
| `src/shared/components/Pagination.module.css` | Pagination styles |
| `src/shared/components/Pagination.test.tsx` | RTL tests |
| `src/shared/components/ConfirmDialog.tsx` | `role="alertdialog"` confirmation modal |
| `src/shared/components/ConfirmDialog.module.css` | Dialog styles |
| `src/shared/components/ConfirmDialog.test.tsx` | RTL tests |
| `src/shared/hooks/useConfirm.ts` | Imperative confirm dialog hook |
| `src/shared/hooks/useConfirm.test.tsx` | RTL tests |
| `test/msw/handlers/dashboard.ts` | MSW handlers for dashboard endpoints |
| `test/msw/handlers/projects.ts` | MSW handlers for projects CRUD |
| `test/msw/handlers/auth.ts` | MSW handlers for auth endpoints (login, session, logout) |
| `test/msw/handlers/index.ts` | Barrel combining all handler sets |
| `test/msw/server.ts` | `setupServer(...handlers)` exported |
| `e2e/login.spec.ts` | Login happy + error paths |
| `e2e/dashboard.spec.ts` | Dashboard loads data, stat cards visible |
| `e2e/projects.spec.ts` | CRUD journey through projects |
| `docs/perf/phase-2-baseline.md` | Lighthouse + bundle baseline measurements |
| `lighthouserc.cjs` | Lighthouse CI config |
| `.github/workflows/ci.yml` | CI with lint + typecheck + test + coverage + build + a11y + e2e + bundle check |

### 2.2 Modified files

| Path | Change |
|---|---|
| `src/features/auth/pages/DashboardPage.tsx` | **Deleted** — replaced by `features/dashboard/` |
| `src/routes/index.tsx` | Add `/dashboard` → `DashboardPage` from new module; add `/projects`, `/projects/new`, `/projects/:id`, `/projects/:id/edit` |
| `src/main.tsx` | No changes needed — already wired in Phase 1 (line 36) |
| `src/test-setup.ts` | Import MSW server, `beforeAll(server.listen)`, `afterEach(server.reset)` |
| `playwright.config.ts` | May need minor updates for test timeouts on data-loading specs |
| `package.json` | Add `"lhci": "lhci autorun"` script |
| `src/store/slices/uiSlice.ts` | No changes expected (Phase 2 does not extend UI state) |
| `src/shared/api/schemas.ts` | No changes needed — schemas are co-located in feature modules |
| `src/shared/types/user.ts` | No changes (already complete) |
| `src/shared/types/brand.ts` | Add `ProjectId` branded type |
| `vite.config.ts` | Add `rollupOptions.output.manualChunks` for route-based code splitting |

---

## 3. Module dependencies

```
main.tsx
  └─▶ App.tsx
        └─▶ RouterProvider (routes/index.tsx)
              ├─▶ features/dashboard/pages/DashboardPage
              │     ├─▶ features/dashboard/hooks/useDashboard
              │     │     └─▶ features/dashboard/api/dashboardApi
              │     │           ├─▶ shared/api/client
              │     │           └─▶ shared/api/schemas
              │     ├─▶ features/dashboard/components/StatGrid
              │     │     └─▶ features/dashboard/components/StatCard
              │     ├─▶ features/dashboard/components/RecentActivityList
              │     ├─▶ features/dashboard/components/DashboardSkeleton
              │     ├─▶ shared/components/ErrorDisplay
              │     └─▶ shared/components/EmptyState
              │
              ├─▶ features/projects/pages/ProjectListPage
              │     ├─▶ features/projects/hooks/useProjects
              │     │     └─▶ features/projects/api/projectsApi
              │     │           ├─▶ shared/api/client
              │     │           └─▶ shared/api/schemas
              │     ├─▶ features/projects/components/ProjectList
              │     ├─▶ shared/components/EmptyState
              │     ├─▶ shared/components/DataTable
              │     ├─▶ shared/components/Pagination
              │     ├─▶ shared/components/ErrorDisplay
              │     └─▶ shared/components/Spinner
              │
              ├─▶ features/projects/pages/ProjectDetailPage
              │     ├─▶ features/projects/hooks/useProjects
              │     ├─▶ features/projects/components/ProjectDetail
              │     └─▶ shared/components/ErrorDisplay
              │
              ├─▶ features/projects/pages/ProjectCreatePage
              │     ├─▶ features/projects/hooks/useProjects
              │     ├─▶ features/projects/components/ProjectForm
              │     │     └─▶ shared/components/ErrorDisplay
              │     └─▶ shared/hooks/useToast
              │
              └─▶ features/projects/pages/ProjectEditPage
                    ├─▶ features/projects/hooks/useProjects
                    ├─▶ features/projects/components/ProjectForm
                    └─▶ shared/hooks/useToast

test/msw/handlers/index.ts
  ├─▶ test/msw/handlers/dashboard
  ├─▶ test/msw/handlers/projects
  ├─▶ test/msw/handlers/auth
  └─▶ (Phase 1 auth handlers migrated here)

shared/components/DataTable
  └─▶ shared/components/Pagination (conditional)

shared/hooks/useConfirm
  (no external deps — local state only)
```

**No cycles. No upward arrows.** Features import `shared/*` and `store/hooks` (for `useToast`/`useAppDispatch` only). No feature imports another feature.

---

## 4. State decision

| State | Owner | Justification |
|---|---|---|
| **Server data (stats, projects, activity)** | React Query | Pure server state. Cache invalidation, refetch, stale-while-revalidate, and optimistic updates are RQ's domain. Never duplicated into Redux. |
| **Auth (user, token, status)** | Redux `authSlice` | **Unchanged from Phase 1.** Crosses 3+ trees (router guard, TopBar, every page). Phase 2 does not move auth to RQ — synchronous guard on route transitions requires Redux. |
| **UI theme, sidebar, toasts, modals** | Redux `uiSlice` | **Unchanged from Phase 1.** |
| **Dashboard filter / date range** | Local `useState` in `DashboardPage` | One component tree. Not shared data. Resets on navigation. |
| **Project list search / sort / page** | URL search params (`useSearchParams`) | Bookmarkable, shareable, survives reload. RQ query key derives from URL. |
| **Project form dirty state** | React Hook Form internal | RHF-owned. Never lifted to Redux or RQ. |
| **Confirm dialog** | Local `useConfirm` hook + `ConfirmDialog` component | Single dialog at a time. Not global. Hook returns a promise — caller awaits user action. |

### Rationale for NOT moving auth to React Query

Phase 1 correctly placed auth in Redux. The `RequireAuth` guard needs synchronous access to `isAuthenticated` on every route transition. Reading from RQ cache would introduce a potentially stale or loading state on every navigation. The token is also needed by the API client's `getToken` resolver (injected at boot) — that resolver reads `store.getState().auth`. Moving auth to RQ would require either:

1. An extra middleware to sync token to a side channel, or
2. Making the API client async (breaking `RequestConfig`)

Neither is justified. Auth remains in Redux. Phase 2 does not change this decision.

---

## 5. Architecture risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | **RQ query key collision** between features | Namespace query keys: `['dashboard', 'stats']`, `['projects', 'list', filters]`. Enforce via factory functions. |
| 2 | **MSW handler duplication** between unit and E2E | Single source of truth in `test/msw/handlers/`. E2E tests can import and extend. Unit tests use `server.use()` for overrides. |
| 3 | **Stale dashboard data after project mutation** | Invalidate `['dashboard', 'stats']` on project create/update/delete mutation success. RQ `onSuccess` callback. |
| 4 | **Bundle budget blowup from shared components** | `DataTable`, `Pagination`, `ConfirmDialog` are eagerly loaded in shell chunk. Budget check in CI (Phase 2 sub-phase 4). Monitor with `vite build --analyze`. |
| 5 | **E2E flakiness from async data loading** | Use `waitFor` with `getByRole` patterns, never `page.waitForTimeout`. Mock API responses at the network level for deterministic E2E. |
| 6 | **Lighthouse CI false failures on first run** | Warm cache before measurement. Run 3 times, take median. Document baseline before adding budget assertions. |
| 7 | **Optimistic update rollback on project mutation failure** | RQ `onMutate` saves previous list; `onError` rolls back; `onSettled` refetches. Test this path in unit tests. |
| 8 | **Pagination + URL sync desync** | `useSearchParams` is source of truth. RQ query key includes `{ page, sort, filter }` from URL. On mutation (delete last item on page 3), redirect to page 2. |
| 9 | **ConfirmDialog focus trap** | `ConfirmDialog` uses `useModal`-style focus management. First focusable element (Cancel) gets focus on open. Return focus to trigger on close. |
| 10 | **`useDashboard()` re-render cascade** | Hook returns object; each caller picks only fields it needs. Use stable selector pattern. Profile before memoizing. |

---

## 6. Interfaces & TypeScript contracts

### 6.1 Branded types — additions

```ts
// src/shared/types/brand.ts
export type ProjectId = Brand<string, 'ProjectId'>;
export function asProjectId(s: string): ProjectId { return s as ProjectId; }
export function newProjectId(): ProjectId { return crypto.randomUUID() as ProjectId; }
```

### 6.2 Dashboard types

```ts
// src/features/dashboard/api/dashboardApi.ts
import { z } from 'zod';

export const DashboardStatsSchema = z.object({
  totalProjects: z.number().nonnegative(),
  activeProjects: z.number().nonnegative(),
  teamMembers: z.number().nonnegative(),
  completionRate: z.number().min(0).max(100),
  recentActivity: z.array(
    z.object({
      id: z.string().min(1),
      type: z.enum(['project_created', 'project_updated', 'status_changed', 'member_added']),
      message: z.string().min(1),
      createdAt: z.string().datetime(),
      projectId: z.string().min(1),
    }),
  ),
});
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// Query key factory
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => ['dashboard', 'stats'] as const,
};

// Hook return type
export interface UseDashboardStatsResult {
  readonly stats: DashboardStats | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: ApiError | null;
  readonly refetch: () => Promise<QueryResult<DashboardStats>>;
}
```

### 6.3 Project module types

```ts
// src/features/projects/types/index.ts
import { z } from 'zod';
import type { ProjectId } from '@/shared/types/brand';

export const ProjectStatusSchema = z.enum(['active', 'paused', 'completed', 'archived']);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectSchema = z.object({
  id: z.string().min(1).transform(asProjectId),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  status: ProjectStatusSchema,
  leadName: z.string().min(1).max(120),
  memberCount: z.number().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const ProjectInputSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  description: z.string().max(2000).optional(),
  status: ProjectStatusSchema.optional().default('active'),
  leadName: z.string().min(1, 'Lead name is required.').max(120),
});
export type ProjectInput = z.infer<typeof ProjectInputSchema>;

export interface ProjectListParams {
  readonly page: number;
 readonly pageSize: number;
  readonly sort?: 'name' | 'status' | 'createdAt' | 'updatedAt';
  readonly order?: 'asc' | 'desc';
  readonly search?: string;
  readonly status?: ProjectStatus;
}

export interface ProjectListResponse {
  readonly items: ReadonlyArray<Project>;
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
```

### 6.4 API hook signatures

```ts
// src/features/projects/api/projectsApi.ts

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => ['projects', 'list'] as const,
  list: (params: ProjectListParams) => ['projects', 'list', params] as const,
  details: () => ['projects', 'detail'] as const,
  detail: (id: ProjectId) => ['projects', 'detail', id] as const,
};

export function useProjects(params: ProjectListParams): {
  readonly data: ProjectListResponse | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: ApiError | null;
  readonly refetch: () => Promise<QueryResult<ProjectListResponse>>;
};

export function useProject(id: ProjectId): {
  readonly project: Project | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: ApiError | null;
};

export function useCreateProject(): {
  readonly mutate: (input: ProjectInput) => Promise<Project>;
  readonly isPending: boolean;
  readonly error: ApiError | null;
};

export function useUpdateProject(): {
  readonly mutate: (args: { id: ProjectId; input: ProjectInput }) => Promise<Project>;
  readonly isPending: boolean;
  readonly error: ApiError | null;
};

export function useDeleteProject(): {
  readonly mutate: (id: ProjectId) => Promise<void>;
  readonly isPending: boolean;
  readonly error: ApiError | null;
};
```

### 6.5 Shared component props

```ts
// src/shared/components/DataTable.tsx
export interface DataTableColumn<T> {
  readonly key: string;
  readonly label: string;
  readonly sortable?: boolean;
  readonly render: (item: T) => ReactNode;
  readonly align?: 'left' | 'right' | 'center';
  readonly width?: string;
}

export interface DataTableProps<T> {
  readonly columns: ReadonlyArray<DataTableColumn<T>>;
  readonly data: ReadonlyArray<T>;
  readonly sortKey?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly onSort?: (key: string, order: 'asc' | 'desc') => void;
  readonly isLoading?: boolean;
  readonly emptyState?: ReactNode;
  readonly onRowClick?: (item: T) => void;
  readonly rowKey: (item: T) => string;
  readonly label: string; // aria-label for the table
}

// src/shared/components/Pagination.tsx
export interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly label?: string; // aria-label
}

// src/shared/components/EmptyState.tsx
export interface EmptyStateProps {
  readonly icon?: ReactNode;
  readonly heading: string;
  readonly description?: string;
  readonly action?: { readonly label: string; readonly onClick: () => void };
}

// src/shared/components/ErrorDisplay.tsx
export interface ErrorDisplayProps {
  readonly error: ApiError | null;
  readonly onRetry?: () => void;
  readonly title?: string;
}

// src/shared/components/ConfirmDialog.tsx
export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly variant?: 'danger' | 'warning' | 'info';
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly isPending?: boolean;
}
```

### 6.6 Query hook return type (canonical shape used by all feature hooks)

```ts
// Pattern — every data hook returns this shape (or a subset):
export interface UseQueryResult<T> {
  readonly data: T | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: ApiError | null;
  readonly refetch: () => Promise<QueryResult<T>>;
}

// Mutation hooks return:
export interface UseMutationResult<TIn, TOut> {
  readonly mutate: (input: TIn) => Promise<TOut>;
  readonly isPending: boolean;
  readonly error: ApiError | null;
  readonly reset: () => void;
}
```

### 6.7 Page component props

```ts
// All page components — no props (React Router provides params via hooks)
export function DashboardPage(): ReactElement;
export function ProjectListPage(): ReactElement;
export function ProjectDetailPage(): ReactElement;
export function ProjectCreatePage(): ReactElement;
export function ProjectEditPage(): ReactElement;
```

---

## 7. React component & hook specifications

### 7.1 Dashboard components

| Component | Description | States | A11y notes |
|---|---|---|---|
| `StatCard` | Single KPI card with value, label, optional trend indicator | loading (skeleton), error, value, empty | `role="region"`, `aria-label="{label}"` |
| `StatGrid` | CSS Grid of StatCards, 1→2→4 columns responsive | loading (renders skeletons), empty, populated | Landmark `role="region" aria-label="Key metrics"` |
| `RecentActivityList` | Chronological list of recent actions | loading, empty, populated | `role="list"`, each item `role="listitem"` |
| `DashboardSkeleton` | Skeleton composition matching dashboard layout | shown when `isLoading` | `aria-hidden="true"`, `role="status"` on parent |
| `DashboardPage` | Orchestrator — renders StatGrid + RecentActivityList | loading, error (ErrorDisplay), empty, populated | `<main>` with `<h1>Dashboard</h1>` |

### 7.2 Project components

| Component | Description | States | A11y notes |
|---|---|---|---|
| `ProjectList` | Sortable table with pagination | loading (DataTable skeleton), empty (shared EmptyState), error (ErrorDisplay), populated | `<div role="region" aria-label="Projects list">` + `aria-describedby` on empty |
| `ProjectDetail` | Read-only field display | loading (skeleton), error, not-found, populated | `<dl>` for key-value pairs |
| `ProjectForm` | RHF create/edit form | idle, submitting, validation errors, server error | `<form noValidate>`, `aria-describedby` per field, error summary `role="alert"` |
| `ProjectListPage` | Route page | loads query → renders list | `useSearchParams` for sort/page/filter |
| `ProjectDetailPage` | Route page | loads query by `:id` → renders detail | Renders 404 if project not found |
| `ProjectCreatePage` | Route page | renders form → on submit navigates to list | Success toast via `useToast` |
| `ProjectEditPage` | Route page | loads project → renders pre-filled form | Success toast + navigate to detail |

### 7.3 Shared components

| Component | Description | States |
|---|---|---|
| `DataTable` | Generic sortable table with sticky header, loading, empty | loading (skeleton rows), empty, populated |
| `Pagination` | Page buttons with prev/next, ellipsis, `aria-current="page"` | single page, multi-page, first/last page |
| `EmptyState` | Centered icon + heading + description + optional CTA | static |
| `ErrorDisplay` | API error message + retry button | static |
| `ConfirmDialog` | `role="alertdialog"` for destructive actions | open, closed, submitting |

### 7.4 Hooks

| Hook | Returns | Implementation |
|---|---|---|
| `useDashboard()` | `{ stats, isLoading, isError, error, refetch }` | Wraps `useDashboardStats` from `dashboardApi`. Composes additional queries as needed in future phases. |
| `useProjectList(params)` | `{ data, isLoading, isError, error, refetch }` | Wraps `useProjects` from `projectsApi`. Derives params from URL. |
| `useProject(id)` | `{ project, isLoading, isError, error }` | Wraps `useProject` from `projectsApi` |
| `useCreateProject()` | `{ mutate, isPending, error, reset }` | Wraps `useCreateProject`. Invalidates `dashboardKeys.stats()` + `projectKeys.lists()` on success. |
| `useUpdateProject()` | `{ mutate, isPending, error, reset }` | Wraps `useUpdateProject`. Invalidates detail + list + dashboard. |
| `useDeleteProject()` | `{ mutate, isPending, error, reset }` | Wraps `useDeleteProject`. Optimistic removal from list. |
| `useConfirm()` | `{ confirm: (opts) => Promise<boolean> }` | Manages `ConfirmDialog` open/close via local state. Resolves promise on confirm/cancel. |

### 7.5 Re-render risk register

| Component | Risk | Mitigation |
|---|---|---|
| `StatGrid` | Receives `stats` object — re-renders on every RQ refetch | `React.memo` with shallow compare on `stats` (measured benefit: parent re-renders on RQ polling). Profile first. |
| `ProjectList` | Re-renders on every sort/page change | Each `DataTable` row uses stable `key={item.id}`. `ProjectList` parent uses URL search params — no prop changes between navigations. |
| `DataTable` | Receives new `data` reference on every query | Use `React.memo` on `DataTable` (pure render). Consider `useMemo` on column definitions. |
| `ProjectForm` | Controlled by RHF — local state only | RHF isolates re-renders to dirty fields. No parent re-render concern. |

**Rule:** No preemptive `React.memo`. Profile with React DevTools before memoizing. Document rationale if applied.

---

## 8. Test inventory

### 8.1 Unit & integration (Vitest + RTL + MSW)

| Module | Files | Tests | Coverage target |
|---|---|---|---|
| `features/dashboard/api/dashboardApi.test.ts` | 1 | 6 | 100% lines |
| `features/dashboard/components/StatCard.test.tsx` | 1 | 5 | 90% |
| `features/dashboard/components/StatGrid.test.tsx` | 1 | 4 | 90% |
| `features/dashboard/components/RecentActivityList.test.tsx` | 1 | 4 | 90% |
| `features/dashboard/components/DashboardSkeleton.test.tsx` | 1 | 2 | 90% |
| `features/dashboard/pages/DashboardPage.test.tsx` | 1 | 3 | 80% |
| `features/projects/api/projectsApi.test.ts` | 1 | 10 | 100% lines |
| `features/projects/components/ProjectList.test.tsx` | 1 | 6 | 90% |
| `features/projects/components/ProjectDetail.test.tsx` | 1 | 5 | 90% |
| `features/projects/components/ProjectForm.test.tsx` | 1 | 8 | 90% |
| `features/projects/pages/ProjectListPage.test.tsx` | 1 | 4 | 80% |
| `features/projects/pages/ProjectDetailPage.test.tsx` | 1 | 4 | 80% |
| `features/projects/pages/ProjectCreatePage.test.tsx` | 1 | 4 | 80% |
| `features/projects/pages/ProjectEditPage.test.tsx` | 1 | 4 | 80% |
| `shared/components/DataTable.test.tsx` | 1 | 8 | 95% |
| `shared/components/Pagination.test.tsx` | 1 | 6 | 95% |
| `shared/components/EmptyState.test.tsx` | 1 | 3 | 95% |
| `shared/components/ErrorDisplay.test.tsx` | 1 | 4 | 95% |
| `shared/components/ConfirmDialog.test.tsx` | 1 | 5 | 95% |
| `shared/hooks/useConfirm.test.tsx` | 1 | 3 | 95% |
| `test/msw/handlers/dashboard.test.ts` | 1 | 3 | — |
| `test/msw/handlers/projects.test.ts` | 1 | 5 | — |

**Estimated total Phase 2 tests:** ~103 new tests across 21 files.

**Coverage gate (aggregate):** ≥ 80% lines / 75% branches on `src/**` (same as Phase 1 — no regression).

### 8.2 MSW handlers

| Handler | Happy | Error | Validation |
|---|---|---|---|
| `GET /api/dashboard/stats` | `200 { stats }` | `500`, `401` | Schema mismatch |
| `GET /api/projects?page=&pageSize=` | `200 { items, total, page, totalPages }` | `500`, `401` | Invalid params |
| `GET /api/projects/:id` | `200 { project }` | `404`, `401` | Invalid id |
| `POST /api/projects` | `201 { project }` | `400`, `401`, `409` | Invalid body |
| `PUT /api/projects/:id` | `200 { project }` | `400`, `404`, `401`, `409` | Invalid body |
| `DELETE /api/projects/:id` | `204` | `404`, `401`, `409` | — |

Every handler is registered in `test/msw/handlers/index.ts` and imported by `test-setup.ts` so all tests get them automatically. Individual tests override via `server.use()`.

### 8.3 Test isolation rules

- Per-test `QueryClient` instance (via `renderWithProviders` with fresh `QueryClientProvider`) — no cache bleed between tests.
- `server.resetHandlers()` in `afterEach`.
- `localStorage.clear()` in `beforeEach`.
- `vi.useFakeTimers()` for auto-dismiss and polling tests.
- `vi.stubGlobal('crypto', ...)` for deterministic branded IDs.
- Every API hook test covers: loading, success, error, refetch.

---

## 9. E2E critical paths

| Journey | File | Assertions |
|---|---|---|
| Login happy | `e2e/login.spec.ts` | Fill email+password → submit → URL `/dashboard` → user name visible → localStorage has session |
| Login validation errors | `e2e/login.spec.ts` | Empty email → `aria-invalid="true"` on email; wrong password → error summary visible; stays on `/login` |
| Dashboard data load | `e2e/dashboard.spec.ts` | Navigate to `/dashboard` → stat cards visible with values → recent activity list populated → `axe` passes |
| Dashboard loading skeleton | `e2e/dashboard.spec.ts` | Slow-mock response → skeleton visible → replaced by content |
| Projects list | `e2e/projects.spec.ts` | Navigate to `/projects` → table renders → sort by name → paginate to page 2 → empty state if none |
| Projects CRUD journey | `e2e/projects.spec.ts` | Create new project → redirects to list → new project visible → click → detail page → edit → save → delete → confirm dialog → removed from list |
| Route guard | `e2e/auth-guard.spec.ts` | Unauth `/dashboard` → `/login?next=%2Fdashboard` → login → lands on `/dashboard` |
| 404 | Not new (Phase 1) | — |

**E2E patterns:**
- Use `page.waitForResponse()` for deterministic data loading, never `setTimeout`.
- Mock API via Playwright route interception or sign in to a seeded test user.
- `test.describe.serial` for CRUD journey (stateful).
- `@smoke` tag on login and dashboard specs (fast CI check).
- `@a11y` tag on dashboard and projects list (axe audit).

---

## 10. Accessibility checkpoints

| Component | WCAG SC | Pattern |
|---|---|---|
| `DataTable` | 1.3.1, 2.4.6, 4.1.2 | `<table>` with `<caption>` or `aria-label`, `<th scope="col">` with `aria-sort`, sort buttons inside `<th>` |
| `Pagination` | 2.4.7, 4.1.2 | `<nav aria-label="Pagination">`, `<ul>` of `<li>` containing `<a aria-current="page">` |
| `ConfirmDialog` | 1.3.1, 2.4.3, 2.4.7 | `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby="title"`, `aria-describedby="message"`, focus trap, return focus |
| `StatCard` | 1.3.1, 4.1.2 | `role="region"`, `aria-label` matching the metric name |
| `StatGrid` | 1.3.1 | Semantic `<div>` grid, no extra landmarks |
| `ProjectForm` | 1.3.1, 3.3.1, 3.3.2, 3.3.3, 4.1.2 | `aria-invalid`, `aria-describedby`, error summary `role="alert"` focused on submit failure, `<label htmlFor>` on every field |
| `ErrorDisplay` | 4.1.3 | `role="alert"`, retry button focusable |
| `EmptyState` | 1.3.1 | `role="status"`, heading as `<h2>` or `<h3>` |

**Keyboard navigation map for projects list:**
- Tab to sort button → Enter/Space toggles sort direction
- Tab to row → Enter on row navigates to detail
- Tab to pagination → prev/next/page-number → Enter navigates
- Tab to "New project" CTA → Enter opens create form

**Focus management on mutations:**
- Create project succeeds: toast `aria-live="polite"` announces, focus moves to `<h1>` on list page
- Delete project: toast announces deletion, focus returns to the closest remaining item or the "New project" CTA if list is empty
- Validation error on form: focus moves to error summary `role="alert" tabindex="-1"`

**E2E aXe audit:** Phase 1 already provides `e2e/axe.spec.ts` with `@axe-core/playwright`'s `AxeBuilder`.
New Phase 2 pages (dashboard, projects pages) get corresponding `@a11y`-tagged axe specs
that assert zero critical/serious violations. Reuse the existing `AxeBuilder` pattern from
`e2e/axe.spec.ts` — no new helper needed.

---

## 11. Performance baselining

### 11.1 Bundle budget per route (gzip)

| Route | Phase 1 baseline | Phase 2 target | Warn | Error |
|---|---|---|---|---|
| `/dashboard` | ~15 kB | ~40 kB (stat cards, skeleton) | 55 kB | 80 kB |
| `/projects` | — | ~60 kB (table, pagination, form, detail) | 80 kB | 120 kB |
| `/projects/new` | — | ~45 kB (form, shared deps) | 65 kB | 100 kB |
| `/projects/:id` | — | ~55 kB (detail + form) | 75 kB | 110 kB |
| Shell (eager) | ~80 kB | ~95 kB (DataTable, Pagination, ErrorDisplay, EmptyState, ConfirmDialog) | 120 kB | 160 kB |
| **Total initial** | ~80 kB | ~95 kB (eager shell only) | 120 kB | 160 kB |

### 11.2 Core Web Vitals targets

| Metric | Desktop target | Mobile target (Moto G4, 4G) |
|---|---|---|
| LCP | < 2.0s | < 3.0s |
| INP | < 150ms p75 | < 200ms p75 |
| CLS | < 0.1 | < 0.1 |
| TBT | < 100ms | < 200ms |

### 11.3 Lighthouse CI

```yaml
# lighthouserc.cjs — collect → assert → upload
const config = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4173/dashboard', 'http://127.0.0.1:4173/projects'],
      numberOfRuns: 3,
      settings: { preset: 'desktop' },
      startServerCommand: 'pnpm preview',
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'unused-javascript': ['warn', { maxNumericValue: 50 }],
        'uses-responsive-images': 'off',
        'offscreen-images': 'off',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'lhci-reports',
    },
  },
};
module.exports = config;
```

### 11.4 Vite manual chunks

```ts
// vite.config.ts — rollupOptions.output.manualChunks
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-state': ['@reduxjs/toolkit', 'react-redux', '@tanstack/react-query'],
  'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
  'dashboard': ['@/features/dashboard/pages/DashboardPage'],
  'projects': ['@/features/projects/pages/ProjectListPage'],
  'project-detail': ['@/features/projects/pages/ProjectDetailPage'],
  'project-form': ['@/features/projects/pages/ProjectCreatePage', '@/features/projects/pages/ProjectEditPage'],
}
```

### 11.5 Measurement protocol

1. **Build:** `pnpm build --analyze` → check each route chunk against budget
2. **Lighthouse:** `lhci autorun` → 3 runs, median, recorded in `docs/perf/phase-2-baseline.md`
3. **DevTools Performance:** record list render, form submit, pagination — identify long tasks > 50ms
4. **React DevTools profiler:** verify no unnecessary re-renders on data refetch

### 11.6 Optimization recommendations (only if measurement shows need)

| Finding | Fix | Estimated gain |
|---|---|---|
| Dashboard re-renders on RQ refetch | `React.memo(StatGrid)` with shallow compare | < 2ms per refetch |
| Project list re-renders rows on sort | `useMemo` on sorted data | < 5ms per sort |
| Large project list (> 50 items) | `@tanstack/react-virtual` | Significant (deferred to Phase 6) |

---

## 12. Phasing within Phase 2

Phase 2 is broken into 4 sub-phases. Each sub-phase is independently mergeable and produces a demonstrable increment.

### Sub-phase 2a — Shared data components + MSW foundation
**Duration:** ~2 days
**Output:** Reusable `DataTable`, `Pagination`, `EmptyState`, `ErrorDisplay`, `ConfirmDialog` with tests. Refactored MSW handler structure.
**Files:** All `src/shared/components/*` listed above, `test/msw/handlers/*`, `test/msw/server.ts`, `test-setup.ts` mod.
**Verification:**
```bash
pnpm test --coverage   # ≥ 80% on shared/components
pnpm lint && pnpm typecheck   # zero errors
```
**Mergeable:** Yes — no changed routes, no new pages. Pure infrastructure.

### Sub-phase 2b — Dashboard with real data
**Duration:** ~2 days
**Output:** `features/dashboard/` module replacing the stub. Loading skeleton, stat cards, activity list, error handling.
**Files:** All `src/features/dashboard/*`, modified `src/routes/index.tsx` (lazy-import new DashboardPage).
**Dependencies:** Sub-phase 2a (ErrorDisplay, EmptyState).
**Verification:**
```bash
pnpm test --coverage   # dashboard ≥ 80%
pnpm e2e               # dashboard navigation + data load
pnpm axe               # zero critical/serious on /dashboard
pnpm build --analyze   # dashboard chunk ≤ 80 kB gzip
```
**Mergeable:** Yes — replaces the Phase 1 stub in-place.

### Sub-phase 2c — Projects CRUD feature module
**Duration:** ~4 days
**Output:** `features/projects/` module with list, detail, create, edit, delete. Full CRUD lifecycle. Pagination, sorting, form validation, confirm dialog, optimistic updates.
**Files:** All `src/features/projects/*`, route additions in `src/routes/index.tsx`.
**Dependencies:** Sub-phases 2a + 2b.
**Verification:**
```bash
pnpm test --coverage           # projects ≥ 80%
pnpm e2e                       # projects CRUD journey
pnpm axe                       # zero critical/serious on all projects pages
pnpm build --analyze           # each project chunk ≤ budget
```
**Mergeable:** Yes — adds new routes without changing existing ones.

### Sub-phase 2d — E2E expansion + performance baselining
**Duration:** ~2 days
**Output:** Expanded E2E suite (login edge cases, dashboard data, projects CRUD), `lighthouserc.cjs`, `docs/perf/phase-2-baseline.md`, CI workflow.
**Files:** `e2e/*` additions, `lighthouserc.cjs`, `.github/workflows/ci.yml`, `vite.config.ts` (manualChunks), `docs/perf/*`.
**Dependencies:** Sub-phases 2a + 2b + 2c (E2E tests need the features).
**Verification:**
```bash
pnpm e2e           # all specs pass (smoke + CRUD)
lhci autorun        # all assertions pass
pnpm test --coverage  # overall ≥ 80% / 75%
```
**Mergeable:** Yes — non-breaking performance and CI additions.

### Sub-phase ordering flexibility

Sub-phases 2a and 2b could be merged independently. Sub-phase 2c depends on 2a (shared components). Sub-phase 2d must come last (depends on all features for E2E). If timeline is tight, 2c could be delivered partially (list + detail only, deferring create/edit to a follow-up).

---

## 13. Cross-cutting verification plan

| Gate | When | Command |
|---|---|---|
| Lint | Every sub-phase | `pnpm lint` — zero errors |
| TypeScript strict | Every sub-phase | `pnpm typecheck` — zero errors |
| Unit + integration | Every sub-phase | `pnpm test --coverage` — ≥ 80% lines / 75% branches |
| E2E smoke | 2b, 2c, 2d | `pnpm e2e --grep @smoke` |
| E2E full | 2d | `pnpm e2e` — all specs green |
| a11y (axe) | 2b, 2c, 2d | `pnpm axe` — zero critical/serious |
| Bundle analysis | Every sub-phase | `pnpm build --analyze` — per-route budget met |
| Lighthouse | 2d | `lhci autorun` — CWV pass |
| JSDoc | Every sub-phase | Every new export has `@param`, `@returns`, `@throws` |
| CHANGELOG | Every sub-phase | Entry for user-facing change |

---

## 14. Decisions for human review

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | **Feature module naming** | `projects` vs `teams` vs `workspaces` | Start with `projects` — it's the most common CRUD example with clear list/detail/form patterns. Teams can reuse the same structure. |
| 2 | **ProjectId branded type vs plain string** | Branded (strict) vs plain (fast) | Branded. Phase 1 already established branded IDs. Consistency matters more than minor ergonomic cost. |
| 3 | **Dashboard data source** | Separate `GET /api/dashboard/stats` vs embedded in project list | Separate endpoint. Dashboard becomes a composition of multiple widget queries in Phase 3+. Single endpoint keeps Phase 2 simple. |
| 4 | **Optimistic updates for delete** | RQ `onMutate` rollback vs always re-fetch | RQ `onMutate` rollback for delete (latency matters). Create/update use cache invalidation only (risk of duplicate entries is lower). |
| 5 | **E2E data seeding** | MSW-based (all mock) vs real API + test DB | MSW-based for Phase 2. Real API in Phase 7 when backend exists. MSW handlers are shared between unit and E2E tests. |
| 6 | **ConfirmDialog as shared component vs per-feature** | Shared in `shared/components` vs feature-local | Shared. The pattern (open → promise → close) is identical across features. `useConfirm` hook abstracts the state. |
| 7 | **Pagination state: URL vs Redux vs local** | URL search params vs Redux vs local state | URL. Bookmarkable, shareable, survives reload. RQ query key includes URL params. Avoids state sync bugs. |
| 8 | **Dashboard skeleton vs Spinner** | Skeleton matching layout vs `<Spinner />` | Skeleton. Phase 1 Spinner is for route-level Suspense. Dashboard content loading should show meaningful placeholder shapes per Phase 1's precedent. |
