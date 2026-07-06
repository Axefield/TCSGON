/**
 * axe-core a11y audit — EmptyState
 *
 * EmptyState renders `role="status"` with heading, description, and optional
 * action Button. It should have no a11y violations in any configuration.
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { EmptyState } from './EmptyState';

describe('EmptyState a11y', () => {
  it('basic empty state has no violations', async () => {
    const { container } = render(
      <EmptyState heading="No results" description="Try a different search." />,
    );
    await testA11y(container);
  });

  it('with action button has no violations', async () => {
    const { container } = render(
      <EmptyState
        heading="No projects"
        description="Create one to get started."
        action={{ label: 'Create project', onClick: () => {} }}
      />,
    );
    await testA11y(container);
  });

  it('with custom icon has no violations', async () => {
    const { container } = render(
      <EmptyState
        heading="All caught up"
        icon={<span>✓</span>}
      />,
    );
    await testA11y(container);
  });

  it('heading only (no description or action) has no violations', async () => {
    const { container } = render(
      <EmptyState heading="Nothing here" />,
    );
    await testA11y(container);
  });
});
