/**
 * Vitest global setup — runs before every test file.
 * Extends `expect` with jest-dom matchers per @testing-library/jest-dom.
 *
 * Phase 2a adds MSW server lifecycle so all tests get automatic handler
 * registration. Individual tests override via `server.use()`.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@test/msw/server';

// MSW lifecycle — start before all tests, reset between each, stop after all.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// RTL auto-cleanup: unmount + cleanup DOM after each test.
afterEach(() => {
  cleanup();
});
