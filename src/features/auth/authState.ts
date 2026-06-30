/**
 * Auth state — discriminated union. AGENTS.md §3: only truly global state
 * crosses 3+ feature trees qualifies for Redux. Auth does (router guard,
 * top bar avatar, every authed page), so it lives in the store.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §4, §21
 */
import type { Session, User } from '@/shared/types/user';

export type AuthState =
  | { readonly kind: 'anonymous' }
  | { readonly kind: 'authenticating' }
  | {
      readonly kind: 'authenticated';
      readonly user: User;
      readonly session: Session;
    }
  | {
      readonly kind: 'error';
      readonly error: string;
      readonly user: User | null;
    };

export const authInitialState: AuthState = { kind: 'anonymous' };

export function isAuthenticated(s: AuthState): s is Extract<AuthState, { kind: 'authenticated' }> {
  return s.kind === 'authenticated';
}

export function isAuthenticating(s: AuthState): boolean {
  return s.kind === 'authenticating';
}
