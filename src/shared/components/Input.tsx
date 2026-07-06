/**
 * Input — accessible, themeable form input primitive.
 *
 * Renders a styled `<input>` with optional label, error message, and hint text.
 * Supports forwardRef for integration with react-hook-form.
 * Uses `aria-invalid`, `aria-describedby`, and `role="alert"` for accessibility.
 *
 * @example
 *   <Input label="Email" type="email" placeholder="you@example.com" />
 *   <Input label="Password" error="This field is required" />
 *   <Input label="Full name" hint="Enter your legal name" />
 */
import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import styles from './Input.module.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly fullWidth?: boolean;
  readonly error?: string | undefined;
  readonly label?: string;
  readonly hint?: string | undefined;
  readonly className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    fullWidth = false,
    error,
    label,
    hint,
    className,
    id: idProp,
    ...domProps
  }: InputProps,
  ref,
) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;

  const inputClasses = [
    styles.input!,
    styles[size]!,
    error ? styles.inputError! : '',
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
        <label htmlFor={inputId} className={styles.label!}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={inputClasses}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...domProps}
      />
      {error && (
        <p id={`${inputId}-error`} className={styles.error!} role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className={styles.hint!}>
          {hint}
        </p>
      )}
    </div>
  );
});
