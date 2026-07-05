/**
 * Lighthouse CI config — Phase 6.
 *
 * Collects on key routes, asserts CWV budgets + a11y + performance scores.
 * Run: `pnpm lhci` (alias for `lhci autorun`).
 *
 * @see docs/plans/phase-6-testing-a11y-hardening.md §8.11 / §12
 */
const config = {
  ci: {
    collect: {
      url: [
        'http://127.0.0.1:4173/',
        'http://127.0.0.1:4173/dashboard',
        'http://127.0.0.1:4173/settings',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        // Ensure axe-core is loaded for accessibility scoring
        extraHeaders: {
          'User-Agent': 'LighthouseCI',
        },
      },
      startServerCommand: 'pnpm preview',
      startServerTimeout: 30_000,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Phase 6 §8.11: Core Web Vitals thresholds
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'interaction-to-next-paint': 'off',             // No user interaction during static gather

        // Phase 6 §8.11: Score thresholds
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],

        // Tolerances
        'unused-javascript': ['warn', { maxNumericValue: 50 }],

        // Disabled rules (not applicable to SPA with SSR-free Vite)
        'uses-responsive-images': 'off',
        'offscreen-images': 'off',
        'unused-css-rules': 'off',

        // Lighthouse recommended assertions that don't apply to this project:
        'robots-txt': 'off',                       // No robots.txt for dev/preview
        'errors-in-console': 'warn',                // API calls to non-existent backend
        'network-dependency-tree-insight': 'off',   // Experimental/deprecated LHCI check
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'lhci-reports',
    },
  },
};

module.exports = config;
