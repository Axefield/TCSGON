/**
 * axe-core a11y audit — DashboardPage
 *
 * DashboardPage uses Redux (auth) and Router, plus fetches data via useDashboard.
 * MSW intercepts the API calls.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { testA11y } from '@/test-utils';
import { renderWithProviders } from '@/test-utils';

import { DashboardPage } from './DashboardPage';

describe('DashboardPage a11y', () => {
  it('default dashboard has no a11y violations', async () => {
    const { container } = renderWithProviders(<DashboardPage />);
    // Wait for lazy-loaded content to settle
    await testA11y(container);
  });
});
