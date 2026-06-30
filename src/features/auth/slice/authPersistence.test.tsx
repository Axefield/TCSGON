/**
 * authPersistence tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §7
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { loadAuth, saveAuth, clearAuth } from './authPersistence';
import type { Session } from '@/shared/types/user';
import { asSessionId, asUserId } from '@/shared/types/brand';

const validSession: Session = {
  id: asSessionId('sess-1'),
  token: 'a'.repeat(20),
  expiresAt: '2099-01-01T00:00:00.000Z',
  user: { id: asUserId('u-1'), name: 'Test', email: 'test@example.com' },
};

beforeEach(() => {
  // Clear localStorage before each test.
  localStorage.clear();
});

describe('loadAuth', () => {
  it('returns null when no stored data', () => {
    expect(loadAuth()).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    localStorage.setItem('tcs.auth', '{bad');
    expect(loadAuth()).toBeNull();
  });

  it('returns null for expired token', () => {
    const expired = {
      ...validSession,
      expiresAt: '2020-01-01T00:00:00.000Z',
    };
    localStorage.setItem('tcs.auth', JSON.stringify(expired));
    expect(loadAuth()).toBeNull();
    // Expired data should be cleared.
    expect(localStorage.getItem('tcs.auth')).toBeNull();
  });

  it('returns parsed session for valid data', () => {
    localStorage.setItem('tcs.auth', JSON.stringify(validSession));
    const result = loadAuth();
    expect(result).not.toBeNull();
    expect(result!.user.email).toBe('test@example.com');
  });
});

describe('saveAuth', () => {
  it('writes to localStorage', () => {
    saveAuth(validSession);
    const raw = localStorage.getItem('tcs.auth');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.token).toBe(validSession.token);
  });
});

describe('clearAuth', () => {
  it('removes from localStorage', () => {
    localStorage.setItem('tcs.auth', 'something');
    clearAuth();
    expect(localStorage.getItem('tcs.auth')).toBeNull();
  });
});
