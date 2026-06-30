/**
 * Skeleton component tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    render(<Skeleton />);
    const el = screen.getByRole('presentation', { hidden: true });
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders as status when label is provided', () => {
    render(<Skeleton label="Loading…" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('presentation', { hidden: true })).not.toBeInTheDocument();
  });

  it('accepts width and height', () => {
    render(<Skeleton width={200} height={20} />);
    const el = screen.getByRole('presentation', { hidden: true });
    expect(el).toHaveStyle({ width: '200px', height: '20px' });
  });

  it('accepts string width', () => {
    render(<Skeleton width="100%" height={40} />);
    const el = screen.getByRole('presentation', { hidden: true });
    expect(el).toHaveStyle({ width: '100%', height: '40px' });
  });

  it('accepts custom radius', () => {
    render(<Skeleton width={100} height={100} radius={50} />);
    const el = screen.getByRole('presentation', { hidden: true });
    expect(el).toHaveStyle({ borderRadius: '50px' });
  });
});
