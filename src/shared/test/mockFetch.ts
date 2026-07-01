/**
 * Test utilities for mocking fetch responses.
 *
 * Phase 2b+: MSW's setupServer does not intercept native `fetch` in the
 * jsdom environment on Node.js 24+. Use `mockFetchResponse` / `mockFetchError`
 * instead of MSW for unit tests that exercise the API client.
 *
 * @example
 *   import { mockFetchResponse } from '@/shared/test/mockFetch';
 *   beforeEach(() => mockFetchResponse({ data: 42 }));
 *   afterEach(() => vi.restoreAllMocks());
 */
import { type MockInstance, vi } from 'vitest';

export interface MockResponseOptions {
  readonly status?: number;
  readonly headers?: Record<string, string>;
}

function createMockResponse(
  body: unknown,
  { status = 200, headers = { 'content-type': 'application/json' } }: MockResponseOptions = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

type FetchSpy = MockInstance<typeof globalThis.fetch>;

/**
 * Mock the next `fetch` call to return a successful JSON response.
 *
 * @param body — The body to return as JSON.
 * @param options — Optional status code and headers.
 * @returns The spy instance (call `mockRestore()` in afterEach).
 *
 * @example
 *   const fetchSpy = mockFetchResponse({ id: 1 });
 *   // ... test code ...
 *   fetchSpy.mockRestore();
 */
export function mockFetchResponse(
  body: unknown,
  options?: MockResponseOptions,
): FetchSpy {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(createMockResponse(body, options));
}

/**
 * Mock the next `fetch` call to return an error response.
 *
 * @param status — HTTP status code (default 500).
 * @param body — Optional error body.
 * @returns The spy instance.
 */
export function mockFetchError(
  status: number = 500,
  body: unknown = null,
): FetchSpy {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    createMockResponse(body, { status, headers: { 'content-type': 'application/json' } }),
  );
}

/**
 * Mock the next `fetch` call to reject with a network error.
 *
 * @returns The spy instance.
 */
export function mockFetchNetworkError(): FetchSpy {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
}

/**
 * Create a `Response`-like object for chaining multiple fetch calls.
 *
 * @example
 *   const fetchSpy = vi.spyOn(globalThis, 'fetch');
 *   fetchSpy
 *     .mockResolvedValueOnce(buildFetchResponse({ data: 1 }))
 *     .mockResolvedValueOnce(buildFetchResponse({ data: 2 }));
 */
export function buildFetchResponse(
  body: unknown,
  { status = 200, headers = { 'content-type': 'application/json' } }: MockResponseOptions = {},
): Response {
  return createMockResponse(body, { status, headers });
}
