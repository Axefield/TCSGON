import { prisma } from './lib/prisma.js';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Sync the test database schema to the current Prisma schema.
 *
 * Uses `prisma db push` instead of `prisma migrate deploy` because:
 *  - It ignores `_prisma_migrations` table, so it cannot fail on P3009
 *    (stale failed migration from interrupted test runs)
 *  - It is faster — only pushes changes, never creates migration files
 *  - The test DB has no migrations history we care about; we only need
 *    the schema to match the Prisma client at that point in time
 */
function syncTestDatabase(): void {
  execSync('npx prisma db push --skip-generate', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
    stdio: 'pipe',
  });
}

beforeAll(() => {
  syncTestDatabase();
});

afterEach(async () => {
  // Clean all tables between tests (in reverse FK order)
  await prisma.notificationPreference.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.project.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});
