/**
 * Button — accessible, themeable button primitive.
 *
 * Renders `<button>` by default or `<a>` when `href` is provided (discriminant).
 * Supports variants, sizes, loading state, icons, and full-width mode.
 *
 * @example
 *   <Button variant="primary" onClick={handleSave}>Save</Button>
 *   <Button variant="danger" loading onConfirm={handleDelete}>Delete</Button>
 *   <Button href="/projects/new" icon={<PlusIcon />}>New Project</Button>
 */
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';

import styles from './Button.module.css';
import { Spinner } from './Spinner';

// ─── Base props (shared across both variants) ──────────────────────────

export interface ButtonBaseProps {
  readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  readonly icon?: ReactNode;
  readonly iconPosition?: 'left' | 'right';
  readonly children?: ReactNode;
  readonly className?: string;
}

// ─── Discriminated union: href ⇒ <a>, no href ⇒ <button> ───────────────

export type ButtonAsButton = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    readonly href?: undefined;
    readonly type?: 'button' | 'submit' | 'reset';
  };

export type ButtonAsLink = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & {
    readonly href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// ─── Component ─────────────────────────────────────────────────────────

export function Button(props: ButtonProps): ReactElement {
  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    icon,
    iconPosition = 'left',
    children,
    className,
    ...domProps
  } = props;

  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {icon && iconPosition === 'left' && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children && <span className={styles.label}>{children}</span>}
      {icon && iconPosition === 'right' && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {loading && <Spinner size="sm" decorative />}
    </>
  );

  // Link mode — href is present
  if ('href' in domProps && domProps.href) {
    const { href, target, rel, ...anchorRest } =
      domProps as AnchorHTMLAttributes<HTMLAnchorElement>;

    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : rel}
        className={classes}
        aria-disabled={loading || undefined}
        {...anchorRest}
      >
        {content}
      </a>
    );
  }

  // Button mode — default
  const { disabled, type, ...buttonRest } =
    domProps as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      type={type ?? 'button'}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...buttonRest}
    >
      {content}
    </button>
  );
}
