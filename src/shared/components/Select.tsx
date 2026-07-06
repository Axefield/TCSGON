/**
 * Select — accessible, themeable form select primitive.
 *
 * Renders a styled `<select>` with optional label, error message, and hint text.
 * Supports forwardRef for integration with react-hook-form.
 * Uses `aria-invalid`, `aria-describedby`, and `role="alert"` for accessibility.
 *
 * @example
 *   <Select label="Role">
 *     <option value="admin">Admin</option>
 *     <option value="user">User</option>
 *   </Select>
 *   <Select label="Role" error="This field is required" />
 *   <Select label="Role" hint="Choose your access level" />
 */
import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react';

import styles from './Select.module.css';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly fullWidth?: boolean;
  readonly error?: string | undefined;
  readonly label?: string;
  readonly hint?: string | undefined;
  readonly children?: ReactNode;
  readonly className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    size = 'md',
    fullWidth = false,
    error,
    label,
    hint,
    className,
    id: idProp,
    children,
    ...domProps
  }: SelectProps,
  ref,
) {
  const generatedId = useId();
  const selectId = idProp ?? generatedId;

  const selectClasses = [
    styles.select!,
    styles[size]!,
    error ? styles.selectError! : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperClasses = [
    styles.wrapper!,
    fullWidth ? styles.fullWidth! : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={selectId} className={styles.label!}>
          {label}
        </label>
      )}
      <div className={styles.selectWrapper!}>
        <select
          id={selectId}
          ref={ref}
          className={selectClasses}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
          }
          {...domProps}
        >
          {children}
        </select>
        <span className={styles.arrow!} aria-hidden="true">▼</span>
      </div>
      {error && (
        <p id={`${selectId}-error`} className={styles.error!} role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${selectId}-hint`} className={styles.hint!}>
          {hint}
        </p>
      )}
    </div>
  );
});
