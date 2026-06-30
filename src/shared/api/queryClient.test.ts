import { describe, expect, it } from 'vitest';

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
    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(true);
    expect(defaults.queries?.refetchOnReconnect).toBe(true);
    expect(defaults.mutations?.retry).toBe(0);
  });
});