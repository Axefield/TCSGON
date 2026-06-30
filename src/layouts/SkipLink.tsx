/**
 * SkipLink — first focusable element, bypasses navigation.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §15, §34, §35
 *
 * Visually hidden via `clip-path` until `:focus-visible`. Anchors to
 * `<main id="main-content" tabindex="-1">` and triggers `.focus()`.
 *
 * Usage:
 * ```tsx
 * <SkipLink targetId="main-content" />
 * ```
 */
import type { ReactElement, MouseEvent } from 'react';

import styles from './SkipLink.module.css';

export interface SkipLinkProps {
  readonly targetId?: string;
  readonly children?: string;
}

export function SkipLink({
  targetId = 'main-content',
  children = 'Skip to content',
}: SkipLinkProps): ReactElement {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      // Remove tabindex after focus so it doesn't persist in the tab order.
      target.addEventListener(
        'blur',
        () => target.removeAttribute('tabindex'),
        { once: true },
      );
    }
  };

  return (
    <a
      href={`#${targetId}`}
      className={styles.skipLink}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
