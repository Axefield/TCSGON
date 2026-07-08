import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from './Button';
import { ErrorBoundary } from './ErrorBoundary';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

function ThrowOnRender({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Something went wrong in this component.');
  }
  return <p>Component rendered successfully.</p>;
}

export const DefaultFallback: Story = {
  render: function DefaultFallbackStory() {
    const [throwError, setThrowError] = useState(true);

    return (
      <ErrorBoundary
        onReset={() => { setThrowError(true); }}
      >
        <ThrowOnRender shouldThrow={throwError} />
      </ErrorBoundary>
    );
  },
};

export const WithCustomFallbackNode: Story = {
  render: function CustomFallbackNodeStory() {
    const [throwError, setThrowError] = useState(true);

    return (
      <ErrorBoundary
        fallback={<div role="alert" style={{ padding: 24, border: '2px solid #e00', borderRadius: 8, textAlign: 'center' }}><h2>Custom Error UI</h2><p>A problem occurred.</p></div>}
        onReset={() => { setThrowError(true); }}
      >
        <ThrowOnRender shouldThrow={throwError} />
      </ErrorBoundary>
    );
  },
};

export const WithRenderFunctionFallback: Story = {
  render: function RenderFnFallbackStory() {
    const [throwError, setThrowError] = useState(true);

    return (
      <ErrorBoundary
        fallback={(error, reset) => (
          <div role="alert" style={{ padding: 24, border: '2px solid #e00', borderRadius: 8, textAlign: 'center' }}>
            <h2>Render function fallback</h2>
            <p style={{ color: '#666', marginBottom: 16 }}>{error.message}</p>
            <Button variant="primary" onClick={reset}>Try again</Button>
          </div>
        )}
        onReset={() => { setThrowError(true); }}
      >
        <ThrowOnRender shouldThrow={throwError} />
      </ErrorBoundary>
    );
  },
};

export const NoError: Story = {
  render: function NoErrorStory() {
    return (
      <ErrorBoundary>
        <p>Everything is working fine. No error to display.</p>
      </ErrorBoundary>
    );
  },
};
