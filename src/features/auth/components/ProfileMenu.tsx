/**
 * ProfileMenu — avatar dropdown for authenticated user.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §35
 *
 * Accessibility:
 *  - Trigger: `<button aria-haspopup="true" aria-expanded={open}>`
 *  - **Decision:** omit `role="menu"` — use a plain `<ul>` of buttons.
 *    Fewer traps, same a11y. Documented in JSDoc per a11y plan.
 *  - ArrowUp/ArrowDown navigate items; Home/End jump to first/last.
 *  - Escape closes; focus returns to trigger.
 *
 * Usage:
 * ```tsx
 * <ProfileMenu
 *   user={user}
 *   onSettings={() => navigate('/settings')}
 *   onSignOut={handleSignOut}
 * />
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
import { useNavigate } from 'react-router-dom';

import { Avatar } from '@/shared/components';
import type { User } from '@/shared/types/user';

import styles from './ProfileMenu.module.css';

export interface ProfileMenuProps {
  readonly user: User;
  readonly onSettings?: MouseEventHandler<HTMLButtonElement>;
  readonly onSignOut: MouseEventHandler<HTMLButtonElement>;
  readonly align?: 'start' | 'end';
}

const MENU_ID = 'profile-menu';

/** Index of focusable menu items (email is non-interactive). */
const SETTINGS_INDEX = 0;
const SIGNOUT_INDEX = 1;
const FOCUSABLE_COUNT = 2;

export function ProfileMenu({
  user,
  onSettings,
  onSignOut,
  align = 'end',
}: ProfileMenuProps): ReactElement {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(SETTINGS_INDEX);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Initialise refs array.
  itemRefs.current = [];

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        // Opening — reset focus to first item after render.
        setFocusIndex(SETTINGS_INDEX);
      }
      return !prev;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (!open) return;

      let nextIndex: number | null = null;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          nextIndex = (focusIndex + 1) % FOCUSABLE_COUNT;
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          nextIndex = (focusIndex - 1 + FOCUSABLE_COUNT) % FOCUSABLE_COUNT;
          break;
        }
        case 'Home': {
          e.preventDefault();
          nextIndex = SETTINGS_INDEX;
          break;
        }
        case 'End': {
          e.preventDefault();
          nextIndex = SIGNOUT_INDEX;
          break;
        }
        default:
          break;
      }

      if (nextIndex !== null) {
        setFocusIndex(nextIndex);
        itemRefs.current[nextIndex]?.focus();
      }
    },
    [open, focusIndex],
  );

  // Focus the selected item when menu opens.
  useEffect(() => {
    const raf = open
      ? requestAnimationFrame(() => { itemRefs.current[focusIndex]?.focus(); })
      : null;
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [open, focusIndex]);

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

  const handleSettingsClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (onSettings) {
        onSettings(e);
      } else {
        navigate('/settings');
      }
      setOpen(false);
    },
    [onSettings, navigate],
  );

  const handleSignOutClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      onSignOut(e);
      setOpen(false);
    },
    [onSignOut],
  );

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
        <Avatar src={user.avatarUrl ?? undefined} alt={user.name} name={user.name} size="sm" />
        <span className={styles.name}>{user.name}</span>
      </button>

      {open ? (
        <ul
          id={MENU_ID}
          ref={menuRef}
          role="menu"
          onKeyDown={handleKeyDown}
          className={`${styles.menu} ${align === 'start' ? styles.menuStart : styles.menuEnd}`}
        >
          <li className={styles.emailItem}>
            {user.email}
          </li>
          <li>
            <hr className={styles.separator} />
          </li>
          <li>
            <button
              ref={(el) => { itemRefs.current[SETTINGS_INDEX] = el; }}
              type="button"
              onClick={handleSettingsClick}
              className={styles.menuItem}
              role="menuitem"
            >
              Settings
            </button>
          </li>
          <li>
            <button
              ref={(el) => { itemRefs.current[SIGNOUT_INDEX] = el; }}
              type="button"
              onClick={handleSignOutClick}
              className={styles.menuItem}
              role="menuitem"
            >
              Sign out
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
