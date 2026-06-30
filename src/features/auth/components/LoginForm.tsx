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
import { type ReactElement, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { LoginInputSchema, type LoginInput } from '@/shared/types/user';

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

  const hasRootError = Boolean(errors.root);
  const isBusy = isSubmitting || disabled;

  return (
    <form noValidate onSubmit={handleFormSubmit}>
      {errors.root ? (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            background: 'var(--color-toast-error-border, #fecaca)',
            borderRadius: 'var(--radius-md, 0.5rem)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            color: 'var(--color-danger, #dc2626)',
          }}
        >
          {errors.root.message}
        </div>
      ) : null}

      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="login-email"
          style={{ display: 'block', marginBottom: '0.25rem', fontSize: 'var(--font-size-sm, 0.875rem)' }}
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          autoFocus={autoFocus}
          aria-required="true"
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          {...register('email')}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            border: `1px solid ${errors.email ? 'var(--color-danger, #dc2626)' : 'var(--color-border, #e2e8f0)'}`,
            borderRadius: 'var(--radius-md, 0.5rem)',
          }}
        />
        {errors.email ? (
          <p id="login-email-error" role="alert" style={{ fontSize: '0.75rem', color: 'var(--color-danger, #dc2626)', marginTop: '0.25rem' }}>
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="login-password"
          style={{ display: 'block', marginBottom: '0.25rem', fontSize: 'var(--font-size-sm, 0.875rem)' }}
        >
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
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            border: `1px solid ${errors.password ? 'var(--color-danger, #dc2626)' : 'var(--color-border, #e2e8f0)'}`,
            borderRadius: 'var(--radius-md, 0.5rem)',
          }}
        />
        {errors.password ? (
          <p id="login-password-error" role="alert" style={{ fontSize: '0.75rem', color: 'var(--color-danger, #dc2626)', marginTop: '0.25rem' }}>
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isBusy || (!isValid && !hasRootError)}
        aria-busy={isBusy}
        style={{
          width: '100%',
          padding: '0.625rem 1rem',
          background: isBusy ? 'var(--color-primary, #0b3d91)' : 'var(--color-primary, #0b3d91)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 'var(--radius-md, 0.5rem)',
          cursor: isBusy ? 'not-allowed' : 'pointer',
          opacity: isBusy ? 0.7 : 1,
          fontWeight: 'var(--font-weight-medium, 500)',
        }}
      >
        {isBusy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
