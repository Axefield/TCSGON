// ReactDOM entry point — Phase 0 minimal shell.
// Per AGENTS.md §3: providers wrap in the documented order (Redux -> RQ -> Router).
// Router is added in Phase 1; theme context in Phase 1; suspense/error boundary in Phase 1.

import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';

import { App } from '@/App';
import { queryClient } from '@/shared/api/queryClient';
import { store } from '@/store';

import '@/styles/reset.css';
import '@/styles/tokens.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ReduxProvider>
  </StrictMode>,
);