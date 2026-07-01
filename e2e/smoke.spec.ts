import { test, expect } from '@playwright/test';

import { setupMockApi } from './utils/mockApi';

/**
 * E2E smoke — Phase 2.
 * Runs against `pnpm preview` (built bundle) per playwright.config.ts.
 */
test.describe('TCSgon shell @smoke', () => {
  test('home page renders dashboard with stats', async ({ page }) => {
    await setupMockApi(page);
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /dashboard/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/total projects/i)).toBeVisible();
  });
});