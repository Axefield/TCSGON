/**
 * MSW test server — shared between unit tests and E2E Playwright tests.
 *
 * Usage in Vitest (via `src/test-setup.ts`):
 *   import { server } from '@/test/msw/server'; // if aliased
 *   beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 *
 * Usage in Playwright:
 *   import { server } from '../test/msw/server';
 *   // Page.route-based interception, or use MSW's browser integration.
 *
 * @see docs/plans/phase-2-data-and-features.md §8.2
 */
import { setupServer } from 'msw/node';

import { handlers } from './handlers';

export const server = setupServer(...handlers);
