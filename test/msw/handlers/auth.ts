/**
 * MSW handlers for auth endpoints.
 *
 * These mirror the auth API endpoints the app expects. Handlers are shared
 * between unit tests (via `server.use()`) and E2E tests (via import).
 *
 * @see docs/plans/phase-2-data-and-features.md §8.2
 */
import { http, HttpResponse } from 'msw';

import { asUserId, asSessionId } from '@/shared/types/brand';

import type { LoginInput } from '@/shared/types/user';

const DEFAULT_USER = {
  id: asUserId('user-001'),
  email: 'admin@tcsgon.dev',
  name: 'Admin User',
  role: 'admin' as const,
};

const BASE = '/api/auth';

export const authHandlers = [
  /** POST /api/auth/login — authenticate with email + password */
  http.post(`${BASE}/login`, async ({ request }) => {
    const body = (await request.json()) as LoginInput;

    if (!body.email || !body.password) {
      return HttpResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 },
      );
    }

    if (body.password.length < 6) {
      return HttpResponse.json(
        { message: 'Invalid credentials.' },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      user: DEFAULT_USER,
      session: {
        id: asSessionId('sess-' + crypto.randomUUID().slice(0, 8)),
        token: 'msw-test-token-' + crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      },
    });
  }),

  /** GET /api/auth/session — validate token and return current user */
  http.get(`${BASE}/session`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }
    return HttpResponse.json({ user: DEFAULT_USER });
  }),

  /** POST /api/auth/logout — invalidate session */
  http.post(`${BASE}/logout`, () => {
    return HttpResponse.json({ ok: true });
  }),
];
