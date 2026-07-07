/**
 * AppShell — main application layout grid.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §8, §10, §34
 *
 * Semantic structure:
 *  <SkipLink />
 *  <SessionCheck />
 *  <div class="shell">
 *    <Sidebar state={sidebar} onToggle={toggleSidebar}>
 *      <SidebarNavItem to="/dashboard" icon={<DashboardIcon />}>Dashboard</SidebarNavItem>
 *      ...
 *    </Sidebar>
 *    <div class="main-area">
 *      <TopBar isSidebarOpen={...} onMenuClick={toggleSidebar}>
 *        <ProfileMenu />  ← inside TopBar
 *      </TopBar>
 *      <main id="main-content" tabindex="-1"> ← child route content via Outlet
 *    </div>
 *    <ToastRegion />
 *  </div>
 *
 * Mounted once at the root layout route. The `<main>` element has
 * `tabindex="-1"` for programmatic focus management (skip-link target).
 * Uses `<Outlet />` for React Router nested route content.
 *
 * Sidebar state is managed by Redux (uiSlice) with three values:
 *  - 'closed' — hidden (collapsed to 64px on desktop, off-canvas on mobile)
 *  - 'open' — visible, triggered by hamburger click or toggle button
 *  - 'pinned' — permanently visible (desktop only)
 *
 * Usage:
 * ```tsx
 * // As a React Router layout route element:
 * <Route element={<AppShell />}>
 *   <Route index element={<Home />} />
 * </Route>
 * ```
 */
import { type ReactElement, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { SessionCheck } from '@/features/auth/components/SessionCheck';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ToastRegion } from '@/shared/components/ToastRegion';
import { useTheme } from '@/shared/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSidebar, toggleSidebar } from '@/store/slices/uiSlice';

import styles from './AppShell.module.css';
import { Sidebar } from './Sidebar';
import { SidebarNavItem } from './SidebarNavItem';
import { SkipLink } from './SkipLink';
import { TopBar } from './TopBar';

/** Simple SVG icon: 4-grid squares for Dashboard. */
function DashboardIcon(): ReactElement {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
      <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zm-8 8h6v6H3v-6zm8 0h6v6h-6v-6z" />
    </svg>
  );
}

/** Simple SVG icon: folder for Projects. */
function ProjectsIcon(): ReactElement {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
      <path d="M2 4.5A2.5 2.5 0 014.5 2h3.879a1.5 1.5 0 011.06.44l2.122 2.12A1.5 1.5 0 0012.12 5H15.5A2.5 2.5 0 0118 7.5v8a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5V4.5z" />
    </svg>
  );
}

/** Simple SVG icon: gear for Settings. */
function SettingsIcon(): ReactElement {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
      <path d="M10 2a1 1 0 01.993.883l.007.117v.697a1 1 0 01-.851.986l-.149.014a1 1 0 01-.86-.858l-.007-.142V3a1 1 0 011-1zm0 14a1 1 0 01.993.883l.007.117v.697a1 1 0 01-.851.986l-.149.014a1 1 0 01-.86-.858l-.007-.142V17a1 1 0 011-1zm-8-6a1 1 0 01.883.993L3 11h.697a1 1 0 01.986-.851l.014-.149a1 1 0 00-.858-.86L3.5 9H3a1 1 0 01-1 1zm14 0a1 1 0 01.883.993L17 11h.697a1 1 0 01.986-.851l.014-.149a1 1 0 00-.858-.86L17.5 9H17a1 1 0 01-1 1zm-4.2 3.617a6.976 6.976 0 01-5.6 0 .5.5 0 01.2-.943 5.975 5.975 0 005.2 0 .5.5 0 01.2.943z" />
    </svg>
  );
}

/** Map of known paths to their page title. */
const PAGE_TITLES: Record<string, string> = {
  '/': 'TCSgon',
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/projects/new': 'New Project',
  '/settings': 'Settings',
  '/login': 'Sign in',
  '/signup': 'Create account',
  '/forgot-password': 'Forgot password',
  '/reset-password': 'Reset password',
};

export function AppShell(): ReactElement {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { theme, toggle: toggleTheme } = useTheme();
  const sidebar = useAppSelector(selectSidebar);
  const dispatch = useAppDispatch();
  const isSidebarOpen = sidebar === 'open' || sidebar === 'pinned';
  const pageTitle = useMemo<string>(() => {
    // Exact match first, then prefix match for /projects/*
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    if (pathname.startsWith('/projects')) return 'Projects';
    return 'TCSgon';
  }, [pathname]);

  return (
    <>
      <SkipLink targetId="main-content" />
      <SessionCheck />
      <div className={styles.shell}>
        {user ? (
          <Sidebar state={sidebar} onToggle={() => dispatch(toggleSidebar())}>
            <SidebarNavItem to="/dashboard" icon={<DashboardIcon />}>
              Dashboard
            </SidebarNavItem>
            <SidebarNavItem to="/projects" icon={<ProjectsIcon />}>
              Projects
            </SidebarNavItem>
            <SidebarNavItem to="/settings" icon={<SettingsIcon />}>
              Settings
            </SidebarNavItem>
          </Sidebar>
        ) : null}
        <div className={styles.mainArea}>
          <TopBar
            title={pageTitle}
            theme={theme}
            isSidebarOpen={isSidebarOpen}
            onMenuClick={() => dispatch(toggleSidebar())}
            onThemeToggle={toggleTheme}
          />
          <main id="main-content" tabIndex={-1} className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
      <ToastRegion />
    </>
  );
}
