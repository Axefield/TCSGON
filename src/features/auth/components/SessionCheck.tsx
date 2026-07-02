/**
 * SessionCheck — fires the session validation query on mount.
 *
 * Mounted once inside `<AppShell>`. Background-refetches the session from the
 * server and syncs to Redux. Route guards (`RequireAuth`, `RedirectIfAuth`)
 * read Redux synchronously, so they never await this query directly.
 *
 * Renders nothing — purely a side-effect component.
 *
 * @see docs/plans/phase-3-authentication.md
 */
import { type ReactElement } from 'react';

import { useSession } from '@/features/auth/api/authApi';

export function SessionCheck(): ReactElement | null {
  // Fire the session validation query on mount. The query's useEffect
  // dispatches `rehydrate` or `sessionExpired` to Redux, keeping the
  // synchronous auth cache consistent with the server.
  useSession();

  return null;
}
