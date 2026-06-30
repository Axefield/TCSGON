import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client — Phase 0 default config.
 *
 * Defaults are conservative per AGENTS.md §3:
 * - staleTime: 0 (always refetch on mount; tighten per query in Phase 1)
 * - retry: 1 (network failures only; tightened in Phase 1 with error categorization)
 * - refetchOnWindowFocus: true (default, but explicit for clarity)
 *
 * @see https://tanstack.com/query/latest/docs/react/reference/QueryClient
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 5, // 5 min
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});