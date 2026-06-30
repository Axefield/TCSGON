/**
 * breadcrumbs — derive breadcrumb trail from route matches.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10
 *
 * Each route adds a `handle: { crumb: string | ((data) => string) }` property.
 * This pure function walks match handles to build the trail.
 */
import type { UIMatch } from 'react-router-dom';

export interface BreadcrumbEntry {
  readonly path: string;
  readonly label: string;
  readonly isLast: boolean;
}

export interface CrumbHandle {
  crumb: string | ((...args: unknown[]) => string);
}

/**
 * Derive a breadcrumb trail from React Router UI matches.
 */
export function deriveBreadcrumbs(matches: UIMatch<unknown, CrumbHandle>[]): BreadcrumbEntry[] {
  const crumbs: BreadcrumbEntry[] = [];

  for (const match of matches) {
    const handle = match.handle as CrumbHandle | undefined;
    if (!handle?.crumb) continue;

    const label = typeof handle.crumb === 'function' ? handle.crumb(match.data) : handle.crumb;
    crumbs.push({
      path: match.pathname,
      label,
      isLast: false,
    });
  }

  if (crumbs.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- length > 0 guarantees existence
    const last = crumbs[crumbs.length - 1]!;
    crumbs[crumbs.length - 1] = { isLast: true, path: last.path, label: last.label };
  }

  return crumbs;
}
