/**
 * EmptyState component tests.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders heading', () => {
    render(<EmptyState heading="No items" />);
    expect(screen.getByRole('heading', { name: 'No items' })).toBeInTheDocument();
  });

  it('renders with role="status"', () => {
    render(<EmptyState heading="Empty" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState heading="Empty" description="Nothing to see here." />);
    expect(screen.getByText('Nothing to see here.')).toBeInTheDocument();
  });

  it('renders action button and calls onClick', async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        heading="Empty"
        action={{ label: 'Create one', onClick }}
      />,
    );
    const button = screen.getByRole('button', { name: 'Create one' });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState heading="Empty" icon={<span data-testid="test-icon">🔍</span>} />,
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('does not render optional sections when omitted', () => {
    render(<EmptyState heading="Only heading" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(/nothing/i)).not.toBeInTheDocument();
  });
});
