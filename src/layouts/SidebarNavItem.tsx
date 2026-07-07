/**
 * SidebarNavItem — a styled navigation link for the sidebar.
 *
 * Renders a React Router `<Link>` with an icon and label.
 * Uses `aria-current="page"` when the current path matches.
 *
 * @example
 *   <SidebarNavItem to="/dashboard" icon={<DashboardIcon />}>Dashboard</SidebarNavItem>
 */
import { type ReactElement, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import styles from './SidebarNavItem.module.css';

export interface SidebarNavItemProps {
  readonly to: string;
  readonly icon: ReactNode;
  readonly children: ReactNode;
}

export function SidebarNavItem({
  to,
  icon,
  children,
}: SidebarNavItemProps): ReactElement {
  const { pathname } = useLocation();
  const isActive = pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      className={`${styles.navItem} ${isActive ? styles.active : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.label}>{children}</span>
    </Link>
  );
}
