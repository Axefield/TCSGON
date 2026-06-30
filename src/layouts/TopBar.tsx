/**
 * TopBar — top navigation bar with theme toggle and user menu slot.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §35
 *
 * Semantics: `<header>` with theme toggle (`aria-pressed`), profile menu
 * trigger (`aria-haspopup`), and breadcrumbs slot.
 *
 * Usage:
 * ```tsx
 * <TopBar
 *   title="Dashboard"
 *   onMenuClick={handleMenuClick}
 *   theme="light"
 *   onThemeToggle={handleThemeToggle}
 *   user={currentUser}
 * />
 * ```
 */
import { type MouseEventHandler, type ReactElement } from 'react';

import type { User } from '@/shared/types/user';
import type { Theme } from '@/store/slices/uiSlice';

import styles from './TopBar.module.css';

export interface TopBarProps {
  readonly title: string;
  readonly onMenuClick: MouseEventHandler<HTMLButtonElement>;
  readonly theme: Theme;
  readonly onThemeToggle: () => void;
  readonly user: User | null;
  readonly isSidebarOpen?: boolean;
}

export function TopBar({
  title,
  onMenuClick,
  theme,
  onThemeToggle,
  user,
  isSidebarOpen = false,
}: TopBarProps): ReactElement {
  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={onMenuClick}
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          ☰
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={onThemeToggle}
          aria-pressed={theme === 'dark'}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user ? (
          <span className={styles.userName}>{user.name}</span>
        ) : (
          <span className={styles.userName}>Sign in</span>
        )}
      </div>
    </header>
  );
}
