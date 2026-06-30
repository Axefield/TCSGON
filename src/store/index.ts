/**
 * Redux store — Phase 1.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §4, §21
 *
 * Key decisions:
 *  - `loadAuth()` runs BEFORE `configureStore` so the initial state is already
 *    `authenticated` on first render — no flash to login.
 *  - Middleware: localStorageSync (auth persistence), errorReporter (Sentry stub),
 *    devLogger (dev-only console group).
 *  - DevTools enabled in non-production.
 */
import { configureStore } from '@reduxjs/toolkit';

import { authReducer } from '@/features/auth/slice/authSlice';
import { loadAuth } from '@/features/auth/slice/authPersistence';
import type { AuthState } from '@/features/auth/authState';

import { authPersistenceMiddleware, devLogger, errorReporter } from './middleware';
import { uiReducer } from './slices/uiSlice';

// Rehydrate auth BEFORE configureStore — prevents flash to login.
const preloadedSession = loadAuth();

function buildPreloadedState(): { auth: AuthState } | undefined {
  if (!preloadedSession) return undefined;
  return {
    auth: {
      kind: 'authenticated',
      user: preloadedSession.user,
      session: preloadedSession,
    },
  };
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  preloadedState: buildPreloadedState(),
  middleware: (getDefault) =>
    getDefault()
      .prepend(authPersistenceMiddleware.middleware)
      .concat(errorReporter, ...(import.meta.env.MODE !== 'production' ? [devLogger] : [])),
  devTools: import.meta.env.MODE !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
