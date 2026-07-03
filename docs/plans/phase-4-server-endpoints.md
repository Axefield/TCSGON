# Phase 4 — Server Endpoints: Projects CRUD + Dashboard Stats

> **Author:** AI Workflow Agent  
> **Date:** 2026-07-03  
> **Status:** Planning complete — ready for implementation  
> **Subagent reviews:** Architecture ✅ | React ✅ | TypeScript ✅ | Testing ✅ | Accessibility ✅ | Performance ✅  

---

## Table of Contents

1. [Summary](#1-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Implementation Order](#3-implementation-order)
4. [Step 1 — Prisma Schema Changes](#4-step-1--prisma-schema-changes)
5. [Step 2 — validateQuery Middleware](#5-step-2--validatequery-middleware)
6. [Step 3 — Project Service](#6-step-3--project-service)
7. [Step 4 — Dashboard Service](#7-step-4--dashboard-service)
8. [Step 5 — Project Routes](#8-step-5--project-routes)
9. [Step 6 — Dashboard Routes](#9-step-6--dashboard-routes)
10. [Step 7 — Register Routes in app.ts](#10-step-7--register-routes-in-appts)
11. [Step 8 — Pre-existing Bug Fix: userApi.ts Path Prefix](#11-step-8--pre-existing-bug-fix-userapits-path-prefix)
12. [Step 9 — Seed Data](#12-step-9--seed-data)
13. [Step 10 — Integration Tests](#13-step-10--integration-tests)
14. [Non-Blocking Recommendations](#14-non-blocking-recommendations)
15. [Risks and Mitigations](#15-risks-and-mitigations)

---

## 1. Summary

### Goal
Implement the backend Express service + route layer for Projects CRUD and Dashboard stats, completing the server-side contract for the Phase 2 frontend hooks.

### What does NOT change
- **No new React components, pages, or hooks.** The frontend (`src/`) is already fully built, tested, and passing axe audits.
- **No new dependencies.** Zod, Prisma, Express are already available.
- **No Redux, Context, or state management changes.**

### Delivery scope

| # | Step | Files touched | Risk |
|---|------|--------------|------|
| 1 | Prisma schema | `server/prisma/schema.prisma` | HIGH — requires migration |
| 2 | `validateQuery` middleware | `server/src/middleware/validate.ts` | LOW |
| 3 | Project service | `server/src/services/project.ts` | MEDIUM |
| 4 | Dashboard service | `server/src/services/dashboard.ts` | LOW |
| 5 | Project routes | `server/src/routes/projects.ts` | LOW |
| 6 | Dashboard routes | `server/src/routes/dashboard.ts` | LOW |
| 7 | Register routes | `server/src/app.ts` | LOW |
| 8 | Fix `userApi.ts` path prefix | `src/features/auth/api/userApi.ts` | LOW |
| 9 | Seed data | `server/prisma/seed.ts` | LOW |
| 10 | Integration tests | 4 new test files | MEDIUM |

### Total test count: **30 new tests** (~98 assertions)

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Express App                          │
│                                                          │
│  GET  /api/projects          → projectService.list()     │
│  GET  /api/projects/:id      → projectService.getById() │
│  POST /api/projects          → projectService.create()  │
│  PUT  /api/projects/:id      → projectService.update()  │
│  DELETE /api/projects/:id    → projectService.delete()  │
│  GET  /api/dashboard/stats   → dashboardService.get()   │
│                                                          │
│  Middleware: requireAuth → validate/validateQuery → handler│
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  Prisma + PostgreSQL                      │
│                                                          │
│  projects       (existing, extended with cascade)         │
│  activity_logs  (new)                                     │
│  users          (existing, FK target)                    │
└─────────────────────────────────────────────────────────┘
```

### Key design decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pagination | Offset-based (`skip`/`take`) | Matches frontend `ProjectListParams` (`page`/`pageSize`) |
| Deletion | Hard delete | No soft-delete requirement yet; ActivityLog cascades via FK |
| Auth scope | Multi-tenant by user ID | Every service method accepts `userId`; projects are not yet shared |
| ActivityLog | Persisted to DB | Cannot derive from `Project.updatedAt` alone — needs action type + message |
| Dashboard `teamMembers` | Returns `0` | No `ProjectMember` model exists; architecture plan reserves for future |
| Completion rate | `completedProjects / totalProjects * 100` | Matches frontend expectation |
| ActivityLog type field | Named `type` (not `action`) | Matches frontend `RecentActivitySchema.type` (ActivityTypeSchema enum) |

### Folder structure (new files)

```
server/src/
├── middleware/
│   └── validate.ts          ← EDIT: add validateQuery export
├── routes/
│   ├── projects.ts           ← NEW: 5 CRUD endpoints
│   ├── dashboard.ts          ← NEW: 1 stats endpoint
│   └── __tests__/
│       ├── projects.test.ts  ← NEW: 11 tests
│       └── dashboard.test.ts ← NEW: 2 tests
├── services/
│   ├── project.ts            ← NEW: CRUD service + activity logging
│   ├── dashboard.ts          ← NEW: aggregate stats service
│   └── __tests__/
│       ├── project.test.ts   ← NEW: 12 tests
│       └── dashboard.test.ts ← NEW: 5 tests
├── app.ts                    ← EDIT: register new route modules
├── test-utils.ts             ← EDIT: add createTestProject()
└── test-setup.ts             ← EDIT: add activityLog/project cleanup
prisma/
├── schema.prisma             ← EDIT: add ActivityLog model + composite index
└── seed.ts                   ← EDIT: add project seed data
src/features/auth/api/
└── userApi.ts                ← EDIT: fix path prefix bug
```

---

## 3. Implementation Order

This order minimizes blocking dependencies:

```
Step 1  (Prisma schema)      ─┐
Step 2  (validateQuery)       ─┤  No deps on each other
Step 8  (userApi.ts fix)      ─┘
                │
                ▼
Step 3  (project service)     ─── depends on Step 1
Step 4  (dashboard service)   ─── depends on Step 1
                │
                ▼
Step 5  (project routes)      ─── depends on Step 2, 3
Step 6  (dashboard routes)    ─── depends on Step 4
Step 7  (register in app.ts)  ─── depends on Step 5, 6
                │
                ▼
Step 9  (seed data)           ─── depends on Step 1
Step 10 (tests)               ─── depends on Steps 3-7
```

---

## 4. Step 1 — Prisma Schema Changes

### Add `ActivityLog` model

Insert after the `Project` model block in `server/prisma/schema.prisma`:

```prisma
model ActivityLog {
  id        String   @id @default(uuid()) @db.Uuid
  projectId String   @map("project_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  type      String   @db.VarChar(50)
  message   String   @db.VarChar(500)
  createdAt DateTime @default(now()) @map("created_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("activity_logs")
  @@index([projectId])
  @@index([createdAt])
}
```

### Add composite index to `Project`

Add within the existing `Project` model block:

```prisma
@@index([status, createdAt])
```

### Add `ActivityLog` relation to `User`

The `User` model already has `sessions` and `passwordResetTokens` arrays. Add:

```prisma
activityLogs ActivityLog[]
```

### Run migration

```bash
cd server
npx prisma migrate dev --name add-activity-log-model
```

### Update `test-setup.ts`

Add `activityLog.deleteMany()` to the `afterEach` cleanup, before `project.deleteMany()`:

```typescript
afterEach(async () => {
  await prisma.activityLog.deleteMany();
  await prisma.project.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});
```

### Update `test-utils.ts`

Add `createTestProject()` factory:

```typescript
import type { Project } from '@prisma/client';

export async function createTestProject(
  overrides: Partial<Project> = {},
): Promise<Project> {
  return prisma.project.create({
    data: {
      id: generateToken(),
      name: 'Test Project',
      description: 'A test project for testing',
      status: 'active',
      leadName: 'Test Lead',
      memberCount: 0,
      ...overrides,
    },
  });
}
```

---

## 5. Step 2 — `validateQuery` Middleware

Add to `server/src/middleware/validate.ts`:

```typescript
/**
 * Middleware factory that validates request query parameters against a Zod schema.
 * Returns 400 with field-level errors on mismatch.
 * Query params arrive as strings; use `z.coerce.number()` for numeric fields.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(result.error);
      return;
    }
    (req as Record<string, unknown>).query = result.data;
    next();
  };
}
```

---

## 6. Step 3 — Project Service

**File:** `server/src/services/project.ts`

### Schema alignment notes (from TypeScript agent)

| Field | Frontend sends | Server stores | Notes |
|-------|---------------|---------------|-------|
| `name` | `string(1..200)` | `string(1..200)` | Match |
| `description` | `undefined` when omitted | `''` default | Accept both; store as `''` |
| `status` | `'active'` default | `'active'` default | Match |
| `leadName` | `string(1..120)` | `string(1..120)` | Match |
| `memberCount` | Not in input | `0` default | Server-only field |
| `createdAt` | Not in input | `now()` | Server-generated |
| `updatedAt` | Not in input | `@updatedAt` | Server-generated |

### Interface

```typescript
import { prisma } from '../lib/prisma.js';
import { AppError } from '../types/index.js';
import { generateToken } from '../lib/crypto.js';
import type { Prisma } from '@prisma/client';

export interface ListProjectsOptions {
  page: number;
  pageSize: number;
  sort?: 'name' | 'status' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  search?: string;
  status?: string;
}

export interface ListProjectsResult {
  items: Array<Record<string, unknown>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: string;
  leadName: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: string;
  leadName?: string;
}
```

### Functions

**`listProjects(userId: string, options: ListProjectsOptions): Promise<ListProjectsResult>`**

Build a Prisma query with:
- `where`: status filter if provided, search (ILIKE on name) if provided
- `orderBy`: sort field mapped via a lookup object (default `createdAt desc`)
- `skip`: `(page - 1) * pageSize`
- `take`: `pageSize`
- Run `findMany` + `count` in a transaction
- Compute `totalPages = Math.ceil(total / pageSize)`

**`getProjectById(id: string, userId: string): Promise<Record<string, unknown>>`**

- `findUniqueOrThrow` — let Prisma's `P2025` error propagate to the error handler
- Wrap in try/catch to throw `AppError(404, 'NOT_FOUND', 'Project not found.')`

**`createProject(userId: string, input: CreateProjectInput): Promise<Record<string, unknown>>`**

- Create project with `id: generateToken()`, `memberCount: 0`, defaults applied
- Create `ActivityLog` with:
  - `type: 'project_created'`
  - `message: \`Project "${input.name}" was created.\``
- Return serialized project with `createdAt`/`updatedAt` as ISO strings

**`updateProject(id: string, userId: string, input: UpdateProjectInput): Promise<Record<string, unknown>>`**

- Fetch existing project (throw 404 if not found)
- Build `data` object from non-undefined input fields
- If `status` changed, create an additional `status_changed` activity log
- Always create a `project_updated` activity log
- Return updated project

**`deleteProject(id: string, userId: string): Promise<void>`**

- Check existence (throw 404 if not found)
- `delete` — cascades activity logs via FK
- Return void

### Activity logging helper

```typescript
async function logActivity(params: {
  projectId: string;
  userId: string;
  type: string;
  message: string;
}): Promise<void> {
  await prisma.activityLog.create({
    data: {
      id: generateToken(),
      projectId: params.projectId,
      userId: params.userId,
      type: params.type,
      message: params.message,
    },
  });
}
```

---

## 7. Step 4 — Dashboard Service

**File:** `server/src/services/dashboard.ts`

```typescript
import { prisma } from '../lib/prisma.js';

export interface DashboardStatsResult {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  teamMembers: number;
  completionRate: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
    projectId: string;
  }>;
}
```

**`getStats(userId: string): Promise<DashboardStatsResult>`**

Run parallel queries:

```typescript
const [totalProjects, activeProjects, completedProjects, recentActivity] =
  await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'active' } }),
    prisma.project.count({ where: { status: 'completed' } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);
```

Return:

```typescript
return {
  totalProjects,
  activeProjects,
  completedProjects,
  teamMembers: 0, // No ProjectMember model yet
  completionRate: totalProjects > 0
    ? Math.round((completedProjects / totalProjects) * 100)
    : 0,
  recentActivity: recentActivity.map((log) => ({
    id: log.id,
    type: log.type,
    message: log.message,
    createdAt: log.createdAt.toISOString(),
    projectId: log.projectId,
  })),
};
```

**Note:** The frontend `DashboardStatsSchema` expects `teamMembers: z.number().nonnegative()`. Returning `0` satisfies the schema. A future phase with a `ProjectMember` model will provide real counts.

---

## 8. Step 5 — Project Routes

**File:** `server/src/routes/projects.ts`

### Endpoints

| Method | Path | Middleware | Service method |
|--------|------|-----------|----------------|
| GET | `/api/projects` | `requireAuth`, `validateQuery(ListProjectsQuerySchema)` | `projectService.listProjects()` |
| GET | `/api/projects/:id` | `requireAuth` | `projectService.getProjectById()` |
| POST | `/api/projects` | `requireAuth`, `validate(CreateProjectBodySchema)` | `projectService.createProject()` |
| PUT | `/api/projects/:id` | `requireAuth`, `validate(UpdateProjectBodySchema)` | `projectService.updateProject()` |
| DELETE | `/api/projects/:id` | `requireAuth` | `projectService.deleteProject()` |

### Zod schemas (exact)

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate, validateQuery } from '../middleware/validate.js';
import * as projectService from '../services/project.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

const ListProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['name', 'status', 'createdAt', 'updatedAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().max(200).optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
});

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

// GET /api/projects — list with pagination + filters
router.get('/', requireAuth, validateQuery(ListProjectsQuerySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await projectService.listProjects(req.user.id, req.query as never);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id — get single project
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user.id);
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects — create project
router.post('/', requireAuth, validate(CreateProjectBodySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await projectService.createProject(req.user.id, req.body);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id — update project
router.put('/:id', requireAuth, validate(UpdateProjectBodySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.user.id, req.body);
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id — delete project
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

### Response shape compliance

| Frontend schema | Server response | Status |
|----------------|-----------------|--------|
| `ProjectListResponseSchema` items: `z.array(ProjectSchema)` | `items` array with all `Project` fields | ✅ All Prisma fields map |
| `ProjectListResponseSchema` total: `z.number().nonnegative()` | `total` from `count()` | ✅ |
| `ProjectListResponseSchema` page/pageSize/totalPages | Computed from query params + total | ✅ |
| `ProjectSchema` id/name/description/status/leadName/memberCount | All available from Prisma | ✅ |
| `ProjectSchema` createdAt/updatedAt: `z.string().datetime()` | Prisma DateTime → `.toISOString()` | ✅ |

---

## 9. Step 6 — Dashboard Routes

**File:** `server/src/routes/dashboard.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as dashboardService from '../services/dashboard.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// GET /api/dashboard/stats — aggregate statistics
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

**No query validation needed** — the endpoint has no query parameters. If date-range filters are added later, add `validateQuery`.

---

## 10. Step 7 — Register Routes in app.ts

Add imports and mount points in `server/src/app.ts`:

```typescript
import projectRoutes from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';

// After existing route registrations:
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);
```

**Order:** Register after `/api/auth` and `/api/users` to maintain route precedence.

---

## 11. Step 8 — Pre-existing Bug Fix: `userApi.ts` Path Prefix

**File:** `src/features/auth/api/userApi.ts`

Three path strings need fixing (all currently start with `/api/`, causing double `/api/api/` URLs):

| Line | Current | Fixed |
|------|---------|-------|
| 80 | `/api/users/me` | `/users/me` |
| 119 | `/api/users/me` | `/users/me` |
| 151 | `/api/users/me/password` | `/users/me/password` |

This fix is **required before Phase 4 testing** because the Vite dev proxy routes `/api/*` to the Express server. Without this fix, user profile requests go to `/api/api/users/me` which does not match any Express route.

---

## 12. Step 9 — Seed Data

Add to `server/prisma/seed.ts` after the existing user creation:

```typescript
// Create sample projects
const projects = await Promise.all([
  prisma.project.create({
    data: {
      id: uuid(),
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design.',
      status: 'active',
      leadName: 'Alice Johnson',
      memberCount: 5,
    },
  }),
  prisma.project.create({
    data: {
      id: uuid(),
      name: 'Mobile App v2',
      description: 'Version 2 of the mobile application with offline support.',
      status: 'active',
      leadName: 'Bob Smith',
      memberCount: 8,
    },
  }),
  prisma.project.create({
    data: {
      id: uuid(),
      name: 'Legacy Migration',
      description: 'Migrate legacy monolith to microservices architecture.',
      status: 'completed',
      leadName: 'Carol Davis',
      memberCount: 3,
    },
  }),
  prisma.project.create({
    data: {
      id: uuid(),
      name: 'Security Audit Q3',
      description: 'Quarterly security audit and penetration testing.',
      status: 'paused',
      leadName: 'Admin User',
      memberCount: 2,
    },
  }),
]);
```

**Note:** Ensure seed is idempotent — wrap in upsert or check existence first if the seed may run multiple times.

---

## 13. Step 10 — Integration Tests

### Test file summary

| File | Tests | Pattern |
|------|-------|---------|
| `server/src/services/__tests__/project.test.ts` | 12 | Service-level (direct calls, no supertest) |
| `server/src/services/__tests__/dashboard.test.ts` | 5 | Service-level |
| `server/src/routes/__tests__/projects.test.ts` | 11 | Route-level (supertest) |
| `server/src/routes/__tests__/dashboard.test.ts` | 2 | Route-level |

### Service tests: `project.test.ts`

**Setup:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import * as projectService from '../project.js';
import { prisma } from '../../lib/prisma.js';

beforeEach(async () => {
  await prisma.activityLog.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});
```

| # | Test | Assertions |
|---|------|-----------|
| 1 | `createProject` creates project + `project_created` activity log | Returns project with all fields; activity log exists in DB |
| 2 | `getProjectById` returns project | All fields match |
| 3 | `getProjectById` throws AppError 404 for non-existent | `{ statusCode: 404, code: 'NOT_FOUND' }` |
| 4 | `listProjects` returns paginated results with total | 3 projects → pageSize 2 → items.length=2, total=3 |
| 5 | `listProjects` respects offset | 5 projects → page 2, pageSize 2 → correct offset rows |
| 6 | `listProjects` filters by status | 2 active + 1 archived → filter archived → 1 result |
| 7 | `listProjects` searches by name case-insensitively | 'Alpha', 'beta', 'Other' → search 'project' → 2 results |
| 8 | `listProjects` sorts by specified field | Sort by name asc → alphabetical order |
| 9 | `updateProject` updates fields + `project_updated` activity | Name updated; activity log exists |
| 10 | `updateProject` creates `status_changed` activity on status change | Activity with type `status_changed` exists |
| 11 | `deleteProject` deletes + cascades activity logs | Project gone; activity count = 0 |
| 12 | `deleteProject` throws 404 for non-existent | `{ statusCode: 404, code: 'NOT_FOUND' }` |

### Service tests: `dashboard.test.ts`

| # | Test | Assertions |
|---|------|-----------|
| 1 | Returns correct totals from sample data | 3 active + 2 archived + 1 on_hold → correct counts |
| 2 | recentActivity returns most recent entries with limit | 15 logs → returns 10, newest-first |
| 3 | completionRate computed correctly | 4 active + 1 completed → 20% (1/5) |
| 4 | Returns empty defaults when no projects exist | All zero, empty array |
| 5 | teamMembers returns 0 (no member model yet) | Always 0 |

### Route tests: `projects.test.ts`

**Setup pattern:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { createAuthenticatedUser } from '../../test-utils.js';

let token: string;

beforeEach(async () => {
  await prisma.activityLog.deleteMany();
  await prisma.project.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  const auth = await createAuthenticatedUser();
  token = auth.token;
});
```

| # | Test | Method | Expected status |
|---|------|--------|----------------|
| 1 | Returns paginated list for authenticated user | GET /api/projects | 200 |
| 2 | Respects page and pageSize query params | GET /api/projects?page=1&pageSize=2 | 200 |
| 3 | Returns 401 without auth | GET /api/projects (no header) | 401 |
| 4 | Returns project by ID | GET /api/projects/:id | 200 |
| 5 | Returns 404 for non-existent | GET /api/projects/bad-id | 404 |
| 6 | Creates project and returns 201 | POST /api/projects | 201 |
| 7 | Returns 400 for invalid body (missing name) | POST /api/projects {} | 400 |
| 8 | Updates project and returns 200 | PUT /api/projects/:id | 200 |
| 9 | Returns 404 for non-existent update | PUT /api/projects/bad-id | 404 |
| 10 | Deletes project and returns 204 | DELETE /api/projects/:id | 204 |
| 11 | Returns 404 for non-existent delete | DELETE /api/projects/bad-id | 404 |

### Route tests: `dashboard.test.ts`

| # | Test | Method | Expected status |
|---|------|--------|----------------|
| 1 | Returns aggregated dashboard stats | GET /api/dashboard/stats | 200 |
| 2 | Returns 401 without auth | GET /api/dashboard/stats (no header) | 401 |

---

## 14. Non-Blocking Recommendations

| # | Recommendation | Source | Effort |
|---|---------------|--------|--------|
| 1 | Add `(status, name)` composite index if project table exceeds 50k rows | Performance agent | Future |
| 2 | Set `staleTime: 30_000` on `useDashboardStats()` to reduce refetch on tab switch | Performance agent | 1 line |
| 3 | Consider `pg_trgm` GIN index if ILIKE search performance degrades | Performance agent | Future |
| 4 | Remove `.default('')` from `description` in `CreateProjectBodySchema` for frontend alignment | TypeScript agent | 1 line |

---

## 15. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| `ActivityLog` migration conflicts with existing test DB | HIGH | LOW | Run `prisma migrate reset` in CI; test-setup.ts does `migrate deploy` before each run |
| Frontend tests break if MSW handlers don't match new server response shapes | MEDIUM | LOW | Frontend uses MSW, not real server; no handler changes needed |
| `validateQuery` overwrites `req.query` with non-Express type | LOW | LOW | Cast via `(req as Record<string, unknown>).query` — Express type system mismatch is well-known |
| `userApi.ts` fix breaks existing tests if path is referenced elsewhere | LOW | LOW | Only 3 occurrences in the same file; all tests pass through MSW, not real server |
| Dashboard `teamMembers: 0` is accepted by frontend schema | LOW | NONE | `z.number().nonnegative()` accepts 0; no UI change needed |
| `z.coerce.number()` returns `NaN` for non-numeric input | LOW | NONE | `.int()` rejects `NaN` → validation error → 400 response with field details |

---

## Appendix: Pre-existing Bug Checklist

- [ ] `src/features/auth/api/userApi.ts:80` — `/api/users/me` → `/users/me`
- [ ] `src/features/auth/api/userApi.ts:119` — `/api/users/me` → `/users/me`
- [ ] `src/features/auth/api/userApi.ts:151` — `/api/users/me/password` → `/users/me/password`

---

*End of plan.*
