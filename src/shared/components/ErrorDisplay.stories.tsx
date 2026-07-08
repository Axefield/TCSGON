import type { Meta, StoryObj } from '@storybook/react';

import { ApiError } from '@/shared/api/errors';

import { ErrorDisplay } from './ErrorDisplay';

function makeError(kind: ApiError['detail']['kind'], overrides: Partial<ApiError['detail']> = {}): ApiError {
  const base = { kind, message: '', correlationId: 'abc-123', ...overrides };
  switch (kind) {
    case 'http':
      return new ApiError({ ...base, kind: 'http', status: 500, body: null } as ApiError['detail']);
    case 'network':
      return new ApiError({ ...base, kind: 'network' } as ApiError['detail']);
    case 'timeout':
      return new ApiError({ ...base, kind: 'timeout', timeoutMs: 30000 } as ApiError['detail']);
    case 'aborted':
      return new ApiError({ ...base, kind: 'aborted' } as ApiError['detail']);
    case 'validation':
      return new ApiError({ ...base, kind: 'validation', issues: [{ path: 'email', message: 'Invalid email' }] } as ApiError['detail']);
    case 'unauthorized':
      return new ApiError({ ...base, kind: 'unauthorized' } as ApiError['detail']);
  }
}

const meta: Meta<typeof ErrorDisplay> = {
  title: 'Components/ErrorDisplay',
  component: ErrorDisplay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorDisplay>;

export const HttpError: Story = {
  args: {
    error: makeError('http', { status: 500 }),
    title: 'Failed to load data',
  },
};

export const NetworkError: Story = {
  args: {
    error: makeError('network'),
    title: 'Connection lost',
  },
};

export const TimeoutError: Story = {
  args: {
    error: makeError('timeout'),
    title: 'Request timed out',
  },
};

export const ValidationError: Story = {
  args: {
    error: makeError('validation'),
    title: 'Validation failed',
  },
};

export const Unauthorized: Story = {
  args: {
    error: makeError('unauthorized'),
    title: 'Session expired',
  },
};

export const WithRetry: Story = {
  args: {
    error: makeError('http', { status: 503 }),
    title: 'Service unavailable',
    onRetry: () => {},
  },
};

export const NoTitle: Story = {
  args: {
    error: makeError('network'),
  },
};

export const NotFound: Story = {
  args: {
    error: makeError('http', { status: 404 }),
    title: 'Not found',
    onRetry: () => {},
  },
};

export const NullError: Story = {
  args: {
    error: null,
    title: 'Should not render',
  },
};
