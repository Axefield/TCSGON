import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { createAuthenticatedUser } from '../../test-utils.js';

beforeEach(async () => {
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

describe('GET /api/users/me', () => {
  it('returns current user', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body.name).toBe('Test User');
  });

  it('returns 401 without auth', async () => {
    await request(app).get('/api/users/me').expect(401);
  });
});

describe('PUT /api/users/me', () => {
  it('updates user name', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' })
      .expect(200);

    expect(res.body.name).toBe('Updated Name');
  });

  it('returns 400 for invalid data', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-an-email' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 401 without auth', async () => {
    await request(app).put('/api/users/me').send({ name: 'Hacker' }).expect(401);
  });
});

describe('PUT /api/users/me/password', () => {
  it('changes password with correct current password', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password123!', newPassword: 'NewPassword456!' })
      .expect(200);

    expect(res.body.message).toBe('Password changed successfully.');
  });

  it('returns 401 for incorrect current password', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpass', newPassword: 'NewPassword456!' })
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for weak new password', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Password123!', newPassword: 'short' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 401 without auth', async () => {
    await request(app)
      .put('/api/users/me/password')
      .send({ currentPassword: 'x', newPassword: 'y' })
      .expect(401);
  });
});
