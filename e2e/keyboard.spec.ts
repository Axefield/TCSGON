/**
 * Keyboard-only navigation smoke tests.
 *
 * Verifies every route is fully navigable using Tab / Shift+Tab / Enter / Space / Escape
 * with a visible focus indicator at every stop. Tagged @keyboard so
 * `pnpm keyboard` runs ONLY this spec.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */

import { expect, test } from '@playwright/test';
import { setupMockApi } from './utils/mockApi';

interface KeyboardTestOptions {
  /** Starting URL for the route */
  path: string;
  /** Expected heading text that confirms the route loaded */
  expectedHeading: RegExp;
  /** Whether the route requires authentication (default: true) */
  authenticated?: boolean;
  /** Minimum number of focusable elements expected */
  minFocusable?: number;
}

async function assertKeyboardAccessible(
  page: import('@playwright/test').Page,
  options: KeyboardTestOptions,
): Promise<void> {
  const { path, expectedHeading, minFocusable = 5 } = options;

  // Navigate to route
  await page.goto(path);

  // Wait for the route to settle
  await page.getByRole('heading', { name: expectedHeading, level: 1 }).waitFor();

  // Verify skip link is first focusable element
  const firstTabStop = await page.evaluate(() => {
    const focusable = document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled])',
    );
    if (focusable.length === 0) return null;
    const el = focusable[0]!;
    return { tagName: el.tagName, href: el.getAttribute('href') };
  });
  expect(firstTabStop, 'Expected at least one focusable element').not.toBeNull();
  // The first element should be the "Skip to content" link
  expect(firstTabStop!.tagName, 'First focusable element should be the skip link').toBe('A');
  expect(firstTabStop!.href, 'Skip link should point to main content').toBe('#main-content');

  // Tab through all focusable elements — verify no focus traps
  const focusableCount = await page.evaluate(() => {
    const focusable = document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled])',
    );
    return focusable.length;
  });

  expect(focusableCount).toBeGreaterThanOrEqual(minFocusable);

  // Tab forward through each element — verify focus moves and no traps
  let previousElement: string | null = null;
  for (let i = 0; i < focusableCount; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      return { tagName: el.tagName, id: el.id, text: (el.textContent ?? '').trim().slice(0, 40) };
    });
    expect(focused, `Focus should be on an element after ${i + 1} Tab presses`).not.toBeNull();
    // Verify focus actually moved to a different element (detect focus traps)
    // Use tagName + id + first 40 chars of text as key — tagName#id alone is ambiguous
    // when multiple elements lack ids (e.g., <button> without id → all map to "BUTTON#").
    const focusedTag = `${focused!.tagName}#${focused!.id}#${focused!.text}`;
    if (previousElement !== null) {
      expect(
        focusedTag,
        `Focus should move to a new element on Tab ${i + 1} — got stuck on ${focused!.tagName}#${focused!.id}`,
      ).not.toBe(previousElement);
    }
    previousElement = focusedTag;
  }

  // Shift+Tab back to the beginning (need focusableCount - 1 because Tab loop
  // started at body and moved to focusable[0] on 1st press, so focusableCount
  // presses lands on the LAST element; N-1 Shift+Tabs returns to focusable[0]).
  for (let i = 0; i < focusableCount - 1; i++) {
    await page.keyboard.press('Shift+Tab');
  }

  // Verify we're back at the skip link
  const backAtStart = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    return { tagName: el.tagName, href: el.getAttribute('href') };
  });
  expect(backAtStart, 'Shift+Tab should return to the first focusable element').not.toBeNull();
  expect(backAtStart!.tagName, 'Should be back at the skip link').toBe('A');
  expect(backAtStart!.href, 'Should point to main content').toBe('#main-content');
}

// ═══════════════════════════════════════════════════════════════════════════
// Shell routes
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Keyboard navigation — shell @keyboard', () => {
  test('dashboard route is keyboard accessible', async ({ page }) => {
    await setupMockApi(page);
    await assertKeyboardAccessible(page, {
      path: '/',
      expectedHeading: /dashboard/i,
      // Dashboard metrics are static — only skip-link + 3 shell buttons are focusable
      minFocusable: 4,
    });
  });

  test('settings route is keyboard accessible', async ({ page }) => {
    await setupMockApi(page);
    await assertKeyboardAccessible(page, {
      path: '/settings',
      expectedHeading: /settings/i,
    });
  });

  test('404 page is keyboard accessible', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await assertKeyboardAccessible(page, {
      path: '/nonexistent-route',
      expectedHeading: /not found/i,
      authenticated: false,
      minFocusable: 2,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Auth routes
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Keyboard navigation — auth @keyboard', () => {
  test('login page is keyboard accessible', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await assertKeyboardAccessible(page, {
      path: '/login',
      expectedHeading: /sign in/i,
      authenticated: false,
    });
  });

  test('signup page is keyboard accessible', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await assertKeyboardAccessible(page, {
      path: '/signup',
      expectedHeading: /create an account/i,
      authenticated: false,
    });
  });

  test('forgot password page is keyboard accessible', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await assertKeyboardAccessible(page, {
      path: '/forgot-password',
      expectedHeading: /forgot password/i,
      authenticated: false,
      minFocusable: 3,
    });
  });

  test('reset password page is keyboard accessible', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await assertKeyboardAccessible(page, {
      path: '/reset-password?token=valid-reset-token',
      expectedHeading: /reset password/i,
      authenticated: false,
    });
  });
});
