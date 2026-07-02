import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../validate.js';
import type { Request, Response, NextFunction } from 'express';

function createMockReqRes(body: unknown) {
  const req = { body } as Request;
  const res = {} as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('validate middleware', () => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });

  it('calls next with no error for valid body', () => {
    const { req, res, next } = createMockReqRes({ name: 'Alice', email: 'alice@test.com' });
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('parses and replaces body with typed data', () => {
    const { req, res, next } = createMockReqRes({ name: 'Alice', email: 'alice@test.com' });
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(req.body).toEqual({ name: 'Alice', email: 'alice@test.com' });
  });

  it('calls next with ZodError for invalid body', () => {
    const { req, res, next } = createMockReqRes({ name: '', email: 'not-an-email' });
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
  });

  it('calls next with ZodError for missing fields', () => {
    const { req, res, next } = createMockReqRes({});
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
  });

  it('strips unknown fields from body', () => {
    const { req, res, next } = createMockReqRes({
      name: 'Alice',
      email: 'alice@test.com',
      extraField: 'should be stripped',
    });
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(req.body).not.toHaveProperty('extraField');
    expect(req.body).toEqual({ name: 'Alice', email: 'alice@test.com' });
  });
});
