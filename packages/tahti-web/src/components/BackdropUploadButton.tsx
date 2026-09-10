import { ImageIcon, UploadCloudIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Dialog, FilePicker } from '@tahti-player/ui';

import { uploadUserMediaFile } from '../api/user-media';
import { cn } from '../lib/cn';
import { ImageSlotDeleteBadge } from './imageSlot/ImageSlotDeleteBadge';
import { ImageSlotPreviewDialog } from './imageSlot/ImageSlotPreviewDialog';
import { useImageSlotChrome } from './imageSlot/useImageSlotChrome';

type UploadResult =
  | { ok: true; data: { url: string } }
  | { ok: false; error: string };

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  /** Used for aria labels, dialog copy, and the success toast. */
  label: string;
  className?: string;
  /** Overrides the default generic media upload. */
  upload?: (file: File) => Promise<UploadResult>;
  /** Renders as an absolutely-positioned full-bleed layer instead of the
   * default wide aspect-[3/1] banner box — for use as a background behind
   * other content in a `relative` parent. */
  fill?: boolean;
};

/** A wide, clickable backdrop slot — same click-to-upload-modal idiom as
 * RoundImageUploadButton, but a rectangular banner shape with a plain
 * placeholder when empty instead of a round avatar. */
export function BackdropUploadButton({
  value,
  onChange,
  label,
  className,
  upload = uploadUserMediaFile,
  fill = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const chrome = useImageSlotChrome({ onClear: () => onChange('') });

  const handleFiles = async (files: readonly File[]) => {
    const file = files[0];
    if (!file) {
      return;
    }
    setBusy(true);
    const result = await upload(file);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange(result.data.url);
    toast.success(`${label} updated.`);
    setOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          'group overflow-hidden',
          fill
            ? 'absolute inset-0 size-full rounded-none'
            : 'relative aspect-[3/1] w-full rounded-xl',
          className,
        )}
      >
        <button
          type="button"
          onClick={() => (value ? chrome.openPreview() : setOpen(true))}
          aria-label={
            value
              ? `Preview ${label.toLowerCase()}`
              : `Change ${label.toLowerCase()}`
          }
          title={
            value
              ? `Preview ${label.toLowerCase()}`
              : `Change ${label.toLowerCase()}`
          }
          className="border-border bg-background-secondary flex size-full items-center justify-center overflow-hidden border"
        >
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon
              size={28}
              aria-hidden
              className="text-foreground-secondary"
            />
          )}
          {value ? null : (
            <div className="bg-background/80 text-foreground pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <UploadCloudIcon size={22} aria-hidden />
            </div>
          )}
        </button>
        {value ? (
          <ImageSlotDeleteBadge label={label} onClick={chrome.requestDelete} />
        ) : null}
      </div>

      <ImageSlotPreviewDialog
        isOpen={chrome.previewOpen}
        onClose={chrome.closePreview}
        label={label}
        src={value}
        onChangeClick={() => {
          chrome.closePreview();
          setOpen(true);
        }}
        confirmOpen={chrome.confirmOpen}
        clearing={chrome.clearing}
        onRequestDelete={chrome.requestDelete}
        onCancelDelete={chrome.cancelDelete}
        onConfirmDelete={chrome.confirmDelete}
      />

      <Dialog.Root
        isOpen={open}
        onClose={() => {
          if (!busy) {
            setOpen(false);
          }
        }}
        className="max-w-md"
      >
        <Dialog.Title>{label}</Dialog.Title>
        <Dialog.Description>
          Wide JPEG, PNG, or WebP. Uploads immediately once selected.
        </Dialog.Description>
        <div className="mt-4">
          <FilePicker
            labels={{
              title: label,
              description: 'Wide JPEG, PNG, or WebP',
              browse: busy ? 'Uploading…' : 'Choose image',
            }}
            accept="image/jpeg,image/png,image/webp"
            selectedFiles={[]}
            disabled={busy}
            onFiles={(files) => void handleFiles(Array.from(files))}
          />
        </div>
      </Dialog.Root>
    </>
  );
}
