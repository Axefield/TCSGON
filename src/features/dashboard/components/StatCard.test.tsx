/**
 * Tests for StatCard component.
 */
import { render, screen } from '@testing-library/react';

import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Projects" value={42} />);

    const region = screen.getByRole('region', { name: 'Total Projects' });
    expect(region).toBeInTheDocument();
    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders trend indicator when provided', () => {
    render(
      <StatCard
        label="Active Projects"
        value={18}
        trend={{ direction: 'up', label: '+12% vs last month' }}
      />,
    );

    // The trend text includes the arrow and label string
    expect(screen.getByText(/↑.*\+12% vs last month/)).toBeInTheDocument();
    expect(screen.getByLabelText('+12% vs last month')).toBeInTheDocument();
  });

  it('renders down trend indicator', () => {
    render(
      <StatCard
        label="Issues"
        value={3}
        trend={{ direction: 'down', label: '-2 vs last week' }}
      />,
    );

    expect(screen.getByText(/↓.*-2 vs last week/)).toBeInTheDocument();
  });

  it('renders neutral trend indicator', () => {
    render(
      <StatCard
        label="Uptime"
        value="99.9%"
        trend={{ direction: 'neutral', label: 'No change' }}
      />,
    );

    expect(screen.getByText(/→.*No change/)).toBeInTheDocument();
  });

  it('renders skeleton placeholders when loading', () => {
    render(<StatCard label="Team Members" value={12} isLoading />);

    const region = screen.getByRole('region', { name: 'Team Members' });
    expect(region).toBeInTheDocument();
    // Skeletons render as spans with role="presentation"
    const skeletons = region.querySelectorAll('[role="presentation"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('uses the correct aria label on the region', () => {
    render(<StatCard label="Completion Rate" value="73.5%" />);

    expect(screen.getByRole('region', { name: 'Completion Rate' })).toBeInTheDocument();
  });
});
