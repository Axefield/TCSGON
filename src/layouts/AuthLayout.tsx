/**
 * AuthLayout — centered card layout for unauthenticated pages.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34
 *
 * Renders a centered single-column card with heading and (optional)
 * subheading. Used by `/login`, `/signup`, `/forgot-password`.
 *
 * Usage:
 * ```tsx
 * <AuthLayout heading="Sign in" subheading="Welcome back">
 *   <LoginForm onSubmit={handleLogin} />
 * </AuthLayout>
 * ```
 */
import { type ReactElement, type ReactNode } from 'react';

import styles from './AuthLayout.module.css';

export interface AuthLayoutProps {
  readonly children: ReactNode;
  readonly heading: string;
  readonly subheading?: string;
}

export function AuthLayout({ children, heading, subheading }: AuthLayoutProps): ReactElement {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.heading}>{heading}</h1>
        {subheading ? <p className={styles.subheading}>{subheading}</p> : null}
        {children}
      </div>
    </div>
  );
}
