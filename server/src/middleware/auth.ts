import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { AppError } from '../types/index.js';
import { hashToken } from '../lib/crypto.js';
import { prisma } from '../lib/prisma.js';

/**
 * Middleware that validates the session token from the Authorization header.
 *
 * Expects: `Authorization: Bearer <token>`
 * On success: attaches `user` and `session` to the request.
 * On failure: throws 401 AppError.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required.');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid authorization header format. Expected: Bearer <token>');
    }

    const token = parts[1];
    if (!token || token.length < 20) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid token format.');
    }

    const tokenHash = hashToken(token);

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      throw new AppError(401, 'UNAUTHORIZED', 'Session not found. Please log in again.');
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.session.delete({ where: { id: session.id } });
      throw new AppError(401, 'UNAUTHORIZED', 'Session expired. Please log in again.');
    }

    req.user = session.user;
    req.session = session;
    next();
  } catch (err) {
    next(err);
  }
}
