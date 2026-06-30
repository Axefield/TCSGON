/**
 * AppShell — main application layout grid.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §8, §10, §34
 *
 * Semantic structure:
 *  <SkipLink />
 *  <div class="shell">
 *    <aside>  ← Sidebar
 *    <div class="main-area">
 *      <header> ← TopBar
 *      <main id="main-content" tabindex="-1"> ← child route content
 *    </div>
 *    <ToastRegion />
 *  </div>
 *
 * Mounted once at the authenticated root route. The `<main>` element has
 * `tabindex="-1"` for programmatic focus management (skip-link target).
 *
 * Usage:
 * ```tsx
 * <AppShell>
 *   <Outlet />
 * </AppShell>
 * ```
 */
import { type ReactElement, type ReactNode } from 'react';

import { ToastRegion } from '@/shared/components/ToastRegion';

import { SkipLink } from './SkipLink';
import styles from './AppShell.module.css';

export interface AppShellProps {
  readonly children: ReactNode;
  readonly sidebar?: ReactNode;
  readonly topBar?: ReactNode;
  readonly skipToContentId?: string;
}

export function AppShell({
  children,
  sidebar,
  topBar,
  skipToContentId = 'main-content',
}: AppShellProps): ReactElement {
  return (
    <>
      <SkipLink targetId={skipToContentId} />
      <div className={styles.shell}>
        {sidebar ? <aside className={styles.sidebar}>{sidebar}</aside> : null}
        <div className={styles.mainArea}>
          {topBar ? <div className={styles.topBar}>{topBar}</div> : null}
          <main id={skipToContentId} tabIndex={-1} className={styles.content}>
            {children}
          </main>
        </div>
      </div>
      <ToastRegion />
    </>
  );
}
