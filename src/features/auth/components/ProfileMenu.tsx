/**
 * ProfileMenu — avatar dropdown for authenticated user.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §35
 *
 * Accessibility:
 *  - Trigger: `<button aria-haspopup="true" aria-expanded={open}>`
 *  - **Decision:** omit `role="menu"` — use a plain `<ul>` of buttons.
 *    Fewer traps, same a11y. Documented in JSDoc per a11y plan.
 *  - Escape closes; focus returns to trigger.
 *
 * Usage:
 * ```tsx
 * <ProfileMenu user={user} onSignOut={handleSignOut} />
 * ```
 */
import {
  type MouseEventHandler,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { User } from '@/shared/types/user';

import styles from './ProfileMenu.module.css';

export interface ProfileMenuProps {
  readonly user: User;
  readonly onSignOut: MouseEventHandler<HTMLButtonElement>;
  readonly align?: 'start' | 'end';
}

const MENU_ID = 'profile-menu';

export function ProfileMenu({
  user,
  onSignOut,
  align = 'end',
}: ProfileMenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    },
    [],
  );

  // Close on outside click.
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={MENU_ID}
        className={styles.trigger}
      >
        <span className={styles.avatar}>
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className={styles.name}>{user.name}</span>
      </button>

      {open ? (
        <ul
          id={MENU_ID}
          ref={menuRef}
          onKeyDown={handleKeyDown}
          className={`${styles.menu} ${align === 'start' ? styles.menuStart : styles.menuEnd}`}
        >
          <li className={styles.emailItem}>
            {user.email}
          </li>
          <li>
            <button
              type="button"
              onClick={onSignOut}
              className={styles.menuItem}
            >
              Sign out
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
