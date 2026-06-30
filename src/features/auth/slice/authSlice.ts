/**
 * authSlice — Phase 1.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §21
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { authInitialState, type AuthState } from '@/features/auth/authState';
import type { Session, User } from '@/shared/types/user';

export interface AuthFailurePayload {
  readonly message: string;
  readonly user: User | null;
}

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
