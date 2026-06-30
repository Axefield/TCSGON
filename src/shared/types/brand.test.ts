/**
 * Branded type factory tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §17
 */
import { describe, expect, it } from 'vitest';

import {
  asModalId,
  asSessionId,
  asToastId,
  asUserId,
  newModalId,
  newSessionId,
  newToastId,
  newUserId,
} from './brand';

describe('as* functions', () => {
  it('asUserId casts a string', () => {
    const id = asUserId('user_123');
    expect(typeof id).toBe('string');
  });

  it('asSessionId casts a string', () => {
    const id = asSessionId('session_456');
    expect(typeof id).toBe('string');
  });

  it('asToastId casts a string', () => {
    const id = asToastId('toast_abc');
    expect(typeof id).toBe('string');
  });

  it('asModalId casts a string', () => {
    const id = asModalId('modal_xyz');
    expect(typeof id).toBe('string');
  });
});

describe('new* functions', () => {
  it('newUserId generates a UUID', () => {
    const id = newUserId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('newSessionId generates a UUID', () => {
    const id = newSessionId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('newToastId generates a UUID', () => {
    const id = newToastId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('newModalId generates a UUID', () => {
    const id = newModalId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
