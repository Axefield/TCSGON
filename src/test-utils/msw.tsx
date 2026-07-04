/**
 * MSW test server helpers.
 *
 * Wraps the shared MSW server with convenience methods for per-test
 * handler overrides and resets.
 *
 * @packageDocumentation
 */

import type { HttpHandler } from 'msw';

import { server as mswServer } from '@test/msw/server';

import type { MSWHelpers } from './types';

/**
 * Shared MSW server instance (singleton from `test/msw/server.ts`).
 */
export const server = mswServer;

/**
 * Convenience helpers for working with MSW in tests.
 *
 * @example
 *   import { msw } from '@/test-utils/msw';
 *
 *   test('handles 401', () => {
 *     msw.use(http.get('/api/me', () => HttpResponse.json(null, { status: 401 })));
 *     // ... test
 *     msw.reset();
 *   });
 */
export const msw: MSWHelpers = {
  server: mswServer,
  reset: () => mswServer.resetHandlers(),
  use: (...handlers: HttpHandler[]) => mswServer.use(...handlers),
};

/**
 * Create a deferred response promise for testing loading states.
 * Resolves the response after a controllable delay.
 *
 * @param delay - Delay in milliseconds before resolving.
 * @param responseFactory - Factory returning the response to send.
 *
 * @example
 *   test('shows loading spinner', async () => {
 *     const deferred = createDeferredResponse(500, () =>
 *       HttpResponse.json({ data: 'done' })
 *     );
 *     msw.use(http.get('/api/slow', deferred));
 *     render(<MyComponent />);
 *     expect(screen.getByRole('progressbar')).toBeInTheDocument();
 *   });
 */
export function createDeferredResponse<T>(
  delay: number,
  responseFactory: () => T,
): () => Promise<T> {
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return responseFactory();
  };
}

/**
 * Create a mock error response with a given status code and body.
 *
 * @param status - HTTP status code.
 * @param body - Optional response body.
 *
 * @example
 *   import { http, HttpResponse } from 'msw';
 *   import { createErrorResponse } from '@/test-utils/msw';
 *
 *   msw.use(http.get('/api/data', () => createErrorResponse(500, { message: 'Server error' })));
 */
export function createErrorResponse(
  status: number,
  body?: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify(body ?? { message: `Error ${status}` }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
