/**
 * useToast — programmatic toast notifications.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §11, §37
 *
 * Usage:
 * ```ts
 * const toast = useToast();
 * toast.info('Saved!');
 * toast.error('Network error', { description: 'Please try again.' });
 * toast.dismiss(someId);
 * toast.clear();
 * ```
 */
import { useCallback } from 'react';

import { newToastId } from '@/shared/types/brand';
import type { ToastId } from '@/shared/types/brand';
import type { ToastEntry, ToastKind } from '@/shared/types/toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearToasts,
  dismissToast,
  pushToast,
  selectToasts,
} from '@/store/slices/uiSlice';

export interface PushInput {
  readonly kind: ToastKind;
  readonly message: string;
  readonly description?: string;
  readonly durationMs?: number;
}

export interface UseToastResult {
  readonly toasts: ReadonlyArray<ToastEntry>;
  readonly push: (input: PushInput) => ToastId;
  readonly dismiss: (id: ToastId) => void;
  readonly clear: () => void;
  readonly info: (message: string, opts?: { readonly description?: string }) => ToastId;
  readonly success: (message: string, opts?: { readonly description?: string }) => ToastId;
  readonly warning: (message: string, opts?: { readonly description?: string }) => ToastId;
  readonly error: (message: string, opts?: { readonly description?: string }) => ToastId;
}

const DEFAULT_DURATION_MS = 5000;

export function useToast(): UseToastResult {
  const toasts = useAppSelector(selectToasts);
  const dispatch = useAppDispatch();

  const push = useCallback(
    (input: PushInput): ToastId => {
      const id = newToastId();
      const entry: ToastEntry = {
        id,
        kind: input.kind,
        message: input.message,
        createdAt: Date.now(),
        durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
        ...(input.description !== undefined ? { description: input.description } : {}),
      };
      dispatch(pushToast(entry));
      return id;
    },
    [dispatch],
  );

  const dismiss = useCallback(
    (id: ToastId) => {
      dispatch(dismissToast(id));
    },
    [dispatch],
  );

  const clear = useCallback(() => {
    dispatch(clearToasts());
  }, [dispatch]);

  const info = useCallback(
    (message: string, opts?: { readonly description?: string }) =>
      push({
        kind: 'info',
        message,
        ...(opts?.description !== undefined ? { description: opts.description } : {}),
      }),
    [push],
  );

  const success = useCallback(
    (message: string, opts?: { readonly description?: string }) =>
      push({
        kind: 'success',
        message,
        ...(opts?.description !== undefined ? { description: opts.description } : {}),
      }),
    [push],
  );

  const warning = useCallback(
    (message: string, opts?: { readonly description?: string }) =>
      push({
        kind: 'warning',
        message,
        ...(opts?.description !== undefined ? { description: opts.description } : {}),
      }),
    [push],
  );

  const error = useCallback(
    (message: string, opts?: { readonly description?: string }) =>
      push({
        kind: 'error',
        message,
        ...(opts?.description !== undefined ? { description: opts.description } : {}),
      }),
    [push],
  );

  return { toasts, push, dismiss, clear, info, success, warning, error };
}
