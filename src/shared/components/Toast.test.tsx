/**
 * Toast component tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { newToastId } from '@/shared/types/brand';
import type { ToastEntry } from '@/shared/types/toast';

import { Toast } from './Toast';

function makeEntry(overrides?: Partial<ToastEntry>): ToastEntry {
  return {
    id: newToastId(),
    kind: 'info',
    message: 'Test message',
    durationMs: 5000,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('Toast', () => {
  it('renders info toast with role="status"', () => {
    render(<Toast entry={makeEntry({ kind: 'info' })} onDismiss={vi.fn()} />);
    const toast = screen.getByRole('status');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent('Test message');
  });

  it('renders success toast with role="status"', () => {
    render(<Toast entry={makeEntry({ kind: 'success' })} onDismiss={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Test message');
  });

  it('renders warning toast with role="status"', () => {
    render(<Toast entry={makeEntry({ kind: 'warning' })} onDismiss={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Test message');
  });

  it('renders error toast with role="alert"', () => {
    render(<Toast entry={makeEntry({ kind: 'error' })} onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Test message');
  });

  it('renders dismiss button and calls onDismiss', () => {
    const entry = makeEntry();
    const onDismiss = vi.fn();
    render(<Toast entry={entry} onDismiss={onDismiss} />);
    const btn = screen.getByRole('button', { name: /dismiss/i });
    btn.click();
    expect(onDismiss).toHaveBeenCalledWith(entry.id);
  });

  it('renders description when provided', () => {
    render(<Toast entry={makeEntry({ description: 'More info' })} onDismiss={vi.fn()} />);
    expect(screen.getByText('More info')).toBeInTheDocument();
  });

  it('has a compound Region export', () => {
    expect(Toast.Region).toBeDefined();
  });
});
