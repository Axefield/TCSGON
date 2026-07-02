import { describe, it, expect, beforeEach } from 'vitest';
import * as userService from '../user.js';
import { prisma } from '../../lib/prisma.js';

beforeEach(async () => {
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

describe('userService.createUser', () => {
  it('creates a user with hashed password', async () => {
    const user = await userService.createUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    expect(user.name).toBe('Alice');
    expect(user.email).toBe('alice@test.com');
    expect(user.passwordHash).toMatch(/^\$2[aby]\$./); // bcrypt format
  });

  it('throws 409 for duplicate email', async () => {
    await userService.createUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    await expect(
      userService.createUser({
        name: 'Bob',
        email: 'alice@test.com',
        password: 'OtherPass1',
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });
});

describe('userService.getUserByEmail', () => {
  it('finds a user by email', async () => {
    await userService.createUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    const user = await userService.getUserByEmail('alice@test.com');
    expect(user).not.toBeNull();
    expect(user?.name).toBe('Alice');
  });

  it('returns null for unknown email', async () => {
    const user = await userService.getUserByEmail('unknown@test.com');
    expect(user).toBeNull();
  });
});

describe('userService.getUserById', () => {
  it('finds a user by id', async () => {
    const created = await userService.createUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    const user = await userService.getUserById(created.id);
    expect(user).not.toBeNull();
    expect(user?.name).toBe('Alice');
  });

    it('returns null for unknown id', async () => {
      const user = await userService.getUserById('00000000-0000-0000-0000-000000000001');
      expect(user).toBeNull();
    });
});

describe('userService.updateUser', () => {
  it('updates user name', async () => {
    const created = await userService.createUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    const updated = await userService.updateUser(created.id, { name: 'Alice Updated' });
    expect(updated.name).toBe('Alice Updated');
    expect(updated.email).toBe('alice@test.com');
  });

  it('throws 409 if new email is taken', async () => {
    await userService.createUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    const bob = await userService.createUser({
      name: 'Bob',
      email: 'bob@test.com',
      password: 'SecurePass1',
    });

    await expect(
      userService.updateUser(bob.id, { email: 'alice@test.com' }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });
});

describe('userService.changePassword', () => {
  it('changes password with valid current password', async () => {
    const created = await userService.createUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    await userService.changePassword(created.id, 'SecurePass1', 'NewPass1234!');

    // Verify new password works
    const user = await prisma.user.findUnique({ where: { id: created.id } });
    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.compare('NewPass1234!', user!.passwordHash);
    expect(valid).toBe(true);
  });

  it('throws 401 for incorrect current password', async () => {
    const created = await userService.createUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    await expect(
      userService.changePassword(created.id, 'wrongpass', 'NewPass1234!'),
    ).rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
  });
});

describe('userService.sanitizeUser', () => {
  it('removes passwordHash from user object', async () => {
    const created = await userService.createUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    const safe = userService.sanitizeUser(created);
    expect(safe).not.toHaveProperty('passwordHash');
    expect(safe.name).toBe('Alice');
    expect(safe.email).toBe('alice@test.com');
  });
});
