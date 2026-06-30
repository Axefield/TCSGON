/**
 * Vitest global setup — runs before every test file.
 * Extends `expect` with jest-dom matchers per @testing-library/jest-dom.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// RTL auto-cleanup: unmount + cleanup DOM after each test.
afterEach(() => {
  cleanup();
});