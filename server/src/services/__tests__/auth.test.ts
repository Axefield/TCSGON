import { describe, it, expect, beforeEach } from 'vitest';
import * as authService from '../auth.js';
import * as userService from '../user.js';
import { prisma } from '../../lib/prisma.js';
import { generateToken } from '../../lib/crypto.js';

beforeEach(async () => {
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

describe('authService.signup', () => {
  const validInput = {
    name: 'Alice',
    email: 'alice@test.com',
    password: 'SecurePass1',
  };

  it('creates a user and returns a session', async () => {
    const result = await authService.signup(validInput);

    expect(result.user).toBeDefined();
    expect(result.user.name).toBe('Alice');
    expect(result.user.email).toBe('alice@test.com');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.session).toBeDefined();
    expect(result.session.token).toBeTruthy();
    expect(result.session.token.length).toBeGreaterThan(20);
    expect(result.session.expiresAt).toBeInstanceOf(Date);
  });

  it('throws 409 when email already exists', async () => {
    await authService.signup(validInput);

    await expect(authService.signup(validInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('hashes the password (is not plaintext)', async () => {
    const result = await authService.signup(validInput);

    const user = await prisma.user.findUnique({ where: { id: result.user.id } });
    expect(user?.passwordHash).not.toBe(validInput.password);
    expect(user?.passwordHash).toMatch(/^\$2[aby]\$./); // bcrypt hash format
  });
});

describe('authService.login', () => {
  beforeEach(async () => {
    await authService.signup({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });
  });

  it('returns a session for valid credentials', async () => {
    const result = await authService.login({
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('alice@test.com');
    expect(result.session.token).toBeTruthy();
  });

  it('throws 401 for wrong password', async () => {
    await expect(
      authService.login({ email: 'alice@test.com', password: 'wrongpass' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('throws 401 for unknown email', async () => {
    await expect(
      authService.login({ email: 'nobody@test.com', password: 'SecurePass1' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  });
});

describe('authService.logout', () => {
  it('revokes the session', async () => {
    const { session } = await authService.signup({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    await authService.logout(session.id);

    const found = await prisma.session.findUnique({ where: { id: session.id } });
    expect(found).toBeNull();
  });
});

describe('authService.forgotPassword', () => {
  beforeEach(async () => {
    await authService.signup({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });
  });

  it('creates a reset token for existing user', async () => {
    await authService.forgotPassword('alice@test.com');

    const tokens = await prisma.passwordResetToken.findMany({
      include: { user: true },
    });
    expect(tokens.length).toBe(1);
    expect(tokens[0]?.user.email).toBe('alice@test.com');
  });

  it('does nothing for unknown email (silent)', async () => {
    await authService.forgotPassword('unknown@test.com');

    const tokens = await prisma.passwordResetToken.findMany();
    expect(tokens.length).toBe(0);
  });
});

describe('authService.resetPassword', () => {
  let resetToken: string;

  beforeEach(async () => {
    await authService.signup({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'SecurePass1',
    });

    await authService.forgotPassword('alice@test.com');

    // Retrieve the raw token from the DB (in test we can access it)
    const prismaToken = await prisma.passwordResetToken.findFirst({ include: { user: true } });
    expect(prismaToken).toBeDefined();

    // We need the raw token. Since forgotPassword logs it,
    // in test mode we need a way to get it. Let's create one directly.
    const { hashToken, generateToken } = await import('../../lib/crypto.js');
    const token = generateToken();
    const tokenHash = hashToken(token);
    resetToken = token;

    // Replace the auto-generated token with our known one
    await prisma.passwordResetToken.deleteMany();
    await prisma.passwordResetToken.create({
      data: {
        id: generateToken(),
        userId: prismaToken!.userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  });

  it('resets password and returns a new session for valid token', async () => {
    const result = await authService.resetPassword({
      token: resetToken,
      password: 'NewPassword123!',
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('alice@test.com');
    expect(result.session.token).toBeTruthy();
    expect(result.session.token).not.toBe(resetToken);
  });

  it('throws 400 for invalid token', async () => {
    await expect(
      authService.resetPassword({ token: 'bad-token', password: 'NewPassword123!' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws 400 for expired token', async () => {
    // Manually expire the token
    const tokenRecord = await prisma.passwordResetToken.findFirst();
    await prisma.passwordResetToken.update({
      where: { id: tokenRecord!.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(
      authService.resetPassword({ token: resetToken, password: 'NewPassword123!' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('marks token as used after reset', async () => {
    await authService.resetPassword({ token: resetToken, password: 'NewPassword123!' });

    const tokenRecord = await prisma.passwordResetToken.findFirst();
    expect(tokenRecord?.usedAt).not.toBeNull();
  });
});
