/**
 * Sidebar — collapsible navigation.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §35
 *
 * Semantics: `<aside>` wrapping `<nav>` with `<ul>/<li>/<a>`.
 * Collapse button has `aria-expanded`. Active item gets `aria-current="page"`.
 * Uses state union `'closed' | 'open' | 'pinned'` — not boolean.
 *
 * Usage:
 * ```tsx
 * <Sidebar state={sidebar} onToggle={toggleSidebar}>
 *   <SidebarNavItem to="/dashboard" icon={<HomeIcon />}>Dashboard</SidebarNavItem>
 * </Sidebar>
 * ```
 */
import { type ReactElement, type ReactNode } from 'react';

import { Button } from '@/shared/components';

import styles from './Sidebar.module.css';

export interface SidebarProps {
  readonly state: 'closed' | 'open' | 'pinned';
  readonly onToggle: () => void;
  readonly children: ReactNode;
}

export function Sidebar({ state, onToggle, children }: SidebarProps): ReactElement {
  const isExpanded = state === 'open' || state === 'pinned';

  return (
    <aside
      className={`${styles.sidebar} ${isExpanded ? styles.expanded : styles.collapsed}`}
      aria-label="Primary navigation"
    >
      <div className={styles.header}>
        <span className={styles.brand}>TCSgon</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? '◀' : '▶'}
        </Button>
      </div>
      <nav aria-label="Main">{children}</nav>
    </aside>
  );
}
