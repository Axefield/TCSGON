/**
 * RootErrorBoundary tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RootErrorBoundary } from './RootErrorBoundary';

const ThrowingComponent = ({ message }: { message: string }): JSX.Element => {
  throw new Error(message);
};

describe('RootErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <RootErrorBoundary>
        <div data-testid="child">OK</div>
      </RootErrorBoundary>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders fallback on uncaught error', () => {
    // Suppress intentional console.error from the boundary.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <RootErrorBoundary>
        <ThrowingComponent message="Boom!" />
      </RootErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText('Boom!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('resets on "Try again" click', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <RootErrorBoundary>
        <ThrowingComponent message="Boom!" />
      </RootErrorBoundary>,
    );

    // Reset button appears.
    const btn = screen.getByRole('button', { name: /try again/i });

    // After reset, we need to re-render with non-throwing children.
    // Simulate the parent re-rendering with a different child.
    btn.click();
    rerender(
      <RootErrorBoundary>
        <div data-testid="recovered">Recovered</div>
      </RootErrorBoundary>,
    );

    expect(screen.getByTestId('recovered')).toBeInTheDocument();
  });
});
