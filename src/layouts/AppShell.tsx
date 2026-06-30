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
 *      <main id="main-content" tabindex="-1"> ← child route content via Outlet
 *    </div>
 *    <ToastRegion />
 *  </div>
 *
 * Mounted once at the root layout route. The `<main>` element has
 * `tabindex="-1"` for programmatic focus management (skip-link target).
 * Uses `<Outlet />` for React Router nested route content.
 *
 * Usage:
 * ```tsx
 * // As a React Router layout route element:
 * <Route element={<AppShell />}>
 *   <Route index element={<Home />} />
 * </Route>
 * ```
 */
import { type ReactElement } from 'react';
import { Outlet } from 'react-router-dom';

import { ToastRegion } from '@/shared/components/ToastRegion';

import { SkipLink } from './SkipLink';
import styles from './AppShell.module.css';

export function AppShell(): ReactElement {
  return (
    <>
      <SkipLink targetId="main-content" />
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          {/* Sidebar content wired via feature composition in Phase 2 */}
        </aside>
        <div className={styles.mainArea}>
          <div className={styles.topBar}>
            {/* TopBar content wired via feature composition in Phase 2 */}
          </div>
          <main id="main-content" tabIndex={-1} className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
      <ToastRegion />
    </>
  );
}
