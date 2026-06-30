/**
 * lazyRoute — lazy import factory tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §30
 */
import { describe, expect, it } from 'vitest';

import { lazyRoute } from './lazy';

describe('lazyRoute', () => {
  it('returns a loader function', () => {
    const loader = lazyRoute(() => Promise.resolve({ default: () => null }));
    expect(loader).toBeInstanceOf(Function);
  });

  it('resolves to an object with Component from default export', async () => {
    const MockComponent = () => null;
    const loader = lazyRoute(() => Promise.resolve({ default: MockComponent }));
    const result = await loader();
    expect(result.Component).toBe(MockComponent);
  });

  it('resolves to null for missing export', async () => {
    const loader = lazyRoute(() => Promise.resolve({}));
    const result = await loader();
    expect(result.Component).toBeNull();
  });

  it('resolves to a named export when exportName is specified', async () => {
    const MockPage = () => null;
    const loader = lazyRoute(() => Promise.resolve({ DashboardPage: MockPage }), 'DashboardPage');
    const result = await loader();
    expect(result.Component).toBe(MockPage);
  });

  it('resolves to null for missing named export', async () => {
    const loader = lazyRoute(() => Promise.resolve({ OtherPage: () => null }), 'MissingPage');
    const result = await loader();
    expect(result.Component).toBeNull();
  });
});
