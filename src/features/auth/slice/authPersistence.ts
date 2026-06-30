/**
 * Auth persistence — synchronous load/save to localStorage.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §7 (Risk 1: hydration race)
 *
 * The store calls `loadAuth()` BEFORE `configureStore` so the initial state
 * is already `authenticated` on first render — no flash to login.
 */
import { SessionSchema, type Session } from '@/shared/types/user';

const STORAGE_KEY = 'tcs.auth';

export function loadAuth(): Session | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const json: unknown = JSON.parse(raw);
    const parsed = SessionSchema.safeParse(json);
    if (!parsed.success) {
      // Corrupt or stale data — clear so we don't loop.
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Expiry check.
    if (new Date(parsed.data.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveAuth(session: Session): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage quota or disabled — fail silent.
  }
}

export function clearAuth(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
