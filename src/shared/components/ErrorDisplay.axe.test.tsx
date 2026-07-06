/**
 * axe-core a11y audit — ErrorDisplay
 *
 * ErrorDisplay renders `role="alert"` when `error` is non-null, with title,
 * message (via `apiErrorMessage`), and optional retry Button.
 * Returns null when `error={null}` so we only test the non-null branch.
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { ApiError } from '@/shared/api/errors';

import { ErrorDisplay } from './ErrorDisplay';

describe('ErrorDisplay a11y', () => {
  it('http 404 error has no violations', async () => {
    const error = new ApiError({
      kind: 'http',
      message: 'Not found',
      status: 404,
      body: null,
      correlationId: 'test-404',
    });
    const { container } = render(
      <ErrorDisplay error={error} title="Page not found" />,
    );
    await testA11y(container);
  });

  it('network error with retry has no violations', async () => {
    const error = new ApiError({
      kind: 'network',
      message: 'Network failure',
      correlationId: 'test-net',
    });
    const { container } = render(
      <ErrorDisplay
        error={error}
        title="Connection lost"
        onRetry={() => {}}
      />,
    );
    await testA11y(container);
  });

  it('validation error has no violations', async () => {
    const error = new ApiError({
      kind: 'validation',
      message: 'Validation failed',
      correlationId: 'test-val',
      issues: [
        { path: 'email', message: 'Invalid email format' },
        { path: 'age', message: 'Must be a positive number' },
      ],
    });
    const { container } = render(<ErrorDisplay error={error} />);
    await testA11y(container);
  });

  it('unauthorized error has no violations', async () => {
    const error = new ApiError({
      kind: 'unauthorized',
      message: 'Unauthorized',
      correlationId: 'test-auth',
      loginUrl: '/login',
    });
    const { container } = render(
      <ErrorDisplay error={error} title="Session expired" />,
    );
    await testA11y(container);
  });

  it('timeout error with retry has no violations', async () => {
    const error = new ApiError({
      kind: 'timeout',
      message: 'Request timed out',
      correlationId: 'test-timeout',
      timeoutMs: 30000,
    });
    const { container } = render(
      <ErrorDisplay
        error={error}
        title="Request timed out"
        onRetry={() => {}}
      />,
    );
    await testA11y(container);
  });

  it('aborted error has no violations', async () => {
    const error = new ApiError({
      kind: 'aborted',
      message: 'Request cancelled',
      correlationId: 'test-abort',
    });
    const { container } = render(<ErrorDisplay error={error} />);
    await testA11y(container);
  });

  it('server error 500 with retry has no violations', async () => {
    const error = new ApiError({
      kind: 'http',
      message: 'Internal server error',
      status: 500,
      body: null,
      correlationId: 'test-500',
    });
    const { container } = render(
      <ErrorDisplay error={error} title="Server error" onRetry={() => {}} />,
    );
    await testA11y(container);
  });
});
