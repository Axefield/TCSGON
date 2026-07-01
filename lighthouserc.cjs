/**
 * Lighthouse CI config — Phase 2.
 *
 * Collects on dashboard and projects routes, asserts CWV budgets.
 * Run: `pnpm lhci` (alias for `lhci autorun`).
 *
 * @see docs/plans/phase-2-data-and-features.md §11
 */
const config = {
  ci: {
    collect: {
      url: [
        'http://127.0.0.1:4173/dashboard',
        'http://127.0.0.1:4173/projects',
      ],
      numberOfRuns: 3,
      settings: { preset: 'desktop' },
      startServerCommand: 'pnpm preview',
      startServerTimeout: 30_000,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'unused-javascript': ['warn', { maxNumericValue: 50 }],
        'uses-responsive-images': 'off',
        'offscreen-images': 'off',
        'unused-css-rules': 'off',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'lhci-reports',
    },
  },
};

module.exports = config;
