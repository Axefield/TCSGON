/**
 * ApiClientContext tests.
 */
import { render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ApiClientProvider, useApiClient } from './ApiClientContext';
import { createApiClient } from './client';

const testClient = createApiClient({ baseUrl: 'http://test.local' });

function TestConsumer(): ReactElement {
  // Calling useApiClient() should not throw when inside the provider.
  useApiClient();
  return <div data-testid="consumer">ok</div>;
}

describe('ApiClientProvider', () => {
  it('provides the client via useApiClient', () => {
    render(
      <ApiClientProvider client={testClient}>
        <TestConsumer />
      </ApiClientProvider>,
    );
    expect(screen.getByTestId('consumer')).toHaveTextContent('ok');
  });

  it('throws when useApiClient is used outside provider', () => {
    // Suppress console.error from the caught error boundary.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useApiClient must be used within an <ApiClientProvider>',
    );
    spy.mockRestore();
  });
});
