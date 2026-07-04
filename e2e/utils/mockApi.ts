/**
 * Playwright route interceptors — provide mock API data for E2E tests.
 *
 * Call the relevant setup function in your test's `beforeEach` to
 * intercept all API requests that the page makes.
 *
 * @see docs/plans/phase-2-data-and-features.md §9
 * @see docs/plans/phase-3-authentication.md
 */
import type { Page } from '@playwright/test';

const TEN_MIN_MS = 600_000;
const E2E_SESSION_KEY = 'tcs.auth';

const MOCK_USER = {
  id: 'u-e2e',
  name: 'E2E User',
  email: 'e2e@test.com',
  role: 'admin' as const,
  avatarUrl: null,
};

function makeSessionId(): string {
  return 'sess-e2e-' + crypto.randomUUID().slice(0, 8);
}

function makeE2ESession() {
  return {
    id: makeSessionId(),
    token: 'e2e-mock-token-' + crypto.randomUUID(),
    expiresAt: '2099-01-01T00:00:00.000Z',
  };
}

const DEFAULT_E2E_SESSION_VALUE = JSON.stringify({
  ...makeE2ESession(),
  user: MOCK_USER,
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
  /**
   * When false, do NOT seed a session in localStorage so the app starts
   * unauthenticated (default true for backward compatibility with existing
   * dashboard/projects E2E tests).
   */
  readonly authenticated?: boolean;
  /**
   * Simulate auth error conditions:
   * - `'invalid'` — login/session endpoints return 401
   * - `'expired'` — session exists but session-check returns 401
   * - `'conflict'` — signup returns 409 (duplicate email)
   */
  readonly authError?: 'invalid' | 'expired' | 'conflict';
  /** When true, auth endpoints abort with a network error (simulates offline). */
  readonly authNetworkError?: boolean;
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
  // `authenticated` and RequireAuth passes through. Skip when
  // `authenticated: false` but STILL seed when `authError: 'expired'`
  // (need the session to exist initially so we can test expiry).
  // Mutable so the logout handler can clear it mid-test.
  let seedSession = options.authenticated !== false;
  if (seedSession) {
    await page.addInitScript(
      (args: { key: string; value: string }) => {
        localStorage.setItem(args.key, args.value);
      },
      { key: E2E_SESSION_KEY, value: DEFAULT_E2E_SESSION_VALUE },
    );
  }

  // ── Auth endpoint handlers ──────────────────────────────────────────
  // Registered first; Playwright uses the FIRST matching route, so these
  // take precedence over the catch-all below.

  await page.route('**/api/auth/login', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    if (options.authNetworkError) {
      await route.abort();
      return;
    }
    if (options.authError === 'invalid') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials.' }),
      });
      return;
    }
    const body = route.request().postDataJSON();
    if (!body.email || !body.password) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email and password are required.' }),
      });
      return;
    }
    // Accept any password >= 6 chars
    if (String(body.password).length < 6) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials.' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: MOCK_USER,
        session: makeE2ESession(),
      }),
    });
  });

  await page.route('**/api/auth/signup', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const body = route.request().postDataJSON();
    if (!body.email || !body.password || !body.name) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Name, email, and password are required.' }),
      });
      return;
    }
    if (String(body.password).length < 8) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password must be at least 8 characters.' }),
      });
      return;
    }
    if (options.authError === 'conflict' || body.email === 'taken@example.com') {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'CONFLICT', message: 'Email is already in use.' },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { ...MOCK_USER, email: body.email, name: body.name },
        session: makeE2ESession(),
      }),
    });
  });

  await page.route('**/api/auth/session', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    // When no session was seeded OR `authError: 'expired'`, return 401.
    // Note: the app's API client doesn't send the Authorization header
    // on session check (see main.tsx — no getToken resolver).
    if (!seedSession || options.authError === 'expired') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized.' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: MOCK_USER,
        session: { id: makeSessionId(), expiresAt: '2099-01-01T00:00:00.000Z' },
      }),
    });
  });

  await page.route('**/api/auth/logout', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    // Clear the session so the next session check returns 401,
    // preventing the app from re-authenticating after logout.
    seedSession = false;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Logged out successfully.' }),
    });
  });

  await page.route('**/api/auth/forgot-password', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    if (options.authNetworkError) {
      await route.abort();
      return;
    }
    const body = route.request().postDataJSON();
    if (!body.email) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email is required.' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'If an account exists with this email, a reset link has been sent.',
      }),
    });
  });

  await page.route('**/api/auth/reset-password', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const body = route.request().postDataJSON();
    if (!body.token || !body.password) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Token and password are required.' }),
      });
      return;
    }
    if (String(body.password).length < 8) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password must be at least 8 characters.' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: MOCK_USER,
        session: makeE2ESession(),
      }),
    });
  });

  // ── User profile endpoint handlers ──────────────────────────────────

  await page.route('**/api/users/me', async (route) => {
    const method = route.request().method();
    // Note: the app's createApiClient doesn't send Authorization header
    // (see main.tsx — no getToken resolver). Always return 200 for mock.
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u-e2e',
          name: 'E2E User',
          email: 'e2e@test.com',
          role: 'admin',
          avatarUrl: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-06-01T00:00:00.000Z',
        }),
      });
    } else if (method === 'PUT') {
      const body = route.request().postDataJSON();
      if (body.name !== undefined && (typeof body.name !== 'string' || body.name.length < 1)) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { code: 'VALIDATION_ERROR', message: 'Name is required.' },
          }),
        });
        return;
      }
      if (body.email === 'taken@example.com') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { code: 'CONFLICT', message: 'Email is already in use.' },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u-e2e',
          name: body.name ?? 'E2E User',
          email: body.email ?? 'e2e@test.com',
          role: 'admin',
          avatarUrl: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: new Date().toISOString(),
        }),
      });
    } else {
      await route.fallback();
    }
  });

  await page.route('**/api/users/me/password', async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.fallback();
      return;
    }
    const body = route.request().postDataJSON();
    if (!body.currentPassword) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'VALIDATION_ERROR', message: 'Current password is required.' },
        }),
      });
      return;
    }
    if (!body.newPassword || String(body.newPassword).length < 8) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters.' },
        }),
      });
      return;
    }
    if (body.currentPassword !== 'correct-current-password') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'UNAUTHORIZED', message: 'Current password is incorrect.' },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Password changed successfully.' }),
    });
  });

  // ── Notification preferences handler ─────────────────────────────────

  await page.route('**/api/users/me/notification-preferences', async (route) => {
    const method = route.request().method();
    const MOCK_NOTIF_PREFS = {
      id: 'np-e2e',
      userId: 'u-e2e',
      emailNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      dailyDigest: false,
      marketingEmails: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NOTIF_PREFS),
      });
    } else if (method === 'PUT') {
      const body = route.request().postDataJSON();
      const updated = {
        ...MOCK_NOTIF_PREFS,
        ...body,
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
    } else {
      await route.fallback();
    }
  });

  // ── Dashboard handler ───────────────────────────────────────────────

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

  // ── Projects handler ────────────────────────────────────────────────

  await page.route('**/api/projects**', async (route) => {
    const url = route.request().url();
    const urlObj = new URL(url);
    const method = route.request().method();

    if (options.projectsError) {
      await route.fulfill({ status: 500, body: 'Server Error' });
      return;
    }

    // Extract project ID from path: /api/projects/<id>
    const pathMatch = urlObj.pathname.match(/\/api\/projects\/([^/]+)$/);
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
