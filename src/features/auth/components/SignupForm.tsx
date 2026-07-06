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

import { Button, Input } from '@/shared/components';
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
        <Input
          id="signup-name"
          label="Name"
          type="text"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
      </div>

      <div className={styles.field}>
        <Input
          id="signup-email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <div className={styles.field}>
        <Input
          id="signup-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordStrengthIndicator password={passwordValue} />
      </div>

      <div className={styles.field}>
        <Input
          id="signup-confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isBusy}
        disabled={!isValid && !hasRootError}
      >
        {isBusy ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
