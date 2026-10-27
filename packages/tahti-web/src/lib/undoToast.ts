import { toast } from 'sonner';

const UNDO_TOAST_DURATION_MS = 8000;

type UndoFailure = { ok: false; error: string };

/** Success toast with an Undo action. Undo runs `undo`, then `onUndone` and
 * a confirmation toast, or an error toast when the API refuses. */
export function toastWithUndo<T extends { ok: true }>(
  message: string,
  options: {
    undo: () => Promise<T | UndoFailure>;
    undoneMessage: string;
    onUndone?: (result: T) => void;
  },
): void {
  toast.success(message, {
    duration: UNDO_TOAST_DURATION_MS,
    action: {
      label: 'Undo',
      onClick: () => {
        void options
          .undo()
          .then((result) => {
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            options.onUndone?.(result);
            toast.success(options.undoneMessage);
          })
          .catch((failure: unknown) =>
            toast.error(
              failure instanceof Error ? failure.message : 'Could not undo.',
            ),
          );
      },
    },
  });
}
