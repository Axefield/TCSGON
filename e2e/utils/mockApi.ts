/**
 * Playwright route interceptors — provide mock API data for E2E tests.
 *
 * Call the relevant setup function in your test's `beforeEach` to
 * intercept all API requests that the page makes.
 *
 * @see docs/plans/phase-2-data-and-features.md §9
 */
import type { Page } from '@playwright/test';

const TEN_MIN_MS = 600_000;
const E2E_SESSION_KEY = 'tcs.auth';
const E2E_SESSION_VALUE = JSON.stringify({
  id: 'sess-e2e',
  token: 'e2e-mock-token-aaaaaaaaaaaaaaaaaaa',
  expiresAt: '2099-01-01T00:00:00.000Z',
  user: { id: 'u-e2e', name: 'E2E User', email: 'e2e@test.com' },
});

const MOCK_DASHBOARD_STATS = {
  totalProjects: 42,
  activeProjects: 18,
  teamMembers: 12,
  completionRate: 73.5,
  recentActivity: [
    {
      id: 'act-001',
      type: 'project_created',
      message: 'Mobile App Redesign project created',
      createdAt: new Date(Date.now() - TEN_MIN_MS).toISOString(),
      projectId: 'proj-001',
    },
    {
      id: 'act-002',
      type: 'status_changed',
      message: 'API Gateway moved to In Progress',
      createdAt: new Date(Date.now() - 2 * TEN_MIN_MS).toISOString(),
      projectId: 'proj-002',
    },
  ],
};

const MOCK_PROJECTS_LIST = {
  items: [
    {
      id: 'proj-001',
      name: 'Mobile App Redesign',
      description: 'Complete redesign of the mobile application UI/UX.',
      status: 'active',
      leadName: 'Alice Chen',
      memberCount: 6,
      createdAt: new Date('2026-06-01T07:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-29T08:30:00Z').toISOString(),
    },
    {
      id: 'proj-002',
      name: 'API Gateway Migration',
      description: 'Migrate from Express to Fastify for better performance.',
      status: 'active',
      leadName: 'Bob Martinez',
      memberCount: 4,
      createdAt: new Date('2026-06-05T09:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-28T14:00:00Z').toISOString(),
    },
    {
      id: 'proj-003',
      name: 'Security Audit Q3',
      description: 'Third-party security audit for all production services.',
      status: 'active',
      leadName: 'Eve Johnson',
      memberCount: 4,
      createdAt: new Date('2026-06-01T07:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-29T08:30:00Z').toISOString(),
    },
    {
      id: 'proj-004',
      name: 'Documentation Sprint',
      description: 'Update all internal and external documentation.',
      status: 'paused',
      leadName: 'Carol Davis',
      memberCount: 3,
      createdAt: new Date('2026-06-10T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-27T16:00:00Z').toISOString(),
    },
    {
      id: 'proj-005',
      name: 'Performance Optimization',
      description: 'Optimize database queries and frontend bundle size.',
      status: 'completed',
      leadName: 'David Wilson',
      memberCount: 5,
      createdAt: new Date('2026-05-20T08:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-25T12:00:00Z').toISOString(),
    },
  ],
  total: 5,
  page: 1,
  pageSize: 3,
  totalPages: 2,
};

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  leadName: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

let createdProjectId = 1;

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function findProject(id: string): Project | undefined {
  return MOCK_PROJECTS_LIST.items.find((p) => p.id === id);
}

export interface MockApiOptions {
  /** When true, `/api/dashboard/stats` returns 500. */
  readonly dashboardError?: boolean;
  /** When true, all `/api/projects*` requests return 500. */
  readonly projectsError?: boolean;
  /** Milliseconds to delay dashboard stats response (default 0). */
  readonly dashboardDelay?: number;
}

/**
 * Intercept all `/api/*` requests and return mock responses.
 * Call at the top of each test (not `beforeEach`) so individual tests
 * can register their own routes *before* calling this if they need
 * to override specific endpoints.
 */
export async function setupMockApi(page: Page, options: MockApiOptions = {}): Promise<void> {
  createdProjectId = 1;
  MOCK_PROJECTS_LIST.items = MOCK_PROJECTS_LIST.items.slice(0, 5);

  // Seed auth session BEFORE the app loads so Redux initializes as
  // `authenticated` and RequireAuth passes through.
  await page.addInitScript(
    (args) => {
      localStorage.setItem(args.key, args.value);
    },
    { key: E2E_SESSION_KEY, value: E2E_SESSION_VALUE },
  );

  await page.route('**/api/dashboard/stats', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    if (options.dashboardDelay && options.dashboardDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.dashboardDelay));
    }
    if (options.dashboardError) {
      await route.fulfill({ status: 500, body: 'Server Error' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DASHBOARD_STATS),
    });
  });

  await page.route('**/api/projects**', async (route) => {
    const url = route.request().url();
    const urlObj = new URL(url);
    const method = route.request().method();

    if (options.projectsError) {
      await route.fulfill({ status: 500, body: 'Server Error' });
      return;
    }

    // Extract project ID from path: /api/projects/<id>
    const pathMatch = urlObj.pathname.match(/\/api\/projects\/([^\/]+)$/);
    const id = pathMatch ? pathMatch[1] : null;

    if (id) {
      // Detail route: /api/projects/<id>
      if (method === 'GET') {
        const project = findProject(id);
        if (project) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(project),
          });
        } else {
          await route.fulfill({ status: 404, body: 'Not found' });
        }
      } else if (method === 'PUT') {
        const body = route.request().postDataJSON();
        const project = findProject(id);
        if (project) {
          project.name = body.name ?? project.name;
          project.description = body.description ?? project.description;
          project.status = body.status ?? project.status;
          project.leadName = body.leadName ?? project.leadName;
          project.updatedAt = new Date().toISOString();
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(clone(project)),
          });
        } else {
          await route.fulfill({ status: 404, body: 'Not found' });
        }
      } else if (method === 'DELETE') {
        const idx = MOCK_PROJECTS_LIST.items.findIndex((p) => p.id === id);
        if (idx !== -1) {
          MOCK_PROJECTS_LIST.items.splice(idx, 1);
          await route.fulfill({ status: 204 });
        } else {
          await route.fulfill({ status: 404, body: 'Not found' });
        }
      } else {
        await route.fallback();
      }
    } else {
      // List route: /api/projects (with optional query string)
      if (method === 'GET') {
        const search = urlObj.searchParams.get('search')?.toLowerCase();
        const statusFilter = urlObj.searchParams.get('status');
        let items = MOCK_PROJECTS_LIST.items;
        if (search) {
          items = items.filter(
            (p) =>
              p.name.toLowerCase().includes(search) ||
              p.leadName.toLowerCase().includes(search),
          );
        }
        if (statusFilter && statusFilter !== 'all') {
          items = items.filter((p) => p.status === statusFilter);
        }
        const filtered = clone({ ...MOCK_PROJECTS_LIST, items, total: items.length });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(filtered),
        });
      } else if (method === 'POST') {
        const body = route.request().postDataJSON();
        const newId = `proj-e2e-${String(createdProjectId++).padStart(3, '0')}`;
        const now = new Date().toISOString();
        const project: Project = {
          id: newId,
          name: body.name ?? 'New Project',
          description: body.description ?? '',
          status: body.status ?? 'active',
          leadName: body.leadName ?? '',
          memberCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        MOCK_PROJECTS_LIST.items.push(project);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(project),
        });
      } else {
        await route.fallback();
      }
    }
  });
}
