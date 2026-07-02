import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, type ApiErrorResponse } from '../types/index.js';

/**
 * Global error handler middleware.
 * Maps known error types to structured JSON responses.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  void _next;

  // Zod validation errors → 400
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || '_root';
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }

    const body: ApiErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details,
      },
    };
    res.status(400).json(body);
    return;
  }

  // Prisma unique constraint violation → 409
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      const body: ApiErrorResponse = {
        error: {
          code: 'CONFLICT',
          message: `A record with this ${target} already exists.`,
        },
      };
      res.status(409).json(body);
      return;
    }

    // Record not found → 404
    if (err.code === 'P2025') {
      const body: ApiErrorResponse = {
        error: {
          code: 'NOT_FOUND',
          message: 'The requested record was not found.',
        },
      };
      res.status(404).json(body);
      return;
    }
  }

  // Application errors with explicit status code
  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown errors → 500
  console.error('Unhandled error:', err);

  const body: ApiErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    },
  };
  res.status(500).json(body);
}
