/**
 * Modal types — used by uiSlice for modal registry.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §21
 */
import type { ModalId } from './brand';

export interface ModalEntry {
  readonly id: ModalId;
  readonly kind: string;
  readonly title?: string;
  readonly props?: Readonly<Record<string, unknown>>;
}
