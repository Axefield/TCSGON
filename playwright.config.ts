import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — Phase 0 smoke + a11y.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // ── A11y-specific projects ──────────────────────────────────────
    {
      name: 'axe-chromium',
      testMatch: '**/axe*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'axe-firefox',
      testMatch: '**/axe*.spec.ts',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'keyboard-chromium',
      testMatch: '**/keyboard*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      testMatch: '**/axe*.spec.ts',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  // Tag-based selectors:
  //   pnpm e2e          → all specs
  //   pnpm axe          → only @a11y-tagged specs (axe-core audit gate)
  //   pnpm axe:firefox  → @a11y specs on Firefox
  //   pnpm keyboard     → keyboard-only spec
  // (default: no filter)
  webServer: {
    command: 'pnpm preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env['CI'],
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 60_000,
  },
});