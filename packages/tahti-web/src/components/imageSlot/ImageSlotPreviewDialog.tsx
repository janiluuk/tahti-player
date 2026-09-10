import { XIcon } from 'lucide-react';

import { Button, Dialog } from '@tahti-player/ui';

import { ConfirmDialog } from '../ConfirmDialog';

export type ImageSlotFrame = {
  url: string;
  onDelete?: () => void;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  src: string | null | undefined;
  /** Slideshow / multi-image gallery frames shown as a strip below the
   * large preview. Omit for a single-image slot. */
  frames?: ImageSlotFrame[];
  onChangeClick: () => void;
  confirmOpen: boolean;
  clearing: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void | Promise<void>;
};

/** Shared large-preview modal for a "set image" upload slot — Change /
 * Delete actions reuse the slot's own upload flow and toast feedback. */
export function ImageSlotPreviewDialog({
  isOpen,
  onClose,
  label,
  src,
  frames,
  onChangeClick,
  confirmOpen,
  clearing,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: Props) {
  return (
    <>
      <Dialog.Root
        isOpen={isOpen && !confirmOpen}
        onClose={onClose}
        className="max-w-2xl"
      >
        <Dialog.Title>{label}</Dialog.Title>
        <div className="mt-3 flex flex-col gap-3">
          {src ? (
            <img
              src={src}
              alt={label}
              className="border-border bg-background-secondary max-h-[60vh] w-full rounded-md border object-contain"
            />
          ) : null}
          {frames && frames.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {frames.map((frame, index) => (
                <div
                  key={frame.url + index}
                  className="group border-border relative size-16 shrink-0 overflow-hidden rounded-md border"
                >
                  <img
                    src={frame.url}
                    alt=""
                    className="size-full object-cover"
                  />
                  {frame.onDelete ? (
                    <button
                      type="button"
                      aria-label="Remove image"
                      title="Remove image"
                      className="bg-background/90 text-foreground hover:bg-accent-red absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-white"
                      onClick={frame.onDelete}
                    >
                      <XIcon size={12} aria-hidden />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <Dialog.Actions>
          <Button variant="secondary" onClick={onRequestDelete}>
            Delete
          </Button>
          <Button onClick={onChangeClick} variant="secondary">
            Change
          </Button>
        </Dialog.Actions>
      </Dialog.Root>

      <ConfirmDialog
        isOpen={confirmOpen}
        title={`Remove ${label.toLowerCase()}?`}
        description="This can't be undone from here — you'll need to upload a new image to replace it."
        confirmLabel={clearing ? 'Removing…' : 'Remove'}
        onCancel={onCancelDelete}
        onConfirm={() => void onConfirmDelete()}
      />
    </>
  );
}
