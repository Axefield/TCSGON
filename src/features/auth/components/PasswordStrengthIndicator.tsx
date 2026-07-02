/**
 * PasswordStrengthIndicator — visual indicator for password strength.
 *
 * Renders a segmented bar with colour-coded segments based on password
 * complexity criteria. Updates reactively as the user types.
 *
 * Accessibility:
 *  - `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
 *  - `aria-label` describes the metric
 *
 * Usage:
 * ```tsx
 * <PasswordStrengthIndicator password="somePassword123" />
 * ```
 */
import { type ReactElement, useMemo } from 'react';

import styles from './PasswordStrengthIndicator.module.css';

export interface PasswordStrengthIndicatorProps {
  readonly password: string;
}

export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'strong';

function assessStrength(password: string): PasswordStrength {
  if (!password) return 'empty';

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'fair';
  return 'strong';
}

function strengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'empty': return 'No password';
    case 'weak': return 'Weak';
    case 'fair': return 'Fair';
    case 'strong': return 'Strong';
  }
}

function strengthAria(strength: PasswordStrength): number {
  switch (strength) {
    case 'empty': return 0;
    case 'weak': return 1;
    case 'fair': return 2;
    case 'strong': return 3;
  }
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps): ReactElement | null {
  const strength = useMemo(() => assessStrength(password), [password]);

  if (strength === 'empty') return null;

  const numericValue = strengthAria(strength);

  return (
    <div
      className={styles.wrapper}
      role="meter"
      aria-valuenow={numericValue}
      aria-valuemin={0}
      aria-valuemax={3}
      aria-label={`Password strength: ${strengthLabel(strength)}`}
    >
      <div className={styles.track}>
        <div
          className={`${styles.segment} ${styles[strength]}`}
          style={{ width: `${(numericValue / 3) * 100}%` }}
        />
      </div>
      <span className={`${styles.label} ${styles[`label${strength.charAt(0).toUpperCase() + strength.slice(1)}` as keyof typeof styles] ?? ''}`}>
        {strengthLabel(strength)}
      </span>
    </div>
  );
}
