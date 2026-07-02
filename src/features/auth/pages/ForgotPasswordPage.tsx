/**
 * ForgotPasswordPage — wraps ForgotPasswordForm in AuthLayout for the
 * /forgot-password route.
 *
 * @see docs/plans/phase-3-authentication.md
 */
import { type ReactElement, useCallback, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthLayout } from '@/layouts/AuthLayout';
import type { ForgotPasswordInput } from '@/shared/types/user';

import { ForgotPasswordForm } from '../components/ForgotPasswordForm';

export function ForgotPasswordPage(): ReactElement {
  const { forgotPassword, isAuthenticated } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (input: ForgotPasswordInput) => {
      await forgotPassword.mutateAsync(input);
      setIsSuccess(true);
    },
    [forgotPassword],
  );

  // Redirect if already logged in.
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isSuccess) {
    return (
      <AuthLayout heading="Email sent">
        <ForgotPasswordForm onSubmit={handleSubmit} isSuccess={isSuccess} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout heading="Forgot password" subheading="Enter your email to receive a reset link">
      <ForgotPasswordForm onSubmit={handleSubmit} isSuccess={isSuccess} />
    </AuthLayout>
  );
}
