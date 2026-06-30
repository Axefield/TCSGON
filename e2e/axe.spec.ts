import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * a11y audit — Phase 0.
 * Tagged @a11y so `pnpm axe` runs ONLY this spec.
 * Uses @axe-core/playwright (Deque official, chainable AxeBuilder API).
 *
 * Rule: zero critical/serious violations per AGENTS.md §3.
 */
test.describe('TCSgon shell @a11y', () => {
  test('home page has no critical or serious a11y violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: /tcsgon/i, level: 1 }).waitFor();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    if (blocking.length > 0) {
       
      console.error(
        'axe violations:',
        JSON.stringify(
          blocking.map((v) => ({ id: v.id, impact: v.impact, help: v.help })),
          null,
          2,
        ),
      );
    }

    expect(blocking).toEqual([]);
  });
});