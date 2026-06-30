/**
 * errors.ts unit tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  ApiError,
  apiErrorMessage,
  flattenZodIssues,
  isApiErrorKind,
  newCorrelationId,
} from './errors';

describe('ApiError', () => {
  it('creates a network error', () => {
    const err = new ApiError({ kind: 'network', message: 'Offline', correlationId: 'abc' });
    expect(err).toBeInstanceOf(Error);
    expect(err.kind).toBe('network');
    expect(err.message).toBe('Offline');
  });

  it('creates a timeout error with timeoutMs', () => {
    const err = new ApiError({ kind: 'timeout', message: 'Timed out', correlationId: 'abc', timeoutMs: 5000 });
    expect(err.kind).toBe('timeout');
    expect(err.detail.kind).toBe('timeout');
    if (err.detail.kind === 'timeout') {
      expect(err.detail.timeoutMs).toBe(5000);
    }
  });

  it('creates an aborted error', () => {
    const err = new ApiError({ kind: 'aborted', message: 'Cancelled', correlationId: 'abc' });
    expect(err.kind).toBe('aborted');
  });

  it('creates an http error with status and body', () => {
    const err = new ApiError({ kind: 'http', message: 'Not found', correlationId: 'abc', status: 404, body: { error: 'missing' } });
    expect(err.kind).toBe('http');
    if (err.detail.kind === 'http') {
      expect(err.detail.status).toBe(404);
    }
  });

  it('creates a validation error with issues', () => {
    const err = new ApiError({
      kind: 'validation',
      message: 'Invalid input',
      correlationId: 'abc',
      issues: [{ path: 'email', message: 'Invalid email' }],
    });
    expect(err.kind).toBe('validation');
    if (err.detail.kind === 'validation') {
      expect(err.detail.issues).toHaveLength(1);
    }
  });

  it('creates an unauthorized error', () => {
    const err = new ApiError({ kind: 'unauthorized', message: 'Session expired', correlationId: 'abc' });
    expect(err.kind).toBe('unauthorized');
  });
});

describe('apiErrorMessage', () => {
  it('returns offline message for network', () => {
    const err = new ApiError({ kind: 'network', message: '', correlationId: '' });
    expect(apiErrorMessage(err)).toMatch(/offline/i);
  });

  it('returns timeout message', () => {
    const err = new ApiError({ kind: 'timeout', message: '', correlationId: '', timeoutMs: 5000 });
    expect(apiErrorMessage(err)).toMatch(/timed out/i);
  });

  it('returns cancelled message for aborted', () => {
    const err = new ApiError({ kind: 'aborted', message: '', correlationId: '' });
    expect(apiErrorMessage(err)).toMatch(/cancelled/i);
  });

  it('returns server error for 5xx', () => {
    const err = new ApiError({ kind: 'http', message: '', correlationId: '', status: 500, body: {} });
    expect(apiErrorMessage(err)).toMatch(/server error/i);
  });

  it('returns not found for 404', () => {
    const err = new ApiError({ kind: 'http', message: '', correlationId: '', status: 404, body: {} });
    expect(apiErrorMessage(err)).toMatch(/not found/i);
  });

  it('returns forbidden for 403', () => {
    const err = new ApiError({ kind: 'http', message: '', correlationId: '', status: 403, body: {} });
    expect(apiErrorMessage(err)).toMatch(/permission/i);
  });

  it('returns generic for unrecognized status', () => {
    const err = new ApiError({ kind: 'http', message: '', correlationId: '', status: 418, body: {} });
    expect(apiErrorMessage(err)).toMatch(/failed/i);
  });

  it('joins validation issues', () => {
    const err = new ApiError({
      kind: 'validation',
      message: '',
      correlationId: '',
      issues: [{ path: 'email', message: 'invalid' }, { path: 'password', message: 'too short' }],
    });
    const msg = apiErrorMessage(err);
    expect(msg).toContain('email');
    expect(msg).toContain('password');
  });

  it('returns sign-in message for unauthorized', () => {
    const err = new ApiError({ kind: 'unauthorized', message: '', correlationId: '' });
    expect(apiErrorMessage(err)).toMatch(/sign in/i);
  });
});

describe('isApiErrorKind', () => {
  it('returns true if kind matches', () => {
    const err = new ApiError({ kind: 'network', message: '', correlationId: '' });
    expect(isApiErrorKind(err, 'network')).toBe(true);
  });

  it('returns false if kind does not match', () => {
    const err = new ApiError({ kind: 'network', message: '', correlationId: '' });
    expect(isApiErrorKind(err, 'http')).toBe(false);
  });

  it('returns false for non-ApiError values', () => {
    expect(isApiErrorKind(new Error('foo'), 'network')).toBe(false);
    expect(isApiErrorKind('string', 'network')).toBe(false);
    expect(isApiErrorKind(null, 'network')).toBe(false);
  });
});

describe('flattenZodIssues', () => {
  it('converts ZodIssue array to flat shape', () => {
    const issues: z.ZodIssue[] = [
      { code: 'invalid_type', path: ['email'], message: 'Invalid email', expected: 'string', received: 'undefined' },
      { code: 'too_small', path: ['password'], message: 'Too short', minimum: 8, type: 'string', inclusive: true, exact: false },
    ];
    const flat = flattenZodIssues(issues);
    expect(flat).toHaveLength(2);
    expect(flat[0]).toEqual({ path: 'email', message: 'Invalid email' });
    expect(flat[1]).toEqual({ path: 'password', message: 'Too short' });
  });

  it('handles nested paths', () => {
    const issues: z.ZodIssue[] = [
      { code: 'invalid_type', path: ['user', 'address', 'city'], message: 'Required', expected: 'string', received: 'undefined' },
    ];
    const flat = flattenZodIssues(issues);
    expect(flat).toBeDefined();
    if (flat[0]) {
      expect(flat[0].path).toBe('user.address.city');
    }
  });

  it('returns empty array for no issues', () => {
    expect(flattenZodIssues([])).toHaveLength(0);
  });
});

describe('newCorrelationId', () => {
  it('returns a non-empty string', () => {
    const id = newCorrelationId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => newCorrelationId()));
    expect(ids.size).toBeGreaterThan(90);
  });
});
