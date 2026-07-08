import type { Preview } from '@storybook/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

import { authReducer } from '@/features/auth/slice/authSlice';
import { uiReducer } from '@/store/slices/uiSlice';

import '@/styles/reset.css';
import '@/styles/tokens.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <React.StrictMode>
        <ReduxProvider store={store}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div style={{ padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
                <Story />
              </div>
            </BrowserRouter>
          </QueryClientProvider>
        </ReduxProvider>
      </React.StrictMode>
    ),
  ],
  parameters: {
    controls: { expanded: true },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
        ],
      },
    },
  },
};

export default preview;
