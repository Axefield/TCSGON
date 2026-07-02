import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

function sha256(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tcsgon.dev' },
    update: {},
    create: {
      id: uuid(),
      name: 'Admin User',
      email: 'admin@tcsgon.dev',
      passwordHash,
    },
  });

  const token = uuid();
  const tokenHash = sha256(token);

  await prisma.session.upsert({
    where: { tokenHash },
    update: {},
    create: {
      id: uuid(),
      userId: admin.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Create a regular test user
  const userPasswordHash = await bcrypt.hash('Password123!', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'testuser@example.com' },
    update: {},
    create: {
      id: uuid(),
      name: 'Test User',
      email: 'testuser@example.com',
      passwordHash: userPasswordHash,
    },
  });

  const userToken = uuid();
  const userTokenHash = sha256(userToken);

  await prisma.session.upsert({
    where: { tokenHash: userTokenHash },
    update: {},
    create: {
      id: uuid(),
      userId: testUser.id,
      tokenHash: userTokenHash,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seed data created:');
  console.log(`  Admin: admin@tcsgon.dev / password123`);
  console.log(`  Admin E2E token: ${token}`);
  console.log(`  Test user: testuser@example.com / Password123!`);
  console.log(`  Test user E2E token: ${userToken}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
