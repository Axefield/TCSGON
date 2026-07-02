/**
 * SignupPage — wraps SignupForm in AuthLayout for the /signup route.
 *
 * @see docs/plans/phase-3-authentication.md
 */
import { type ReactElement, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthLayout } from '@/layouts/AuthLayout';
import type { SignupInput } from '@/shared/types/user';

import { SignupForm } from '../components/SignupForm';

export function SignupPage(): ReactElement {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (input: SignupInput) => {
      await signup.mutateAsync(input);
      navigate('/dashboard', { replace: true });
    },
    [signup, navigate],
  );

  // Redirect if already logged in.
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout heading="Create an account" subheading="Get started with TCSgon">
      <SignupForm onSubmit={handleSubmit} />
      <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: 'var(--font-size-sm, 0.875rem)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--color-primary, #0b3d91)', textDecoration: 'underline' }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
