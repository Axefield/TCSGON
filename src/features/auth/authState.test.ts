/**
 * authState tests — discriminated union type guards.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §4
 */
import { describe, expect, it } from 'vitest';

import type { AuthState } from './authState';
import { authInitialState, isAuthenticated, isAuthenticating } from './authState';

describe('authInitialState', () => {
  it('is anonymous', () => {
    expect(authInitialState.kind).toBe('anonymous');
  });
});

describe('isAuthenticated', () => {
  it('returns true for authenticated state', () => {
    const state: AuthState = {
      kind: 'authenticated',
      user: { id: 'u1' as unknown as never, name: 'Alice', email: 'a@b.com' },
      session: { id: 's1' as unknown as never, user: {} as never, token: 'x'.repeat(20), expiresAt: '2026-01-01T00:00:00Z' },
    };
    expect(isAuthenticated(state)).toBe(true);
  });

  it('returns false for anonymous state', () => {
    expect(isAuthenticated({ kind: 'anonymous' })).toBe(false);
  });

  it('returns false for authenticating state', () => {
    expect(isAuthenticated({ kind: 'authenticating' })).toBe(false);
  });

  it('returns false for error state', () => {
    expect(isAuthenticated({ kind: 'error', error: 'bad', user: null })).toBe(false);
  });
});

describe('isAuthenticating', () => {
  it('returns true for authenticating state', () => {
    expect(isAuthenticating({ kind: 'authenticating' })).toBe(true);
  });

  it('returns false for authenticated state', () => {
    const state: AuthState = {
      kind: 'authenticated',
      user: { id: 'u1' as unknown as never, name: 'Alice', email: 'a@b.com' },
      session: { id: 's1' as unknown as never, user: {} as never, token: 'x'.repeat(20), expiresAt: '2026-01-01T00:00:00Z' },
    };
    expect(isAuthenticating(state)).toBe(false);
  });

  it('returns false for anonymous state', () => {
    expect(isAuthenticating({ kind: 'anonymous' })).toBe(false);
  });
});
