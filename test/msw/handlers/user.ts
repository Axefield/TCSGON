/**
 * MSW handlers for user profile endpoints.
 *
 * Mirrors GET/PUT /api/users/me and PUT /api/users/me/password.
 * Shared between unit tests (via `server.use()`) and E2E tests (via import).
 *
 * @see docs/plans/phase-3-authentication.md § User Profile Settings
 */
import { http, HttpResponse } from 'msw';

import { asUserId } from '@/shared/types/brand';

import type { ChangePasswordInput, UpdateProfileInput } from '@/shared/types/user';

const BASE = '/api/users';

const DEFAULT_PROFILE = {
  id: asUserId('user-001'),
  email: 'admin@tcsgon.dev',
  name: 'Admin User',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

// Track mutable profile for tests that update it.
let currentProfile = { ...DEFAULT_PROFILE };

export function resetProfile(): void {
  currentProfile = { ...DEFAULT_PROFILE };
}

export const userHandlers = [
  /** GET /api/users/me — return current user profile */
  http.get(`${BASE}/me`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 },
      );
    }
    return HttpResponse.json(currentProfile);
  }),

  /** PUT /api/users/me — update name and/or email */
  http.put(`${BASE}/me`, async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 },
      );
    }

    const body = (await request.json()) as UpdateProfileInput;

    // Validate
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.length < 1)) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Name is required.', details: { name: ['Name is required.'] } } },
        { status: 400 },
      );
    }

    // Simulate 409 for duplicate email
    if (body.email === 'taken@example.com') {
      return HttpResponse.json(
        { error: { code: 'CONFLICT', message: 'Email is already in use.', details: { email: ['Email is already in use.'] } } },
        { status: 409 },
      );
    }

    // Update profile
    if (body.name !== undefined) currentProfile.name = body.name;
    if (body.email !== undefined) currentProfile.email = body.email;
    currentProfile.updatedAt = new Date().toISOString();

    return HttpResponse.json({
      id: currentProfile.id,
      name: currentProfile.name,
      email: currentProfile.email,
      createdAt: currentProfile.createdAt,
      updatedAt: currentProfile.updatedAt,
    });
  }),

  /** PUT /api/users/me/password — change password */
  http.put(`${BASE}/me/password`, async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ChangePasswordInput;

    if (!body.currentPassword) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Current password is required.', details: { currentPassword: ['Current password is required.'] } } },
        { status: 400 },
      );
    }

    if (!body.newPassword || body.newPassword.length < 8) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters.', details: { newPassword: ['New password must be at least 8 characters.'] } } },
        { status: 400 },
      );
    }

    // Simulate incorrect current password
    if (body.currentPassword !== 'correct-current-password') {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Current password is incorrect.' } },
        { status: 401 },
      );
    }

    return HttpResponse.json({ message: 'Password changed successfully.' });
  }),
];
