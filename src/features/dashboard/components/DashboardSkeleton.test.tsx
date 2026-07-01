/**
 * Tests for DashboardSkeleton component.
 */
import { render, screen } from '@testing-library/react';

import { DashboardSkeleton } from './DashboardSkeleton';

describe('DashboardSkeleton', () => {
  it('renders loading skeleton with role="status"', () => {
    render(<DashboardSkeleton />);

    const status = screen.getByRole('status', { name: 'Dashboard is loading' });
    expect(status).toBeInTheDocument();
  });

  it('renders skeleton cards for metrics', () => {
    render(<DashboardSkeleton />);

    expect(screen.getByRole('region', { name: 'Total Projects' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Active Projects' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Team Members' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Completion Rate' })).toBeInTheDocument();
  });
});
