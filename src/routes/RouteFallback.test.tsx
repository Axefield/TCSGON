/**
 * RouteFallback tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §30
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RouteFallback } from './RouteFallback';

describe('RouteFallback', () => {
  it('renders loading spinner with accessible label', () => {
    render(<RouteFallback />);
    expect(screen.getByRole('status', { name: /loading page/i })).toBeInTheDocument();
  });

  it('sets main-content id for skip-link target', () => {
    const { container } = render(<RouteFallback />);
    expect(container.querySelector('#main-content')).toBeInTheDocument();
  });
});
