/**
 * axe-core a11y audit — SettingsPage
 *
 * SettingsPage uses Redux (useAuth) and Router (navigate).
 * We use renderWithProviders with the store already having authenticated state.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { testA11y } from '@/test-utils';
import { renderWithProviders } from '@/test-utils';

import { SettingsPage } from './SettingsPage';

describe('SettingsPage a11y', () => {
  it('default settings page has no a11y violations', async () => {
    const { container } = renderWithProviders(<SettingsPage />);
    await testA11y(container);
  });
});
