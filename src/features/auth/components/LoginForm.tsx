/**
 * LoginForm — email + password form with Zod validation.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34, §40
 *
 * Accessibility:
 *  - `<form noValidate>` with `<label htmlFor>` on every input
 *  - Errors via `aria-describedby` + `aria-invalid="true"`
 *  - Submit `aria-busy={isSubmitting}`
 *  - Error summary `<div role="alert" tabindex="-1">` focused on failure
 *  - Autocomplete attributes for email and current-password
 *
 * Usage:
 * ```tsx
 * <LoginForm onSubmit={handleLogin} />
 * ```
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { LoginInputSchema, type LoginInput } from '@/shared/types/user';

import styles from './LoginForm.module.css';

export interface LoginFormProps {
  readonly onSubmit: (input: LoginInput) => void | Promise<void>;
  readonly initialEmail?: string;
  readonly autoFocus?: boolean;
  readonly disabled?: boolean;
}

export function LoginForm({
  onSubmit,
  initialEmail = '',
  autoFocus = true,
  disabled = false,
}: LoginFormProps): ReactElement {
  const errorRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting, isValid },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: { email: initialEmail, password: '' },
    mode: 'onTouched',
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Login failed.',
      });
      errorRef.current?.focus();
    }
  });

  useEffect(() => {
    if (autoFocus) {
      setFocus('email');
    }
  }, [autoFocus, setFocus]);

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
        <label htmlFor="login-email" className={styles.label}>
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-required="true"
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          {...register('email')}
          className={`${styles.input} ${errors.email ? styles.inputError : styles.inputNormal}`}
        />
        {errors.email ? (
          <p id="login-email-error" role="alert" className={styles.errorText}>
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="login-password" className={styles.label}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-required="true"
          aria-invalid={errors.password ? 'true' : undefined}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
          {...register('password')}
          className={`${styles.input} ${errors.password ? styles.inputError : styles.inputNormal}`}
        />
        {errors.password ? (
          <p id="login-password-error" role="alert" className={styles.errorText}>
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isBusy || (!isValid && !hasRootError)}
        aria-busy={isBusy}
        className={styles.submitButton}
      >
        {isBusy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
