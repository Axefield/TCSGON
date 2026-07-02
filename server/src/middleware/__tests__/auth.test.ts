import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireAuth } from '../auth.js';
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../types/index.js';
import { createAuthenticatedUser } from '../../test-utils.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../types/index.js';

beforeEach(async () => {
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

function createReqRes(token?: string) {
  const req = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as AuthenticatedRequest;
  const res = {} as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('requireAuth middleware', () => {
  it('calls next with no error for valid token', async () => {
    const { user, session, token } = await createAuthenticatedUser();
    const { req, res, next } = createReqRes(token);

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(user.id);
    expect(req.session).toBeDefined();
    expect(req.session.id).toBe(session.id);
  });

  it('calls next with AppError (401) when no auth header', async () => {
    const { req, res, next } = createReqRes();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0]![0] as AppError;
    expect(error.statusCode).toBe(401);
  });

  it('calls next with AppError (401) for malformed header', async () => {
    const req = { headers: { authorization: 'InvalidFormat' } } as AuthenticatedRequest;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0]![0] as AppError;
    expect(error.statusCode).toBe(401);
  });

  it('calls next with AppError (401) for invalid token', async () => {
    const { req, res, next } = createReqRes('invalid-token-that-is-long-enough-12345');

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0]![0] as AppError;
    expect(error.statusCode).toBe(401);
  });

  it('calls next with AppError (401) for expired session', async () => {
    const { user } = await createAuthenticatedUser();
    const { createTestSession } = await import('../../test-utils.js');
    const { session, token } = await createTestSession(user.id, {
      expiresAt: new Date(Date.now() - 1000),
    });

    const { req, res, next } = createReqRes(token);

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0]![0] as AppError;
    expect(error.statusCode).toBe(401);

    // Expired session should be cleaned up
    const found = await prisma.session.findUnique({ where: { id: session.id } });
    expect(found).toBeNull();
  });

  it('calls next with AppError (401) for short token', async () => {
    const { req, res, next } = createReqRes('short');

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0]![0] as AppError;
    expect(error.statusCode).toBe(401);
  });
});
