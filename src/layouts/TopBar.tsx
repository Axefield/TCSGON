/**
 * TopBar — top navigation bar with theme toggle and ProfileMenu.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §35
 *
 * Semantics: `<header>` with theme toggle, breadcrumbs slot, and ProfileMenu
 * for authenticated users. Reads auth state from `useAuth` internally.
 *
 * Usage:
 * ```tsx
 * <TopBar />
 * ```
 */
import { type MouseEventHandler, type ReactElement, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ProfileMenu } from '@/features/auth/components/ProfileMenu';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components';
import type { Theme } from '@/store/slices/uiSlice';

import styles from './TopBar.module.css';

export interface TopBarProps {
  /** Page title shown in the top bar. Default: 'TCSgon'. */
  readonly title?: string;
  /** Theme override (default: 'light'). */
  readonly theme?: Theme;
  /** Sidebar toggle state. Default: false. */
  readonly isSidebarOpen?: boolean;
  /** Called when the sidebar menu button is clicked. */
  readonly onMenuClick?: MouseEventHandler<HTMLButtonElement>;
  /** Called when the theme toggle is clicked. */
  readonly onThemeToggle?: () => void;
}

export function TopBar({
  title = 'TCSgon',
  theme = 'light',
  isSidebarOpen = false,
  onMenuClick,
  onThemeToggle,
}: TopBarProps): ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [localTheme, setLocalTheme] = useState<Theme>(theme);

  const effectiveTheme = theme ?? localTheme;
  const handleThemeToggle = onThemeToggle ?? (() => {
    setLocalTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  });

  const effectiveMenuClick = onMenuClick ?? (() => {
    // Default: no sidebar toggle wired yet.
  });

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <Button
          variant="ghost"
          size="sm"
          onClick={effectiveMenuClick}
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          ☰
        </Button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleThemeToggle}
          aria-pressed={effectiveTheme === 'dark'}
          aria-label={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {effectiveTheme === 'dark' ? '☀️' : '🌙'}
        </Button>

        {user ? (
          <ProfileMenu
            user={user}
            onSettings={() => navigate('/settings')}
            onSignOut={() => logout.mutate()}
          />
        ) : (
          <Link to="/login" className={styles.signInLink}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
