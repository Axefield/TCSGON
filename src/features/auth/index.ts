/**
 * Auth feature barrel — Phase 1.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §2
 */
export { authInitialState, isAuthenticated, isAuthenticating } from './authState';
export type { AuthState } from './authState';

export { authSlice, authActions, authReducer } from './slice/authSlice';
export type { AuthFailurePayload } from './slice/authSlice';

export { loadAuth, saveAuth, clearAuth } from './slice/authPersistence';

export { useAuth, injectAuthApiClient } from './hooks';
