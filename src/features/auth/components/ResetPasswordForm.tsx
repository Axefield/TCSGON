/**
 * ResetPasswordForm — token + new password + confirm form with Zod validation.
 *
 * @see docs/plans/phase-3-authentication.md
 *
 * Accessibility:
 *  - `<form noValidate>` with `<label htmlFor>` on every input
 *  - Errors via `aria-describedby` + `aria-invalid="true"`
 *  - Submit `aria-busy={isSubmitting}`
 *  - Error summary `<div role="alert" tabindex="-1">` focused on failure
 *  - Autocomplete attributes for new-password
 *  - Password strength indicator for real-time feedback
 *
 * Usage:
 * ```tsx
 * <ResetPasswordForm onSubmit={handleReset} />
 * ```
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { ResetPasswordInputSchema, type ResetPasswordInput } from '@/shared/types/user';

import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import styles from './ResetPasswordForm.module.css';

export interface ResetPasswordFormProps {
  readonly onSubmit: (input: ResetPasswordInput) => void | Promise<void>;
  readonly disabled?: boolean;
  /** Optional token from URL query param — set as a hidden field value. */
  readonly initialToken?: string;
}

export function ResetPasswordForm({
  onSubmit,
  disabled = false,
  initialToken = '',
}: ResetPasswordFormProps): ReactElement {
  const errorRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
    setError,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordInputSchema),
    defaultValues: { token: initialToken, password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  // Sync URL token into form if provided after mount (e.g. from query params).
  useEffect(() => {
    if (initialToken) {
      setValue('token', initialToken, { shouldValidate: true });
    }
  }, [initialToken, setValue]);

  const passwordValue = watch('password');

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Password reset failed.',
      });
      errorRef.current?.focus();
    }
  });

  useEffect(() => {
    setFocus('password');
  }, [setFocus]);

  const hasRootError = Boolean(errors.root);
  const isBusy = isSubmitting || disabled;

  return (
    <form className={styles.form} noValidate onSubmit={handleFormSubmit}>
      {errors.root ? (
        <div ref={errorRef} role="alert" tabIndex={-1} className={styles.errorSummary}>
          {errors.root.message}
        </div>
      ) : null}

      {/* Hidden input for token — value is set via setValue or defaultValues */}
      <input
        type="hidden"
        {...register('token')}
      />

      <div className={styles.field}>
        <label htmlFor="reset-password" className={styles.label}>
          New password
        </label>
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          aria-required="true"
          aria-invalid={errors.password ? 'true' : undefined}
          aria-describedby={errors.password ? 'reset-password-error' : undefined}
          {...register('password')}
          className={`${styles.input} ${errors.password ? styles.inputError : styles.inputNormal}`}
        />
        <PasswordStrengthIndicator password={passwordValue} />
        {errors.password ? (
          <p id="reset-password-error" role="alert" className={styles.errorText}>
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="reset-confirm" className={styles.label}>
          Confirm new password
        </label>
        <input
          id="reset-confirm"
          type="password"
          autoComplete="new-password"
          aria-required="true"
          aria-invalid={errors.confirmPassword ? 'true' : undefined}
          aria-describedby={errors.confirmPassword ? 'reset-confirm-error' : undefined}
          {...register('confirmPassword')}
          className={`${styles.input} ${errors.confirmPassword ? styles.inputError : styles.inputNormal}`}
        />
        {errors.confirmPassword ? (
          <p id="reset-confirm-error" role="alert" className={styles.errorText}>
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isBusy || (!isValid && !hasRootError)}
        aria-busy={isBusy}
        className={styles.submitButton}
      >
        {isBusy ? 'Resetting password…' : 'Reset password'}
      </button>
    </form>
  );
}
