import type { Request } from 'express';
import type { User, Session } from '@prisma/client';

/**
 * Express request augmented with authenticated user and session.
 * Set by `requireAuth` middleware after successful session validation.
 */
export interface AuthenticatedRequest extends Request {
  user: User;
  session: Session;
}

/**
 * Standard API error shape returned to the client.
 */
export interface ApiErrorResponse {
  error: {
    code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'CONFLICT' | 'NOT_FOUND' | 'INTERNAL_ERROR';
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Session response shape returned from auth endpoints.
 */
export interface SessionResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  session: {
    id: string;
    token: string;
    expiresAt: string;
  };
}

/**
 * Application error with HTTP status code.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ApiErrorResponse['error']['code'],
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
