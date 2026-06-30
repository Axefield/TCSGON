import { test, expect } from '@playwright/test';

/**
 * E2E smoke — Phase 0.
 * Runs against `pnpm preview` (built bundle) per playwright.config.ts.
 */
test.describe('TCSgon shell @smoke', () => {
  test('home page renders heading and tagline', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /tcsgon/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/enterprise react spa scaffold/i)).toBeVisible();
  });
});