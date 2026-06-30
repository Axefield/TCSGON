import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e', '**/*.axe.test.ts'],
    // AGENTS.md §3: coverage gates 80% lines / 75% branches / 80% functions.
    // Enforced from Phase 0; smoke test (App.test.tsx) must exercise every
    // provider so coverage is real, not stub-zero.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/__tests__/**',
        'src/main.tsx',
        'src/test-utils.tsx',
        'src/test-setup.ts',
        'src/**/*.d.ts',
        'src/**/index.ts',
        // Pure type-definition files — no runtime code to cover.
        'src/shared/types/toast.ts',
        'src/shared/types/modal.ts',
        // Not yet wired in Phase 1 — will be covered in Phase 2.
        'src/features/auth/components/ProfileMenu.tsx',
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
});