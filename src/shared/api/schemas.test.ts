/**
 * Schema registry tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §6
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { defineSchema, Schemas } from './schemas';

describe('defineSchema', () => {
  it('returns a named schema object', () => {
    const schema = z.object({ id: z.string() });
    const named = defineSchema('test', schema);
    expect(named.name).toBe('test');
    expect(named.schema).toBe(schema);
  });
});

describe('Schemas', () => {
  it('contains user schema', () => {
    expect(Schemas.user.name).toBe('user');
    const result = Schemas.user.schema.safeParse({ id: '1', name: 'Alice', email: 'alice@test.com' });
    expect(result.success).toBe(true);
  });

  it('contains session schema', () => {
    expect(Schemas.session.name).toBe('session');
    const result = Schemas.session.schema.safeParse({
      id: 'sess_123',
      user: { id: '1', name: 'Alice', email: 'alice@test.com' },
      token: 'a'.repeat(20),
      expiresAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('contains loginInput schema', () => {
    expect(Schemas.loginInput.name).toBe('loginInput');
    const result = Schemas.loginInput.schema.safeParse({ email: 'a@b.com', password: '12345678' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid loginInput', () => {
    const result = Schemas.loginInput.schema.safeParse({ email: 'not-an-email', password: 'short' });
    expect(result.success).toBe(false);
  });
});
