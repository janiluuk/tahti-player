import { ImageIcon, UploadCloudIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { uploadUserMediaFile } from '../api/user-media';
import { cn } from '../lib/cn';
import { IMAGE_UPLOAD_ACCEPT_ATTR } from '../lib/imageUploadContentType';
import { ImageSlotDeleteBadge } from './imageSlot/ImageSlotDeleteBadge';
import { ImageSlotPreviewDialog } from './imageSlot/ImageSlotPreviewDialog';
import { useImageSlotChrome } from './imageSlot/useImageSlotChrome';

type UploadResult =
  { ok: true; data: { url: string } } | { ok: false; error: string };

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  /** Used for aria labels and the success toast. */
  label: string;
  /** Tailwind size classes for the circle — defaults to a compact form-field size. */
  sizeClassName?: string;
  className?: string;
  /** Overrides the default generic media upload — e.g. a track's own
   * banner-upload endpoint instead of the shared user-media bucket. */
  upload?: (file: File) => Promise<UploadResult>;
};

/** A single round, clickable image slot — shows the uploaded image (or a
 * placeholder icon when none is set). An empty slot opens the OS file
 * picker directly on click (no intermediate "choose image" modal — one
 * click, not two, and no dialog-in-dialog conflict when used inside
 * another modal). A set slot opens a large preview instead, with hover
 * delete (X) and Change/Delete actions in the preview. */
export function RoundImageUploadButton({
  value,
  onChange,
  label,
  sizeClassName = 'h-16 w-16',
  className,
  upload = uploadUserMediaFile,
}: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chrome = useImageSlotChrome({ onClear: () => onChange('') });

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    setBusy(true);
    try {
      const result = await upload(file);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange(result.data.url);
      toast.success(`${label} updated.`);
    } catch {
      toast.error(`Could not upload the ${label.toLowerCase()}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('group relative inline-flex', className)}>
      <button
        type="button"
        onClick={() =>
          !busy && (value ? chrome.openPreview() : inputRef.current?.click())
        }
        disabled={busy}
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
        className={cn(
          'border-border bg-background-secondary flex items-center justify-center overflow-hidden rounded-full border-2',
          sizeClassName,
        )}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon
            size={20}
            aria-hidden
            className="text-foreground-secondary"
          />
        )}
      </button>
      {value ? (
        <ImageSlotDeleteBadge label={label} onClick={chrome.requestDelete} />
      ) : (
        <div className="bg-background/80 text-foreground pointer-events-none absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100">
          <UploadCloudIcon size={18} aria-hidden />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT_ATTR}
        disabled={busy}
        className="sr-only"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <ImageSlotPreviewDialog
        isOpen={chrome.previewOpen}
        onClose={chrome.closePreview}
        label={label}
        src={value}
        onChangeClick={() => {
          chrome.closePreview();
          inputRef.current?.click();
        }}
        confirmOpen={chrome.confirmOpen}
        clearing={chrome.clearing}
        onRequestDelete={chrome.requestDelete}
        onCancelDelete={chrome.cancelDelete}
        onConfirmDelete={chrome.confirmDelete}
      />
    </div>
  );
}
