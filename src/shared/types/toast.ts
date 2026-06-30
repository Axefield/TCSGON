/**
 * Toast types — used by uiSlice and useToast hook.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §16, §17
 */
import type { ToastId } from './brand';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface ToastEntry {
  readonly id: ToastId;
  readonly kind: ToastKind;
  readonly message: string;
  readonly description?: string;
  readonly durationMs?: number;
  readonly createdAt: number;
}
