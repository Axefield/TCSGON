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
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={MENU_ID}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.25rem 0.5rem',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: 'var(--radius-md, 0.5rem)',
        }}
      >
        <span
          style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            background: 'var(--color-primary, #0b3d91)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 'var(--font-weight-bold, 700)',
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span style={{ fontSize: 'var(--font-size-sm, 0.875rem)' }}>{user.name}</span>
      </button>

      {open ? (
        <ul
          id={MENU_ID}
          ref={menuRef}
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute',
            top: '100%',
            [align]: 0,
            margin: '0.25rem 0 0',
            padding: '0.25rem 0',
            listStyle: 'none',
            background: 'var(--color-bg, #ffffff)',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: 'var(--radius-md, 0.5rem)',
            boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
            minWidth: '180px',
            zIndex: 300,
          }}
        >
          <li style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--color-fg-muted, #64748b)' }}>
            {user.email}
          </li>
          <li>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 'var(--font-size-sm, 0.875rem)',
              }}
            >
              Sign out
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
