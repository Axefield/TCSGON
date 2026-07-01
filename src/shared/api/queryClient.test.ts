import { describe, expect, it } from 'vitest';

import { ApiError } from './errors';
import { queryClient } from './queryClient';

describe('queryClient — Phase 0 defaults', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.getQueryCache).toBe('function');
  });

  it('uses the documented default options', () => {
    const defaults = queryClient.getDefaultOptions();
    // Defaults are nested under .queries / .mutations; assert the
    // shape we documented in the file rather than internal v8 details.
    expect(defaults.queries?.staleTime).toBe(0);
    expect(defaults.queries?.gcTime).toBe(1000 * 60 * 5);
    // retry is a function — defaults to (failureCount, error) => boolean
    expect(typeof defaults.queries?.retry).toBe('function');
    expect(defaults.queries?.refetchOnWindowFocus).toBe(true);
    expect(defaults.queries?.refetchOnReconnect).toBe(true);
    expect(defaults.mutations?.retry).toBe(false);
  });

  it('retry function returns true for network errors', () => {
    const defaults = queryClient.getDefaultOptions();
    const retryFn = defaults.queries?.retry;
    expect(typeof retryFn).toBe('function');

    // Network error → retriable
    const networkErr = new ApiError({
      kind: 'network',
      message: 'Offline',
      cause: new Error('fetch failed'),
      correlationId: 'test',
    });
    // Cast: function accepts (failureCount, error)
    const result = (retryFn as (failureCount: number, error: unknown) => boolean)(0, networkErr);
    expect(result).toBe(true);
  });

  it('retry function returns false for validation errors', () => {
    const defaults = queryClient.getDefaultOptions();
    const retryFn = defaults.queries?.retry;
    expect(typeof retryFn).toBe('function');

    const validationErr = new ApiError({
      kind: 'validation',
      message: 'Bad request',
      issues: [{ path: 'email', message: 'Invalid' }],
      correlationId: 'test',
    });

    const result = (retryFn as (failureCount: number, error: unknown) => boolean)(0, validationErr);
    expect(result).toBe(false);
  });

  it('retry function returns false for unauthorized errors', () => {
    const defaults = queryClient.getDefaultOptions();
    const retryFn = defaults.queries?.retry;
    expect(typeof retryFn).toBe('function');

    const unauthErr = new ApiError({
      kind: 'unauthorized',
      message: 'Please sign in',
      correlationId: 'test',
    });

    const result = (retryFn as (failureCount: number, error: unknown) => boolean)(0, unauthErr);
    expect(result).toBe(false);
  });

  it('retry function stops after MAX_RQ_RETRIES', () => {
    const defaults = queryClient.getDefaultOptions();
    const retryFn = defaults.queries?.retry;
    expect(typeof retryFn).toBe('function');

    const networkErr = new ApiError({
      kind: 'network',
      message: 'Offline',
      cause: new Error('fetch failed'),
      correlationId: 'test',
    });

    // At failureCount = 3 (which is >= MAX_RQ_RETRIES = 3) it should return false
    const result = (retryFn as (failureCount: number, error: unknown) => boolean)(3, networkErr);
    expect(result).toBe(false);
  });
});