/**
 * Checkbox — accessible, themeable checkbox primitive.
 *
 * Renders a styled `<input type="checkbox">` with optional label and error message.
 * Supports forwardRef for react-hook-form integration.
 * Supports indeterminate state (visual only, set via DOM property).
 *
 * @example
 *   <Checkbox label="Accept terms" />
 *   <Checkbox label="Subscribe" error="This field is required" />
 *   <Checkbox label="Select all" indeterminate />
 */
import { forwardRef, useEffect, useId, type InputHTMLAttributes } from 'react';

import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly label?: string;
  readonly indeterminate?: boolean;
  readonly error?: string | undefined;
  readonly className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    size = 'md',
    label,
    indeterminate = false,
    error,
    className,
    id: idProp,
    ...domProps
  }: CheckboxProps,
  ref,
) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;

  // indeterminate is a DOM property, not an HTML attribute — set via ref
  useEffect(() => {
    if (ref && typeof ref === 'object' && 'current' in ref && ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate, ref]);

  const classes = [
    styles.wrapper!,
    styles[size]!,
    error ? styles.hasError! : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <input
        type="checkbox"
        id={inputId}
        ref={ref}
        className={styles.input!}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...domProps}
      />
      <label htmlFor={inputId} className={styles.label}>
        <span className={styles.control}>
          <svg className={`${styles.icon!} ${styles.iconCheck!}`} viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg className={`${styles.icon!} ${styles.iconMinus!}`} viewBox="0 0 24 24" aria-hidden="true">
            <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
        {label && <span className={styles.labelText!}>{label}</span>}
      </label>
      {error && (
        <p id={`${inputId}-error`} className={styles.errorText!} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
