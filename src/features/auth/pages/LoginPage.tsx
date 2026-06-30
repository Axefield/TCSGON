/**
 * LoginPage — wraps LoginForm in AuthLayout for the /login route.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §34
 */
import { type ReactElement, useCallback } from 'react';
import {
  Navigate,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthLayout } from '@/layouts/AuthLayout';
import type { LoginInput } from '@/shared/types/user';

import { LoginForm } from '../components/LoginForm';

/** Validate a redirect target against open-redirect attacks. */
function isValidRedirect(target: string): boolean {
  return target.startsWith('/') && !target.startsWith('//') && !target.includes('://');
}

export function LoginPage(): ReactElement {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = useCallback(
    async (input: LoginInput) => {
      await login(input);
      const rawNext = searchParams.get('next');
      const next = rawNext && isValidRedirect(rawNext) ? rawNext : '/dashboard';
      navigate(next, { replace: true });
    },
    [login, navigate, searchParams],
  );

  // Redirect if already logged in.
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout heading="Sign in">
      <LoginForm onSubmit={handleSubmit} />
    </AuthLayout>
  );
}
