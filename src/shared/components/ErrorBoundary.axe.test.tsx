/**
 * axe-core a11y audit — ErrorBoundary
 *
 * Verifies that the default and custom fallback UIs have no
 * accessibility violations when an error is caught.
 */
import { render } from '@testing-library/react';
import { testA11y } from '@/test-utils';
import { describe, it, vi, beforeEach, afterEach } from 'vitest';

import { ErrorBoundary } from './ErrorBoundary';

/** Component that throws on every render. */
function ThrowingChild(): never {
  throw new Error('Axe test error');
}

describe('ErrorBoundary a11y', () => {
  /** Suppress React's error logging for caught exceptions. */
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('default fallback has no a11y violations', async () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    await testA11y(container);
  });

  it('custom fallback ReactNode has no a11y violations', async () => {
    const { container } = render(
      <ErrorBoundary fallback={<div role="alert">Custom fallback message</div>}>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    await testA11y(container);
  });
});
