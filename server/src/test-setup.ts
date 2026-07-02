import { prisma } from './lib/prisma.js';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Global test setup:
 * - Ensures test DB has latest migrations
 * - Cleans all tables before each test suite
 */
beforeAll(async () => {
  // Ensure migrations are applied to test database
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
    stdio: 'pipe',
  });
});

afterEach(async () => {
  // Clean all tables between tests (in reverse FK order)
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});
