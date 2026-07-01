/**
 * MSW handlers for projects CRUD endpoints.
 *
 * Uses an in-memory store seeded with sample projects so tests have
 * predictable data. Mutations modify the store; use `server.resetHandlers()`
 * or re-import for isolation between tests.
 *
 * @see docs/plans/phase-2-data-and-features.md §8.2
 */
import { http, HttpResponse } from 'msw';

import { asProjectId } from '@/shared/types/brand';

import type { Project, ProjectInput, ProjectListParams, ProjectListResponse } from '@/features/projects/types';

/** In-memory project store — seeded on module load. */
function createSeedProjects(): Project[] {
  return [
    {
      id: asProjectId('proj-001'),
      name: 'Mobile App Redesign',
      description: 'Redesign the mobile application for better UX and performance.',
      status: 'active',
      leadName: 'Alice Chen',
      memberCount: 5,
      createdAt: new Date('2026-01-15T08:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-28T14:30:00Z').toISOString(),
    },
    {
      id: asProjectId('proj-002'),
      name: 'Q4 Roadmap Planning',
      description: 'Plan and prioritize Q4 deliverables across teams.',
      status: 'active',
      leadName: 'Bob Martinez',
      memberCount: 3,
      createdAt: new Date('2026-03-01T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-25T09:15:00Z').toISOString(),
    },
    {
      id: asProjectId('proj-003'),
      name: 'API Gateway Documentation',
      description: '',
      status: 'paused',
      leadName: 'Carol Nguyen',
      memberCount: 2,
      createdAt: new Date('2026-04-10T13:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-20T16:45:00Z').toISOString(),
    },
    {
      id: asProjectId('proj-004'),
      name: 'Legacy Migration',
      description: 'Migrate legacy services to the new platform architecture.',
      status: 'completed',
      leadName: 'David Kim',
      memberCount: 8,
      createdAt: new Date('2025-11-05T09:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-01T11:00:00Z').toISOString(),
    },
    {
      id: asProjectId('proj-005'),
      name: 'Security Audit Q3',
      description: 'Third-party security audit for all production services.',
      status: 'active',
      leadName: 'Eve Johnson',
      memberCount: 4,
      createdAt: new Date('2026-06-01T07:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-29T08:30:00Z').toISOString(),
    },
  ];
}

// Mutable store — each test file gets a fresh copy via the reset handler.
let projects: Project[] = createSeedProjects();

const BASE = '/api/projects';

export const projectHandlers = [
  /** GET /api/projects — paginated list with optional sorting and filter */
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 10));
    const sort = (url.searchParams.get('sort') ?? 'createdAt') as ProjectListParams['sort'];
    const order = (url.searchParams.get('order') ?? 'desc') as ProjectListParams['order'];
    const search = url.searchParams.get('search') ?? '';
    const statusFilter = url.searchParams.get('status') ?? '';

    let filtered = [...projects];

    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.leadName.toLowerCase().includes(q),
      );
    }

    // Sort
    if (sort) {
      filtered.sort((a, b) => {
        const aVal = String(a[sort] ?? '');
        const bVal = String(b[sort] ?? '');
        const cmp = aVal.localeCompare(bVal);
        return order === 'asc' ? cmp : -cmp;
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    const response: ProjectListResponse = {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };

    return HttpResponse.json(response);
  }),

  /** GET /api/projects/:id — single project detail */
  http.get(`${BASE}/:id`, ({ params }) => {
    const project = projects.find((p) => p.id === params.id);
    if (!project) {
      return HttpResponse.json({ message: 'Project not found.' }, { status: 404 });
    }
    return HttpResponse.json(project);
  }),

  /** POST /api/projects — create a new project */
  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as ProjectInput;

    if (!body.name || body.name.trim().length === 0) {
      return HttpResponse.json(
        { message: 'Name is required.', issues: [{ path: 'name', message: 'Name is required.' }] },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const project: Project = {
      id: asProjectId('proj-' + crypto.randomUUID().slice(0, 8)),
      name: body.name,
      description: body.description ?? '',
      status: body.status ?? 'active',
      leadName: body.leadName,
      memberCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    projects = [project, ...projects];

    return HttpResponse.json(project, { status: 201 });
  }),

  /** PUT /api/projects/:id — update an existing project */
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const index = projects.findIndex((p) => p.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    const body = (await request.json()) as ProjectInput;

    if (!body.name || body.name.trim().length === 0) {
      return HttpResponse.json(
        { message: 'Name is required.', issues: [{ path: 'name', message: 'Name is required.' }] },
        { status: 400 },
      );
    }

    const existing = projects[index]!;
    const updated: Project = {
      ...existing,
      name: body.name,
      description: body.description ?? existing.description,
      status: body.status ?? existing.status,
      leadName: body.leadName,
      updatedAt: new Date().toISOString(),
    };

    projects = [...projects.slice(0, index), updated, ...projects.slice(index + 1)];

    return HttpResponse.json(updated);
  }),

  /** DELETE /api/projects/:id — delete a project */
  http.delete(`${BASE}/:id`, ({ params }) => {
    const index = projects.findIndex((p) => p.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    projects = [...projects.slice(0, index), ...projects.slice(index + 1)];

    return HttpResponse.json(null, { status: 204 });
  }),
];

/**
 * Reset the in-memory store to seed data.
 * Call in `afterEach` via `server.resetHandlers()` or directly.
 */
export function resetProjectStore(): void {
  projects = createSeedProjects();
}
