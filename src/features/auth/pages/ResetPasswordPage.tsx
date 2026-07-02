/**
 * ResetPasswordPage — wraps ResetPasswordForm in AuthLayout for the
 * /reset-password route. Expects a `token` query parameter.
 *
 * @see docs/plans/phase-3-authentication.md
 *
 * Accessibility:
 *  - Invalid token states handled gracefully (error message + link to
 *    forgot-password page)
 *  - Success state shows confirmation before redirecting
 */
import { type ReactElement, useCallback, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthLayout } from '@/layouts/AuthLayout';
import type { ResetPasswordInput } from '@/shared/types/user';

import { ResetPasswordForm } from '../components/ResetPasswordForm';

export function ResetPasswordPage(): ReactElement {
  const { resetPassword, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get('token');

  const handleSubmit = useCallback(
    async (input: ResetPasswordInput) => {
      await resetPassword.mutateAsync(input);
      setIsSuccess(true);
    },
    [resetPassword],
  );

  // Redirect if already logged in.
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // No token in URL — show error state.
  if (!token) {
    return (
      <AuthLayout heading="Invalid reset link">
        <p style={{ marginBottom: '1rem' }}>
          This password reset link is missing the required token. Please request a new reset link.
        </p>
        <Link
          to="/forgot-password"
          style={{ color: 'var(--color-primary, #0b3d91)', textDecoration: 'underline' }}
        >
          Request a new reset link
        </Link>
      </AuthLayout>
    );
  }

  // Success state after password reset.
  if (isSuccess) {
    return (
      <AuthLayout heading="Password reset successful">
        <p style={{ marginBottom: '1rem' }}>
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Link
          to="/login"
          style={{ color: 'var(--color-primary, #0b3d91)', textDecoration: 'underline' }}
        >
          Sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout heading="Reset password" subheading="Enter your new password">
      <ResetPasswordForm
        onSubmit={handleSubmit}
        disabled={resetPassword.isPending}
        initialToken={token}
      />
    </AuthLayout>
  );
}
