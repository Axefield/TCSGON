/**
 * ForgotPasswordForm — email-only form to request a password reset.
 *
 * @see docs/plans/phase-3-authentication.md
 *
 * Accessibility:
 *  - `<form noValidate>` with `<label htmlFor>` for email
 *  - Error via `aria-describedby` + `aria-invalid="true"`
 *  - Submit `aria-busy={isSubmitting}`
 *  - Success message via `role="status"` with `aria-live="polite"`
 *  - Autocomplete attributes
 *
 * Usage:
 * ```tsx
 * <ForgotPasswordForm onSubmit={handleForgotPassword} />
 * ```
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { ForgotPasswordInputSchema, type ForgotPasswordInput } from '@/shared/types/user';

import styles from './ForgotPasswordForm.module.css';

export interface ForgotPasswordFormProps {
  readonly onSubmit: (input: ForgotPasswordInput) => void | Promise<void>;
  readonly disabled?: boolean;
  readonly isSuccess?: boolean;
}

export function ForgotPasswordForm({
  onSubmit,
  disabled = false,
  isSuccess = false,
}: ForgotPasswordFormProps): ReactElement {
  const errorRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordInputSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Request failed.',
      });
      errorRef.current?.focus();
    }
  });

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const isBusy = isSubmitting || disabled;

  // ── Success state ──────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className={styles.successWrapper} role="status" aria-live="polite">
        <p className={styles.successTitle}>Check your email</p>
        <p className={styles.successMessage}>
          If an account exists with this email, we've sent a password reset link.
        </p>
        <Link to="/login" className={styles.backLink}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleFormSubmit}>
      {errors.root ? (
        <div ref={errorRef} role="alert" tabIndex={-1} className={styles.errorSummary}>
          {errors.root.message}
        </div>
      ) : null}

      <div className={styles.field}>
        <label htmlFor="forgot-email" className={styles.label}>
          Email address
        </label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          aria-required="true"
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={errors.email ? 'forgot-email-error' : undefined}
          {...register('email')}
          className={`${styles.input} ${errors.email ? styles.inputError : styles.inputNormal}`}
        />
        {errors.email ? (
          <p id="forgot-email-error" role="alert" className={styles.errorText}>
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isBusy}
        aria-busy={isBusy}
        className={styles.submitButton}
      >
        {isBusy ? 'Sending…' : 'Send reset link'}
      </button>

      <p className={styles.backLinkWrapper}>
        <Link to="/login" className={styles.backLink}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
