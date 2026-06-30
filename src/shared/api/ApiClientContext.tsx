/**
 * ApiClientContext — provides the typed API client to the component tree.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §4, §6
 * @see docs/plans/phase-1-review-remediation.md §4
 *
 * Replaces the module-level mutable singleton in `useAuth` (review finding #4).
 * The client is created once in `main.tsx` and injected via context so every
 * consumer can `useApiClient()` without module-level side effects.
 */
import { createContext, useContext, type ReactElement, type ReactNode } from 'react';

import type { ApiClient } from './client';

const ApiClientContext = createContext<ApiClient | null>(null);

export interface ApiClientProviderProps {
  readonly client: ApiClient;
  readonly children: ReactNode;
}

export function ApiClientProvider({ client, children }: ApiClientProviderProps): ReactElement {
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
}

/**
 * Retrieve the API client from context.
 * Must be called within an `<ApiClientProvider>`.
 */
export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error(
      'useApiClient must be used within an <ApiClientProvider>. ' +
      'Wrap your app root with <ApiClientProvider client={...}>.',
    );
  }
  return client;
}
