/**
 * deriveBreadcrumbs tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10
 */
import type { UIMatch } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { deriveBreadcrumbs, type CrumbHandle } from './breadcrumbs';

describe('deriveBreadcrumbs', () => {
  it('returns empty array for empty matches', () => {
    expect(deriveBreadcrumbs([])).toEqual([]);
  });

  it('returns empty array when no matches have crumb handles', () => {
    const matches = [
      { id: '0', pathname: '/', data: {}, handle: {} },
    ] as UIMatch<unknown, CrumbHandle>[];
    expect(deriveBreadcrumbs(matches)).toEqual([]);
  });

  it('derives a single crumb from a string handle', () => {
    const matches = [
      { id: '0', pathname: '/', data: {}, handle: { crumb: 'Home' } },
    ] as UIMatch<unknown, CrumbHandle>[];
    const crumbs = deriveBreadcrumbs(matches);
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0]).toEqual({ path: '/', label: 'Home', isLast: true });
  });

  it('derives multiple crumbs with isLast only on the last', () => {
    const matches = [
      { id: '0', pathname: '/', data: {}, handle: { crumb: 'Home' } },
      { id: '1', pathname: '/users', data: {}, handle: { crumb: 'Users' } },
    ] as UIMatch<unknown, CrumbHandle>[];
    const crumbs = deriveBreadcrumbs(matches);
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0]).toEqual({ path: '/', label: 'Home', isLast: false });
    expect(crumbs[1]).toEqual({ path: '/users', label: 'Users', isLast: true });
  });

  it('supports function crumb handles', () => {
    const matches = [
      { id: '0', pathname: '/users/42', data: { userName: 'Alice' }, handle: { crumb: (data: { userName: string }) => data.userName } },
    ] as unknown as UIMatch<unknown, CrumbHandle>[];
    const crumbs = deriveBreadcrumbs(matches);
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0]?.label).toBe('Alice');
  });

  it('skips matches without crumb in handle', () => {
    const matches = [
      { id: '0', pathname: '/', data: {}, handle: { crumb: 'Home' } },
      { id: '1', pathname: '/skip', data: {}, handle: {} },
      { id: '2', pathname: '/target', data: {}, handle: { crumb: 'Target' } },
    ] as UIMatch<unknown, CrumbHandle>[];
    const crumbs = deriveBreadcrumbs(matches);
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0]?.path).toBe('/');
    expect(crumbs[1]?.path).toBe('/target');
  });
});
