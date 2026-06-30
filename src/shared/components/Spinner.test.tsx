/**
 * Spinner component tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with custom label', () => {
    render(<Spinner label="Please wait…" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Please wait…');
  });

  it('renders as presentation when decorative', () => {
    render(<Spinner decorative />);
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('renders with size variants', () => {
    const { rerender } = render(<Spinner size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<Spinner size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<Spinner size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders an SVG child with aria-hidden', () => {
    render(<Spinner />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
