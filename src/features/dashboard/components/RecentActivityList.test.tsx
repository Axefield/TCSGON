/**
 * Tests for RecentActivityList component.
 */
import { render, screen } from '@testing-library/react';

import { RecentActivityList } from './RecentActivityList';

const mockActivities = [
  {
    id: 'act-001',
    type: 'project_created' as const,
    message: 'Mobile App Redesign project created',
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    projectId: 'proj-001',
  },
  {
    id: 'act-002',
    type: 'status_changed' as const,
    message: 'Q4 Roadmap moved to active',
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    projectId: 'proj-002',
  },
];

describe('RecentActivityList', () => {
  it('renders heading and activity items', () => {
    render(<RecentActivityList activities={mockActivities} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Mobile App Redesign project created')).toBeInTheDocument();
    expect(screen.getByText('Q4 Roadmap moved to active')).toBeInTheDocument();
  });

  it('shows relative timestamps', () => {
    render(<RecentActivityList activities={mockActivities} />);

    // act-001 is 1h ago, act-002 is 1d ago
    expect(screen.getByText('1h ago')).toBeInTheDocument();
    expect(screen.getByText('1d ago')).toBeInTheDocument();
  });

  it('shows empty state when no activities', () => {
    render(<RecentActivityList activities={[]} />);

    expect(screen.getByText('No recent activity.')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading', () => {
    const { container } = render(<RecentActivityList isLoading />);

    expect(screen.getByRole('list', { name: 'Loading recent activity' })).toBeInTheDocument();
    // Skeletons are rendered
    const skeletons = container.querySelectorAll('[role="presentation"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('uses role="list" and role="listitem"', () => {
    render(<RecentActivityList activities={mockActivities} />);

    expect(screen.getByRole('list', { name: 'Recent activity' })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
  });
});
