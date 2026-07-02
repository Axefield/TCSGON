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
  // Derive redirect target during render so useCallback deps are stable.
  const rawNext = searchParams.get('next');
  const defaultNext = rawNext && isValidRedirect(rawNext) ? rawNext : '/dashboard';

  const handleSubmit = useCallback(
    async (input: LoginInput) => {
      await login.mutateAsync(input);
      navigate(defaultNext, { replace: true });
    },
    [login, navigate, defaultNext],
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
