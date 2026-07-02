/**
 * MSW handlers for auth endpoints.
 *
 * These mirror the auth API endpoints the app expects. Handlers are shared
 * between unit tests (via `server.use()`) and E2E tests (via import).
 *
 * @see docs/plans/phase-2-data-and-features.md §8.2
 * @see docs/plans/phase-3-authentication.md
 */
import { http, HttpResponse } from 'msw';

import { asUserId, asSessionId } from '@/shared/types/brand';

import type { LoginInput, SignupInput } from '@/shared/types/user';

const DEFAULT_USER = {
  id: asUserId('user-001'),
  email: 'admin@tcsgon.dev',
  name: 'Admin User',
  role: 'admin' as const,
};

const BASE = '/api/auth';

function makeSession() {
  return {
    id: asSessionId('sess-' + crypto.randomUUID().slice(0, 8)),
    token: 'msw-test-token-' + crypto.randomUUID(),
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  };
}

function makeAuthResponse() {
  return {
    user: DEFAULT_USER,
    session: makeSession(),
  };
}

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

    return HttpResponse.json(makeAuthResponse());
  }),

  /** POST /api/auth/signup — create a new account */
  http.post(`${BASE}/signup`, async ({ request }) => {
    const body = (await request.json()) as SignupInput;

    if (!body.email || !body.password || !body.name) {
      return HttpResponse.json(
        { message: 'Name, email, and password are required.' },
        { status: 400 },
      );
    }

    if (body.password.length < 8) {
      return HttpResponse.json(
        { message: 'Password must be at least 8 characters.' },
        { status: 400 },
      );
    }

    return HttpResponse.json(makeAuthResponse(), { status: 201 });
  }),

  /** GET /api/auth/session — validate token and return current user */
  http.get(`${BASE}/session`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }
    return HttpResponse.json({
      user: DEFAULT_USER,
      session: {
        id: asSessionId('sess-' + crypto.randomUUID().slice(0, 8)),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      },
    });
  }),

  /** POST /api/auth/logout — invalidate session */
  http.post(`${BASE}/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully.' });
  }),

  /** POST /api/auth/forgot-password — request password reset (always 200) */
  http.post(`${BASE}/forgot-password`, async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body.email) {
      return HttpResponse.json(
        { message: 'Email is required.' },
        { status: 400 },
      );
    }
    // Always return 200 to prevent email enumeration.
    return HttpResponse.json({
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  }),

  /** POST /api/auth/reset-password — complete password reset */
  http.post(`${BASE}/reset-password`, async ({ request }) => {
    const body = (await request.json()) as { token?: string; password?: string };
    if (!body.token || !body.password) {
      return HttpResponse.json(
        { message: 'Token and password are required.' },
        { status: 400 },
      );
    }
    if (body.password.length < 8) {
      return HttpResponse.json(
        { message: 'Password must be at least 8 characters.' },
        { status: 400 },
      );
    }
    return HttpResponse.json(makeAuthResponse());
  }),
];
