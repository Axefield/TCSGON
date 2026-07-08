import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: path.resolve(__dirname, '.'),
    pool: 'forks',
    fileParallelism: false,
    include: ['src/**/*.test.ts'],
    setupFiles: [path.resolve(__dirname, 'src/test-setup.ts')],
    testTimeout: 10_000,
    hookTimeout: 15_000,
    env: {
      // Respect CI's DATABASE_URL (e.g. port 5432 from GitHub Actions PostgreSQL service),
      // fall back to local development defaults.
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:Axefield5242@localhost:5242/tcsgon_test',
      NODE_ENV: 'test',
      BCRYPT_COST: '4',
      SESSION_EXPIRY_HOURS: '1',
    },
  },
});
