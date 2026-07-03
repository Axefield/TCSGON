import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Middleware factory that validates the request body against a Zod schema.
 * Returns 400 with field-level errors on mismatch.
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Middleware factory that validates request query parameters against a Zod schema.
 * Returns 400 with field-level errors on mismatch.
 * Query params arrive as strings; use `z.coerce.number()` for numeric fields.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Replace the query property with parsed/coerced data.
    // Using Object.defineProperty to handle Node.js >=20 readonly getter
    // on IncomingMessage.prototype.query.
    Object.defineProperty(req, 'query', {
      value: result.data,
      configurable: true,
      writable: true,
    });
    next();
  };
}
