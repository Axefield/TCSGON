/**
 * Accessibility test helpers.
 *
 * Provides `testA11y` for axe-core assertions in unit tests
 * and `announce` for live region utilities.
 *
 * @packageDocumentation
 */

import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

/**
 * Run axe-core on a rendered DOM container and assert zero violations.
 * Throws if any critical or serious violations are found.
 *
 * @param container - The DOM element to audit (usually `render()`'s container).
 *
 * @example
 *   import { renderWithProviders } from '@/test-utils';
 *   import { testA11y } from '@/test-utils/a11y';
 *
 *   test('has no a11y violations', async () => {
 *     const { container } = renderWithProviders(<MyComponent />);
 *     await testA11y(container);
 *   });
 */
export async function testA11y(container: HTMLElement): Promise<void> {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

/**
 * Create or update an aria-live region for announcing dynamic content.
 * Idempotent — reuses the same region element across calls.
 *
 * @param message - The message to announce.
 * @param politeness - The aria-live politeness level (default: 'polite').
 *
 * @example
 *   import { announce } from '@/test-utils/a11y';
 *
 *   announce('Item saved successfully', 'assertive');
 */
export function announce(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite',
): void {
  const ANNouncerId = 'a11y-announcer';

  let region = document.getElementById(ANNouncerId);

  if (!region) {
    region = document.createElement('div');
    region.id = ANNouncerId;
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-relevant', 'additions text');
    region.setAttribute('role', 'status');
    region.style.cssText = 'position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0,0,0,0);';
    document.body.appendChild(region);
  }

  region.setAttribute('aria-live', politeness);
  region.textContent = '';
  // Force browser to register text change for repeated identical messages
  void region.offsetHeight;
  region.textContent = message;
}
