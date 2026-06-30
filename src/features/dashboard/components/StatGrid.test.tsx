/**
 * Tests for StatGrid component.
 */
import { render, screen } from '@testing-library/react';

import { StatGrid } from './StatGrid';

describe('StatGrid', () => {
  it('renders items as StatCards', () => {
    const items: ReadonlyArray<{ readonly label: string; readonly value: number | string; readonly trend?: { readonly direction: 'up' | 'down' | 'neutral'; readonly label: string } }> = [
      { label: 'Total Projects', value: 42 },
      { label: 'Active Projects', value: 18, trend: { direction: 'up', label: '+3' } },
    ];

    render(<StatGrid items={items} />);

    const grid = screen.getByRole('region', { name: 'Key metrics' });
    expect(grid).toBeInTheDocument();

    expect(screen.getByRole('region', { name: 'Total Projects' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Active Projects' })).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('renders skeleton cards when loading', () => {
    const items = [
      { label: 'Total Projects', value: 42 },
      { label: 'Active Projects', value: 18 },
    ];

    render(<StatGrid items={items} isLoading />);

    // All cards should be in loading state (skeleton)
    expect(screen.getByRole('region', { name: 'Total Projects' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Active Projects' })).toBeInTheDocument();
  });

  it('renders default skeleton items when no items provided', () => {
    render(<StatGrid isLoading />);

    expect(screen.getByRole('region', { name: 'Total Projects' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Active Projects' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Team Members' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Completion Rate' })).toBeInTheDocument();
  });

  it('has accessible region landmark', () => {
    render(<StatGrid items={[]} />);

    expect(screen.getByRole('region', { name: 'Key metrics' })).toBeInTheDocument();
  });
});
