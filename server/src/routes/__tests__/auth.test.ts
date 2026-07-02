import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../lib/prisma.js';

beforeEach(async () => {
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

describe('POST /api/auth/signup', () => {
  it('creates user and returns 201 with user and session', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'SecurePass1' })
      .expect(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Alice');
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.session.token).toBeTruthy();
  });

  it('returns 409 for duplicate email', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'SecurePass1' })
      .expect(201);

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Bob', email: 'alice@test.com', password: 'OtherPass1' })
      .expect(409);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for invalid input (weak password)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'short' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for invalid input (bad email)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'not-an-email', password: 'SecurePass1' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'SecurePass1' });
  });

  it('returns 200 with session for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'SecurePass1' })
      .expect(200);

    expect(res.body.user).toBeDefined();
    expect(res.body.session.token).toBeTruthy();
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'wrongpass' })
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'SecurePass1' })
      .expect(401);

    expect(res.body.error).toBeDefined();
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200 and revokes session', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'SecurePass1' });

    const token = signup.body.session.token;

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Session is now invalid
    const res = await request(app)
      .get('/api/auth/session')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/auth/session', () => {
  it('returns current user for valid token', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'SecurePass1' });

    const token = signup.body.session.token;

    const res = await request(app)
      .get('/api/auth/session')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.session).toBeDefined();
    // Session endpoint should NOT return the token
    expect(res.body.session).not.toHaveProperty('token');
  });

  it('returns 401 without auth', async () => {
    await request(app).get('/api/auth/session').expect(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'SecurePass1' });
  });

  it('returns 200 for existing email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'alice@test.com' })
      .expect(200);

    expect(res.body.message).toBeDefined();
  });

  it('returns 200 for unknown email (silent)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@test.com' })
      .expect(200);

    expect(res.body.message).toBeDefined();
  });
});

describe('POST /api/auth/reset-password', () => {
  let resetToken: string;

  beforeEach(async () => {
    // Create user
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'SecurePass1' });

    // Trigger forgot-password (creates token in DB)
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'alice@test.com' });

    // Create a known token in DB for testing
    const { generateToken, hashToken } = await import('../../lib/crypto.js');
    const user = await prisma.user.findUnique({ where: { email: 'alice@test.com' } });
    resetToken = generateToken();
    const tokenHash = hashToken(resetToken);

    // Clear auto-generated token and create our own
    await prisma.passwordResetToken.deleteMany();
    await prisma.passwordResetToken.create({
      data: {
        id: generateToken(),
        userId: user!.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  });

  it('returns 200 with new session for valid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: 'NewPassword123!' })
      .expect(200);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.session.token).toBeTruthy();
  });

  it('returns 400 for invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'bad-token', password: 'NewPassword123!' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/health', () => {
  it('returns 200 for health check', async () => {
    const res = await request(app).get('/api/health').expect(200);

    expect(res.body.status).toBe('ok');
  });
});
