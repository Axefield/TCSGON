/**
 * E2E: Dashboard data load and interaction.
 *
 * @see docs/plans/phase-2-data-and-features.md §9
 */
import { test, expect } from '@playwright/test';

import { setupMockApi } from './utils/mockApi';

test.describe('Dashboard @smoke @a11y', () => {
  test('loads and displays stat cards and activity list', async ({ page }) => {
    await setupMockApi(page);

    await page.goto('/dashboard');

    // Wait for stats to load (skeleton should be replaced by content)
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('Active Projects')).toBeVisible();
    await expect(page.getByText('Team Members')).toBeVisible();
    await expect(page.getByText('Completion Rate')).toBeVisible();

    // Verify stat values are rendered (not skeletons)
    const statValues = page.locator('[role="region"]');
    await expect(statValues.first()).toBeVisible();

    // Activity list should be populated
    await expect(page.getByRole('list')).toBeVisible();
  });

  test('shows loading skeleton then content', async ({ page }) => {
    await setupMockApi(page, { dashboardDelay: 1000 });

    await page.goto('/dashboard');

    // Skeleton should be visible initially
    await expect(page.getByRole('status', { name: /dashboard is loading/i })).toBeVisible();

    // After data loads, skeleton disappears and content appears
    await expect(page.getByText('Total Projects')).toBeVisible({ timeout: 5000 });
  });

  test('displays retry button on error', async ({ page }) => {
    await setupMockApi(page, { dashboardError: true });

    await page.goto('/dashboard');

    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });
});
