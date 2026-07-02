import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { config } from '../config.js';

/**
 * Generate a cryptographically secure random token (UUID v4).
 */
export function generateToken(): string {
  return uuid();
}

/**
 * Hash a token using SHA-256 for storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Hash a password using bcrypt with the configured cost factor.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.bcryptCost);
}

/**
 * Compare a password against a bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Calculate an expiry date from now (in hours).
 */
export function expiryDate(hours: number = config.sessionExpiryHours): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
