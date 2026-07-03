# Phase 4 — TypeScript Contract Alignment Report

> **Author:** TypeScript Agent  
> **Date:** 2026-07-03  
> **Scope:** Server-side Zod schemas for Projects CRUD + Dashboard stats,  
>   compared against existing frontend contracts in the TCSgon codebase.

---

## Table of Contents

1. [Summary](#1-summary)
2. [Finding 1 — Projects CRUD schemas](#2-finding-1--projects-crud-schemas)
3. [Finding 2 — Query param validation gap](#3-finding-2--query-param-validation-gap)
4. [Finding 3 — DashboardStats cannot be satisfied](#4-finding-3--dashboardstats-cannot-be-satisfied)
5. [Finding 4 — User profile/password schemas (OK)](#5-finding-4--user-profilepassword-schemas-ok)
6. [Finding 5 — Path prefix inconsistency (pre-existing)](#6-finding-5--path-prefix-inconsistency-pre-existing)
7. [Finding 6 — z.coerce.number() correctness](#7-finding-6--zcoercenumber-correctness)
8. [Exact server-side Zod definitions](#8-exact-server-side-zod-definitions)
9. [Required file changes](#9-required-file-changes)

---

## 1. Summary

| # | Area | Verdict |
|---|------|---------|
| 1 | `CreateProjectBodySchema` vs `ProjectInputSchema` | **Compatibile** — 1 minor default-value mismatch |
| 2 | `ListProjectsQuerySchema` vs `ProjectListParams` | **Structural match** — but existing `validate` middleware does not validate `req.query` |
| 3 | `DashboardStatsSchema` vs server capabilities | **BLOCKING** — requires new Prisma models (`ActivityLog`, `ProjectMember`) |
| 4 | `UpdateProfileInputSchema` / `ChangePasswordInputSchema` | **Exact match** |
| 5 | Path prefix: `projectsApi.ts` vs `userApi.ts` | **Pre-existing bug** — user API paths incorrectly include `/api` |
| 6 | `z.coerce.number()` | **Correct** — query params arrive as strings |

---

## 2. Finding 1 — Projects CRUD schemas

### `CreateProjectBodySchema` vs frontend `ProjectInputSchema`

```typescript
// ── Frontend (src/features/projects/types/index.ts:29-34) ──────────
const ProjectInputSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  description: z.string().max(2000).optional(),
  status: ProjectStatusSchema.optional().default('active'),
  leadName: z.string().min(1, 'Lead name is required.').max(120),
});

// ── Proposed server (routes/projects.ts) ──────────────────────────
const CreateProjectBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional().default('active'),
  leadName: z.string().min(1).max(120),
});
```

**Verdict: Compatible, 1 minor note.**

| Field | Frontend | Server | Match? |
|-------|----------|--------|--------|
| `name` | `min(1, …).max(200)` | `min(1).max(200)` | ✅ (cosmetic error msg diff) |
| `description` | `.optional()` — yields `undefined` | `.optional().default('')` — yields `''` | ⚠️ See note |
| `status` | `ProjectStatusSchema.optional().default('active')` | `enum([…]).optional().default('active')` | ✅ (identical enum) |
| `leadName` | `min(1, …).max(120)` | `min(1).max(120)` | ✅ (cosmetic error msg diff) |

**⚠️ Note on `description`:** The frontend sends `description: undefined` when the field is omitted. The server schema with `.optional().default('')` accepts `undefined` and converts it to `''`. This works correctly at the API boundary. However, the frontend `ProjectSchema` (response parsing) also has `.default('')`, so the round-trip is consistent. **Non-blocking, but align both schemas for consistency:**

```typescript
// Recommendation: match frontend style — drop .default('') on server
description: z.string().max(2000).optional(),
```

### `UpdateProjectBodySchema` vs frontend `ProjectInputSchema`

The frontend `useUpdateProject` sends the full `ProjectInput` shape (all fields, with `description` and `status` optional). The server update schema must accept all fields as optional (PATCH semantics).

**Verdict: Compatible**. Each field in the server schema is `.optional()`, so any subset of fields from the frontend will be accepted. Suggested constant reuse to prevent drift:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _CreateProjectBodySchema = CreateProjectBodySchema; // reuse field defs
const UpdateProjectBodySchema = CreateProjectBodySchema.partial();
```

### `ProjectListResponse` shape

The frontend validates the response with:

```typescript
const ProjectListResponseSchema = z.object({
  items: z.array(ProjectSchema),
  total: z.number().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().positive(),
});
```

The server must return **all** `Project` fields including `memberCount`, `createdAt`, and `updatedAt`. The `Project` model in Prisma has all required columns (`member_count`, `created_at`, `updated_at`). **Verdict: satisfiable** via Prisma query with `createdAt`/`updatedAt` serialized as ISO strings.

---

## 3. Finding 2 — Query param validation gap ⚠️

### The problem

The existing `validate` middleware (`server/src/middleware/validate.ts`) only parses `req.body`:

```typescript
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);  // ← only req.body
    // ...
    req.body = result.data;
    next();
  };
}
```

For `GET /api/projects`, all list parameters arrive as **query parameters** (`req.query`), not `req.body`. The proposed `ListProjectsQuerySchema` would never execute.

### Required actions

**Create a new middleware** `validateQuery` in `server/src/middleware/validate.ts`:

```typescript
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Attach parsed data back to query for downstream use
    req.query = result.data;
    next();
  };
}
```

Then use it in the project list route:

```typescript
router.get('/', requireAuth, validateQuery(ListProjectsQuerySchema), async (req, res, next) => {
  // req.query is now typed as z.infer<typeof ListProjectsQuerySchema>
  const { page, pageSize, sort, order, search, status } = req.query;
  // ...
});
```

### `z.coerce.number()` correctness

Query parameters arrive as **strings** (e.g., `"1"` not `1`). `z.coerce.number()` correctly coerces `"1"` → `1`. With `.int().positive()`, invalid values like `"abc"` → `NaN` → validation failure, returning 400. **This is the correct approach.**

---

## 4. Finding 3 — DashboardStats cannot be satisfied ⛔

### Frontend expectation (`DashboardStatsSchema`)

```typescript
const DashboardStatsSchema = z.object({
  totalProjects: z.number().nonnegative(),
  activeProjects: z.number().nonnegative(),
  teamMembers: z.number().nonnegative(),
  completionRate: z.number().min(0).max(100),
  recentActivity: z.array(RecentActivitySchema),
});

const RecentActivitySchema = z.object({
  id: z.string().min(1),
  type: ActivityTypeSchema,     // 'project_created' | 'project_updated' | 'status_changed' | 'member_added'
  message: z.string().min(1),
  createdAt: z.string().datetime(),
  projectId: z.string().min(1),
});
```

### Current Prisma model

```
model Project {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(200)
  description String   @default("") @db.VarChar(2000)
  status      String   @default("active") @db.VarChar(20)
  leadName    String   @map("lead_name") @db.VarChar(120)
  memberCount Int      @default(0) @map("member_count")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("projects")
}
```

### What is missing

| Field | Computable from current schema? | If not, what is needed |
|-------|--------------------------------|------------------------|
| `totalProjects` | ✅ `prisma.project.count()` | — |
| `activeProjects` | ✅ `prisma.project.count({ where: { status: 'active' } })` | — |
| `teamMembers` | ❌ | A `ProjectMember` join model or a `User ↔ Project` relation |
| `completionRate` | ⚠️ Partial: `count({ where: { status: 'completed' } }) / count() * 100` | Works if "completion rate" = % of completed projects |
| `recentActivity` | ❌ | An `ActivityLog` / `AuditEvent` model with `type`, `message`, `projectId` |

### Required new Prisma models

Add to `server/prisma/schema.prisma`:

```prisma
model ProjectMember {
  id        String   @id @default(uuid()) @db.Uuid
  projectId String   @map("project_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  role      String   @default("member") @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("project_members")
  @@unique([projectId, userId])
  @@index([userId])
}

model ActivityLog {
  id        String   @id @default(uuid()) @db.Uuid
  projectId String   @map("project_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  type      String   @db.VarChar(50)    // project_created | project_updated | status_changed | member_added
  message   String   @db.VarChar(500)
  createdAt DateTime @default(now()) @map("created_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("activity_logs")
  @@index([projectId])
  @@index([createdAt])
}
```

### Alternative: scope reduction

If adding models is not in scope for Phase 4, the frontend `DashboardStatsSchema` must be **downgraded**. The minimal viable dashboard response would be:

```typescript
const DashboardStatsSchema = z.object({
  totalProjects: z.number().nonnegative(),
  activeProjects: z.number().nonnegative(),
  completedProjects: z.number().nonnegative(),
  completionRate: z.number().min(0).max(100),
});
```

---

## 5. Finding 4 — User profile/password schemas ✅

### `UpdateProfileInputSchema` vs server `UpdateProfileBodySchema`

```typescript
// Frontend (src/shared/types/user.ts:151-155)
z.object({
  name: z.string().min(1, 'Name is required.').max(120).optional(),
  email: z.string().email('Valid email is required.').optional(),
});

// Server (routes/users.ts:12-15)
z.object({
  name: z.string().min(1, 'Name is required.').max(120).optional(),
  email: z.string().email('Valid email is required.').optional(),
});
```

**Verdict: EXACT MATCH.** No action needed.

### `ChangePasswordInputSchema` vs server `ChangePasswordBodySchema`

```typescript
// Frontend (src/shared/types/user.ts:160-166)
z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(200, 'New password must be at most 200 characters.'),
});

// Server (routes/users.ts:17-20)
z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(200),
});
```

**Verdict: MATCH** — constraint `max(200)` identical, only the error message differs on the server (no custom message). Cosmetic only.

### `ChangePasswordResponseSchema` vs server response

```typescript
// Frontend (src/shared/types/user.ts:172-174)
z.object({ message: z.string() });

// Server response: { message: 'Password changed successfully.' }
```

**Verdict: MATCH.**

---

## 6. Finding 5 — Path prefix inconsistency (pre-existing) ⚠️

The frontend hooks use inconsistent path prefixes:

| Hook file | Path | Effective URL (with base `/api`) |
|-----------|------|----------------------------------|
| `projectsApi.ts` | `/projects` | `/api/projects` ✅ |
| `dashboardApi.ts` | `/dashboard/stats` | `/api/dashboard/stats` ✅ |
| `userApi.ts` | `/api/users/me` | `/api/api/users/me` ❌ |
| `userApi.ts` | `/api/users/me/password` | `/api/api/users/me/password` ❌ |

The `userApi.ts` paths **already include `/api`**, which causes double-prefixing since the API client prepends the base URL `/api`.

**Fix:** Change `userApi.ts` paths from `/api/users/me` → `/users/me` and `/api/users/me/password` → `/users/me/password`.

This is not a Phase 4 issue, but must be fixed before Phase 4 testing begins, or the Vite proxy will route requests to incorrect Express paths.

---

## 7. Finding 6 — z.coerce.number() correctness

`z.coerce.number()` was introduced in Zod 3.20. The server depends on `"zod": "^3.23.0"`, so it is available.

Query parameters arrive as strings in Express (`req.query`), e.g. `?page=1` → `req.query.page === "1"`. Without coercion, `z.number()` would reject string `"1"`. With `z.coerce.number()`, the string is coerced to a number before validation.

**The proposed usage in `ListProjectsQuerySchema` is correct:**

```typescript
page: z.coerce.number().int().positive().default(1),
pageSize: z.coerce.number().int().positive().max(100).default(20),
```

**Edge case:** `?page=abc` → coerces to `NaN` → `.int()` fails → validation error → 400 response with details `{ page: ["Expected integer, received nan"] }`. This is acceptable behavior.

---

## 8. Exact server-side Zod definitions

### `server/src/routes/projects.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate, validateQuery } from '../middleware/validate.js';
import * as projectService from '../services/project.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// ─── Query param schemas ──────────────────────────────────────────

const ListProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['name', 'status', 'createdAt', 'updatedAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().max(200).optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
});

// ─── Body schemas ───────────────────────────────────────────────────

const CreateProjectBodySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional().default('active'),
  leadName: z.string().min(1, 'Lead name is required.').max(120),
});

const UpdateProjectBodySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  leadName: z.string().min(1, 'Lead name is required.').max(120).optional(),
});

// ─── Routes ─────────────────────────────────────────────────────────

/** GET /api/projects — list projects with pagination + filters */
router.get('/', requireAuth, validateQuery(ListProjectsQuerySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await projectService.listProjects(req.user.id, req.query as z.infer<typeof ListProjectsQuerySchema>);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** GET /api/projects/:id — get single project */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user.id);
    res.json(project);
  } catch (err) {
    next(err);
  }
});

/** POST /api/projects — create project */
router.post('/', requireAuth, validate(CreateProjectBodySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await projectService.createProject(req.user.id, req.body);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

/** PUT /api/projects/:id — update project */
router.put('/:id', requireAuth, validate(UpdateProjectBodySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.user.id, req.body);
    res.json(project);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/projects/:id — delete project */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    await projectService.deleteProject(req.params.id, req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
```

### `server/src/routes/dashboard.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as dashboardService from '../services/dashboard.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

/** GET /api/dashboard/stats — aggregate statistics */
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const stats = await dashboardService.getStats(req.user.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
```

**Note:** Dashboard route has no body/query to validate (it's a simple GET with no required parameters). If date-range filters are added later, a `validateQuery` should be introduced.

### `server/src/middleware/validate.ts` (add `validateQuery`)

```typescript
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}

/** NEW — validate query parameters against a Zod schema */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Replace query object with parsed data (coerced numbers, defaults applied)
    // TypeScript limitation: Express query type is narrow; we reassign the raw dict.
    (req as Record<string, unknown>).query = result.data;
    next();
  };
}
```

---

## 9. Required file changes

### Phase 4 delivery scope

| File | Change | Required? |
|------|--------|-----------|
| `server/prisma/schema.prisma` | Add `ProjectMember` + `ActivityLog` models | **Blocking** for `DashboardStats` |
| `server/src/middleware/validate.ts` | Add `validateQuery` export | **Required** for `GET /projects` |
| `server/src/routes/projects.ts` | Create new file with all CRUD routes | **Required** |
| `server/src/routes/dashboard.ts` | Create new file with stats route | **Required** |
| `server/src/services/project.ts` | Create service layer | **Required** |
| `server/src/services/dashboard.ts` | Create dashboard aggregate service | **Required** |
| `server/src/app.ts` | Register `projectRoutes` + `dashboardRoutes` | **Required** |
| `server/prisma/seed.ts` | Add seed data for projects + activities | Recommended |
| `docs/plans/phase-4-contract-alignment.md` | This report | — |

### Pre-existing bug fix (blocking for Phase 4)

| File | Change |
|------|--------|
| `src/features/auth/api/userApi.ts` | Change `path: '/api/users/me'` → `path: '/users/me'` |
| `src/features/auth/api/userApi.ts` | Change `path: '/api/users/me/password'` → `path: '/users/me/password'` |

### Non-blocking recommendation

| File | Change |
|------|--------|
| `server/src/routes/projects.ts` | Remove `.default('')` from `description` in `CreateProjectBodySchema` for alignment with frontend |

---

*End of report.*
