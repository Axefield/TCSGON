/**
 * useConfirm — imperative confirm dialog hook.
 *
 * Returns a `confirm()` function that opens a `ConfirmDialog` and resolves
 * a promise with `true` or `false`. The component renders the dialog itself
 * via the returned `<ConfirmDialog>` component.
 *
 * @example
 *   const { confirm, ConfirmDialog } = useConfirm();
 *
 *   const handleDelete = async () => {
 *     const ok = await confirm({
 *       title: 'Delete project?',
 *       message: 'This cannot be undone.',
 *       variant: 'danger',
 *     });
 *     if (ok) deleteMutation.mutate(id);
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleDelete}>Delete</button>
 *       <ConfirmDialog />
 *     </>
 *   );
 */
import { useCallback, useRef, useState, type ReactElement } from 'react';

import { ConfirmDialog, type ConfirmDialogProps } from '@/shared/components/ConfirmDialog';

type ConfirmOptions = Pick<
  ConfirmDialogProps,
  'title' | 'message' | 'confirmLabel' | 'cancelLabel' | 'variant'
>;

interface UseConfirmReturn {
  readonly confirm: (options: ConfirmOptions) => Promise<boolean>;
  readonly ConfirmDialogComponent: () => ReactElement | null;
}

export function useConfirm(): UseConfirmReturn {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
  });
  const [isPending, setIsPending] = useState(false);

  // Store resolve function so it survives re-renders
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(async (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    setIsPending(false);

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setOpen(false);
  }, []);

  const ConfirmDialogComponent = useCallback(
    (): ReactElement | null => (
      <ConfirmDialog
        open={open}
        title={options.title}
        message={options.message}
        {...(options.confirmLabel !== undefined ? { confirmLabel: options.confirmLabel } : {})}
        {...(options.cancelLabel !== undefined ? { cancelLabel: options.cancelLabel } : {})}
        {...(options.variant !== undefined ? { variant: options.variant } : {})}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isPending={isPending}
      />
    ),
    [open, options, handleConfirm, handleCancel, isPending],
  );

  return { confirm, ConfirmDialogComponent };
}
