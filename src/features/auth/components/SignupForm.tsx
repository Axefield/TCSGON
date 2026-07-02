/**
 * SignupForm — name + email + password + confirm form with Zod validation.
 *
 * @see docs/plans/phase-3-authentication.md
 *
 * Accessibility:
 *  - `<form noValidate>` with `<label htmlFor>` on every input
 *  - Errors via `aria-describedby` + `aria-invalid="true"`
 *  - Submit `aria-busy={isSubmitting}`
 *  - Error summary `<div role="alert" tabindex="-1">` focused on failure
 *  - Autocomplete attributes for name, email, new-password
 *  - Password strength indicator for real-time feedback
 *
 * Usage:
 * ```tsx
 * <SignupForm onSubmit={handleSignup} />
 * ```
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { SignupInputSchema, type SignupInput } from '@/shared/types/user';

import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import styles from './SignupForm.module.css';

export interface SignupFormProps {
  readonly onSubmit: (input: SignupInput) => void | Promise<void>;
  readonly initialEmail?: string;
  readonly initialName?: string;
  readonly disabled?: boolean;
}

export function SignupForm({
  onSubmit,
  initialEmail = '',
  initialName = '',
  disabled = false,
}: SignupFormProps): ReactElement {
  const errorRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    watch,
    formState: { errors, isSubmitting, isValid },
    setError,
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupInputSchema),
    defaultValues: { name: initialName, email: initialEmail, password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const passwordValue = watch('password');

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Signup failed.',
      });
      errorRef.current?.focus();
    }
  });

  useEffect(() => {
    setFocus('name');
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

      <div className={styles.field}>
        <label htmlFor="signup-name" className={styles.label}>
          Name
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          aria-required="true"
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={errors.name ? 'signup-name-error' : undefined}
          {...register('name')}
          className={`${styles.input} ${errors.name ? styles.inputError : styles.inputNormal}`}
        />
        {errors.name ? (
          <p id="signup-name-error" role="alert" className={styles.errorText}>
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="signup-email" className={styles.label}>
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          aria-required="true"
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={errors.email ? 'signup-email-error' : undefined}
          {...register('email')}
          className={`${styles.input} ${errors.email ? styles.inputError : styles.inputNormal}`}
        />
        {errors.email ? (
          <p id="signup-email-error" role="alert" className={styles.errorText}>
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="signup-password" className={styles.label}>
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          aria-required="true"
          aria-invalid={errors.password ? 'true' : undefined}
          aria-describedby={errors.password ? 'signup-password-error' : undefined}
          {...register('password')}
          className={`${styles.input} ${errors.password ? styles.inputError : styles.inputNormal}`}
        />
        <PasswordStrengthIndicator password={passwordValue} />
        {errors.password ? (
          <p id="signup-password-error" role="alert" className={styles.errorText}>
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="signup-confirm" className={styles.label}>
          Confirm password
        </label>
        <input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          aria-required="true"
          aria-invalid={errors.confirmPassword ? 'true' : undefined}
          aria-describedby={errors.confirmPassword ? 'signup-confirm-error' : undefined}
          {...register('confirmPassword')}
          className={`${styles.input} ${errors.confirmPassword ? styles.inputError : styles.inputNormal}`}
        />
        {errors.confirmPassword ? (
          <p id="signup-confirm-error" role="alert" className={styles.errorText}>
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
        {isBusy ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
