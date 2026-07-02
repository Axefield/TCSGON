import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { setupMockApi } from './utils/mockApi';

/**
 * a11y audit — Phase 2 / Phase 3c.3.
 * Tagged @a11y so `pnpm axe` runs ONLY this spec.
 * Uses @axe-core/playwright (Deque official, chainable AxeBuilder API).
 *
 * Rule: zero critical/serious violations per AGENTS.md §3.
 */

/** Shared axe tags for WCAG 2.2 AA compliance. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function assertNoAxeViolations(page: import('@playwright/test').Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );

  if (blocking.length > 0) {
    console.error(
      'axe violations:',
      JSON.stringify(
        blocking.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
        null,
        2,
      ),
    );
  }

  expect(blocking).toEqual([]);
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 2: Shell pages
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TCSgon shell @a11y', () => {
  test('dashboard has no critical or serious a11y violations', async ({ page }) => {
    await setupMockApi(page);
    await page.goto('/');
    await page.getByRole('heading', { name: /dashboard/i, level: 1 }).waitFor();

    await assertNoAxeViolations(page);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Phase 3c.3: Auth pages
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Auth pages @a11y', () => {
  test('login page has no critical or serious a11y violations', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/login');
    await page.getByRole('heading', { name: /sign in/i, level: 1 }).waitFor();

    await assertNoAxeViolations(page);
  });

  test('login page with server error has no a11y violations', async ({ page }) => {
    await setupMockApi(page, { authenticated: false, authError: 'invalid' });
    await page.goto('/login');

    // Fill valid credentials — mock returns 401 (authError: 'invalid')
    await page.getByLabel(/email/i).fill('admin@tcsgon.dev');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error summary alert to appear
    await page.getByText(/authentication required/i).waitFor();

    await assertNoAxeViolations(page);
  });

  test('signup page has no critical or serious a11y violations', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/signup');
    await page.getByRole('heading', { name: /create an account/i, level: 1 }).waitFor();

    await assertNoAxeViolations(page);
  });

  test('forgot password page has no critical or serious a11y violations', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/forgot-password');
    await page.getByRole('heading', { name: /forgot password/i, level: 1 }).waitFor();

    await assertNoAxeViolations(page);
  });

  test('reset password page (valid token) has no a11y violations', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/reset-password?token=valid-reset-token');
    await page.getByRole('heading', { name: /reset password/i, level: 1 }).waitFor();

    await assertNoAxeViolations(page);
  });

  test('reset password page (missing token) has no a11y violations', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/reset-password');
    await page.getByRole('heading', { name: /invalid reset link/i, level: 1 }).waitFor();

    await assertNoAxeViolations(page);
  });

  test('settings page has no critical or serious a11y violations', async ({ page }) => {
    await setupMockApi(page);
    await page.goto('/settings');
    await page.getByRole('heading', { name: /settings/i, level: 1 }).waitFor();

    await assertNoAxeViolations(page);
  });
});