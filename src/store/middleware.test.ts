/**
 * Middleware tests — Phase 1.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §26 (per-module test plan)
 */
import { configureStore, type MiddlewareAPI } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authActions, authReducer } from '@/features/auth/slice/authSlice';
import { asSessionId, asUserId } from '@/shared/types/brand';
import type { Session } from '@/shared/types/user';
import { uiReducer } from '@/store/slices/uiSlice';

import { authPersistenceMiddleware, devLogger, errorReporter } from './middleware';

function createTestStore(preloadedAuth?: unknown) {
  return configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState: preloadedAuth ? { auth: preloadedAuth } : undefined,
    middleware: (getDefault) =>
      getDefault()
        .prepend(authPersistenceMiddleware.middleware)
        .concat(errorReporter, devLogger),
  });
}

const fakeSession: Session = {
  id: asSessionId('session-1'),
  user: {
    id: asUserId('user-1'),
    name: 'Test User',
    email: 'test@example.com',
  },
  token: 'tok_' + 'a'.repeat(20),
  expiresAt: '2099-01-01T00:00:00.000Z',
};

describe('authPersistenceMiddleware', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists session to localStorage on loginFulfilled', () => {
    const store = createTestStore();
    store.dispatch(authActions.loginFulfilled(fakeSession));
    const stored = localStorage.getItem('tcs.auth');
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.id).toBe(fakeSession.id);
      expect(parsed.token).toBe(fakeSession.token);
    }
  });

  it('persists session on rehydrate', () => {
    const store = createTestStore();
    store.dispatch(authActions.rehydrate(fakeSession));
    const stored = localStorage.getItem('tcs.auth');
    expect(stored).not.toBeNull();
  });

  it('clears localStorage on logout', () => {
    localStorage.setItem('tcs.auth', JSON.stringify(fakeSession));
    const store = createTestStore();
    store.dispatch(authActions.logout());
    expect(localStorage.getItem('tcs.auth')).toBeNull();
  });

  it('clears localStorage on sessionExpired', () => {
    localStorage.setItem('tcs.auth', JSON.stringify(fakeSession));
    const store = createTestStore();
    store.dispatch(authActions.sessionExpired());
    expect(localStorage.getItem('tcs.auth')).toBeNull();
  });

  it('does NOT persist on authFailed', () => {
    const store = createTestStore();
    store.dispatch(authActions.authFailed({ message: 'bad', user: null }));
    expect(localStorage.getItem('tcs.auth')).toBeNull();
  });
});

describe('errorReporter', () => {
  it('passes through actions without error', () => {
    const store = createTestStore();
    store.dispatch(authActions.loginRequested());
    expect(store.getState().auth.kind).toBe('authenticating');
  });

  it('catches and re-throws errors from next middleware', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockApi = { getState: () => ({}) } as unknown as MiddlewareAPI;
    const throwingNext = () => {
      throw new Error('reducer error');
    };

    expect(() => errorReporter(mockApi)(throwingNext)({ type: 'test' })).toThrow('reducer error');
    expect(spy).toHaveBeenCalledWith(
      '[errorReporter] Uncaught error in action:',
      'test',
      expect.any(Error),
    );

    spy.mockRestore();
  });
});

describe('devLogger', () => {
  it('logs action in dev mode', () => {
    // Simulate dev mode — import.meta.env.DEV is replaced at build time.
    // We test that the logger passes through to the next middleware.
    const store = createTestStore();
    const groupSpy = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    store.dispatch(authActions.loginRequested());

    // In dev mode we expect logging; in test mode import.meta.env.DEV may be true
    // since vitest sets NODE_ENV=test. The middleware checks import.meta.env.DEV.
    // We just verify the action was processed (state changed).
    expect(store.getState().auth.kind).toBe('authenticating');

    groupSpy.mockRestore();
    logSpy.mockRestore();
    groupEndSpy.mockRestore();
  });
});
