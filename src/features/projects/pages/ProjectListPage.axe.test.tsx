/**
 * axe-core a11y audit — ProjectListPage
 *
 * Uses Redux (auth), Router, and MSW-intercepted API calls.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { testA11y } from '@/test-utils';
import { renderWithProviders } from '@/test-utils';

import { ProjectListPage } from './ProjectListPage';

describe('ProjectListPage a11y', () => {
  it('project list with empty state has no a11y violations', async () => {
    const { container } = renderWithProviders(<ProjectListPage />, {
      initialEntries: ['/projects'],
    });
    await testA11y(container);
  });

  it('project list with page 2 query param has no a11y violations', async () => {
    const { container } = renderWithProviders(<ProjectListPage />, {
      initialEntries: ['/projects?page=2'],
    });
    await testA11y(container);
  });
});
