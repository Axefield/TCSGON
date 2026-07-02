/**
 * ReactDOM entry point — Phase 1: Redux → React Query → Router.
 *
 * Per AGENTS.md §3: providers wrap in this order.
 * RootErrorBoundary is inside RouterProvider (route-level),
 * plus a top-level error boundary in AppShell to catch router + render errors.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';

import { App } from '@/App';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { queryClient } from '@/shared/api/queryClient';
import { store } from '@/store';

import '@/styles/reset.css';
import '@/styles/tokens.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

const apiClient = createApiClient({
  baseUrl: '/api',
  getToken: () => {
    const state = store.getState();
    return state.auth.kind === 'authenticated' ? state.auth.session.token : null;
  },
});

createRoot(rootElement).render(
  <StrictMode>
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={apiClient}>
          <App />
        </ApiClientProvider>
      </QueryClientProvider>
    </ReduxProvider>
  </StrictMode>,
);
