/**
 * React Query client — Phase 1 default config.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §6 (retry policy)
 *
 * Retry classifier: re-uses the same retriability rules as the fetch wrapper,
 * but is owned by React Query. The client itself does NOT retry (per §6 — one
 * retry layer only). RQ retries up to 3 times on retriable errors.
 */
import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './errors';

const MAX_RQ_RETRIES = 3;

function isRetriable(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  switch (err.detail.kind) {
    case 'network':
    case 'timeout':
      return true;
    case 'http':
      return err.detail.status === 502 || err.detail.status === 503 || err.detail.status === 504;
    case 'aborted':
    case 'validation':
    case 'unauthorized':
      return false;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 5, // 5 min
      retry: (failureCount, error) => isRetriable(error) && failureCount < MAX_RQ_RETRIES,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});
