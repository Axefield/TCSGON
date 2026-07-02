/**
 * authSlice — Phase 1 + Phase 3 (setSession action).
 *
 * @see docs/plans/phase-1-core-infrastructure.md §21
 * @see docs/plans/phase-3-authentication.md
 */
import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { authInitialState, type AuthState } from '@/features/auth/authState';
import type { Session, User } from '@/shared/types/user';

export interface AuthFailurePayload {
  readonly message: string;
  readonly user: User | null;
}

/**
 * `setSession` — dispatched by React Query `useSession()` on successful
 * background refetch. Semantically identical to `rehydrate` but signals
 * a server-initiated update rather than a localStorage hydration.
 *
 * @see docs/plans/phase-3-authentication.md
 */
export const setSession = createAction<Session>('auth/setSession');

export const authSlice = createSlice({
  name: 'auth',
  initialState: authInitialState,
  reducers: {
    loginRequested(state) {
      state.kind = 'authenticating';
    },
    loginFulfilled(state, action: PayloadAction<Session>) {
      // Discriminated union: assignment to `kind` and the new fields is
      // what Immer needs. The TS cast is necessary because the union
      // narrows away when we cross from one variant to another.
      const next: AuthState = {
        kind: 'authenticated',
        user: action.payload.user,
        session: action.payload,
      };
      Object.assign(state, next);
    },
    logout(state) {
      const next: AuthState = { kind: 'anonymous' };
      Object.assign(state, next);
    },
    authFailed(state, action: PayloadAction<AuthFailurePayload>) {
      const next: AuthState = {
        kind: 'error',
        error: action.payload.message,
        user: action.payload.user,
      };
      Object.assign(state, next);
    },
    rehydrate(state, action: PayloadAction<Session>) {
      const next: AuthState = {
        kind: 'authenticated',
        user: action.payload.user,
        session: action.payload,
      };
      Object.assign(state, next);
    },
    sessionExpired(state) {
      const next: AuthState = { kind: 'anonymous' };
      Object.assign(state, next);
    },
    /** Update the profile (name/email) without changing session/token. */
    updateProfile(state, action: PayloadAction<{ user: User }>) {
      if (state.kind === 'authenticated') {
        // Direct mutation inside the narrowed authenticated branch is safe
        // under Immer — the union is narrowed by the `kind` check.
        state.user = action.payload.user;
        state.session.user = action.payload.user;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setSession, (state, action) => {
      const next: AuthState = {
        kind: 'authenticated',
        user: action.payload.user,
        session: action.payload,
      };
      Object.assign(state, next);
    });
  },
});

export const authActions = authSlice.actions;
export const authReducer = authSlice.reducer;

// Selectors — pair with `useAppSelector`.
export const selectAuthState = (s: { auth: AuthState }): AuthState => s.auth;
export const selectIsAuthenticated = (s: { auth: AuthState }): boolean => s.auth.kind === 'authenticated';
export const selectCurrentUser = (s: { auth: AuthState }): User | null =>
  s.auth.kind === 'authenticated'
    ? s.auth.user
    : s.auth.kind === 'error'
      ? s.auth.user
      : null;
export const selectAuthError = (s: { auth: AuthState }): string | null =>
  s.auth.kind === 'error' ? s.auth.error : null;
