/**
 * Store middleware — Phase 1.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §4, §21
 *
 * Three middleware:
 *   1. `localStorageSync` — persists auth state changes to localStorage via
 *      `createListenerMiddleware`. Reacts to login/rehydrate/logout/expire actions.
 *   2. `errorReporter` — catches uncaught errors in the reducer chain and logs
 *      them. Stub for future Sentry/Rollbar integration.
 *   3. `devLogger` — dev-only action logger. Never enabled in production.
 */
import { createListenerMiddleware, type Middleware } from '@reduxjs/toolkit';

import { authActions } from '@/features/auth/slice/authSlice';
import { clearAuth, saveAuth } from '@/features/auth/slice/authPersistence';

// ─── localStorageSync — persists auth state ──────────────────────────────────

export const authPersistenceMiddleware = createListenerMiddleware();

// Individual listeners (rather than `matcher` + `isAnyOf`) because RTK v2's
// type inference for matcher predicates doesn't narrow the action type
// in the `effect` callback under `strict: true`.
authPersistenceMiddleware.startListening({
  actionCreator: authActions.loginFulfilled,
  effect: (action) => {
    saveAuth(action.payload);
  },
});
authPersistenceMiddleware.startListening({
  actionCreator: authActions.rehydrate,
  effect: (action) => {
    saveAuth(action.payload);
  },
});
authPersistenceMiddleware.startListening({
  actionCreator: authActions.logout,
  effect: () => {
    clearAuth();
  },
});
authPersistenceMiddleware.startListening({
  actionCreator: authActions.sessionExpired,
  effect: () => {
    clearAuth();
  },
});

// ─── errorReporter — catches reducer errors ──────────────────────────────────

/**
 * Catches synchronous errors thrown inside reducers or previous middleware.
 * In production, this would forward to Sentry / Rollbar.
 */
export const errorReporter: Middleware = () => (next) => (action) => {
  try {
    return next(action);
  } catch (err) {
    console.error('[errorReporter] Uncaught error in action:', (action as { type?: string }).type, err);
    // Re-throw so the Redux dev tools still surface the error.
    throw err;
  }
};

// ─── devLogger — dev-only action inspector ───────────────────────────────────

/**
 * Logs every action + prev/next state in development mode.
 * Gated behind `import.meta.env.DEV` so it's tree-shaken in production builds
 * (Vite replaces `import.meta.env.DEV` with a literal boolean at compile time).
 */
export const devLogger: Middleware = (api) => (next) => (action) => {
  if (import.meta.env.DEV) {
    const group = `[store] ${(action as { type?: string }).type ?? 'unknown'}`;
    console.groupCollapsed(group);
    console.log('prev:', api.getState());
    console.log('action:', action);
    const result = next(action);
    console.log('next:', api.getState());
    console.groupEnd();
    return result;
  }
  return next(action);
};
