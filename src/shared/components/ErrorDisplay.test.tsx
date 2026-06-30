/**
 * ErrorDisplay component tests.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api/errors';

import { ErrorDisplay } from './ErrorDisplay';

function createHttpError(status: number): ApiError {
  return new ApiError({
    kind: 'http',
    status,
    body: null,
    message: `Request failed with status ${String(status)}.`,
    correlationId: 'test-corr',
  });
}

describe('ErrorDisplay', () => {
  it('renders null when error is null', () => {
    const { container } = render(<ErrorDisplay error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders with role="alert"', () => {
    render(<ErrorDisplay error={createHttpError(500)} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays default error message from apiErrorMessage', () => {
    render(<ErrorDisplay error={createHttpError(500)} />);
    expect(screen.getByText(/Server error/i)).toBeInTheDocument();
  });

  it('displays custom title when provided', () => {
    render(
      <ErrorDisplay
        error={createHttpError(404)}
        title="Data load failed"
      />,
    );
    expect(screen.getByText('Data load failed')).toBeInTheDocument();
  });

  it('renders retry button and calls onRetry when clicked', async () => {
    const onRetry = vi.fn();
    render(
      <ErrorDisplay error={createHttpError(500)} onRetry={onRetry} />,
    );
    const button = screen.getByRole('button', { name: 'Retry' });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is omitted', () => {
    render(<ErrorDisplay error={createHttpError(500)} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('displays network error message', () => {
    const networkError = new ApiError({
      kind: 'network',
      message: 'Network error.',
      correlationId: 'test-corr',
    });
    render(<ErrorDisplay error={networkError} />);
    expect(screen.getByText(/Offline/i)).toBeInTheDocument();
  });

  it('displays validation error message with issues', () => {
    const validationError = new ApiError({
      kind: 'validation',
      message: 'Validation failed.',
      issues: [{ path: 'name', message: 'Name is required.' }],
      correlationId: 'test-corr',
    });
    render(<ErrorDisplay error={validationError} />);
    expect(screen.getByText(/name: Name is required/i)).toBeInTheDocument();
  });
});
