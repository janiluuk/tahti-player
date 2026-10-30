import { UploadIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  HiddenFileInput,
  ImageThumbnailPicker,
  InlineLoader,
} from '@tahti-player/ui';

import { fetchArtworkPresets } from '../api/artwork-presets';
import { fetchUserMedia, uploadUserMediaFile } from '../api/user-media';
import { IMAGE_UPLOAD_ACCEPT_ATTR } from '../lib/imageUploadContentType';

type UploadResult =
  { ok: true; data: { url: string } } | { ok: false; error: string };

export type CoverArtPickerDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  /** e.g. "Cover art"; titles the dialog and the toasts. */
  label: string;
  value?: string | null;
  /** Saves the chosen image; `source` says whether it was just uploaded or
   * picked from the gallery. Resolve `false` to keep the dialog open. */
  onSelect: (
    url: string,
    source: 'upload' | 'gallery',
  ) => Promise<boolean | void> | boolean | void;
  upload?: (file: File) => Promise<UploadResult>;
  accept?: string;
  extra?: ReactNode;
};

type GalleryState = { status: 'loading' } | { status: 'ready'; urls: string[] };

async function loadGallery(): Promise<string[]> {
  const [presets, media] = await Promise.all([
    fetchArtworkPresets(),
    fetchUserMedia(),
  ]);
  const own = media.data
    .filter((file) => file.contentType.startsWith('image/'))
    .map((file) => file.url);
  return [...new Set([...own, ...presets.data.map((preset) => preset.url)])];
}

/** Upload a new cover, or pick one from the artwork presets combined with
 * the user's own uploaded images. */
export function CoverArtPickerDialog({
  isOpen,
  onClose,
  label,
  value,
  onSelect,
  upload = uploadUserMediaFile,
  accept = IMAGE_UPLOAD_ACCEPT_ATTR,
  extra,
}: CoverArtPickerDialogProps) {
  const [gallery, setGallery] = useState<GalleryState>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    setGallery({ status: 'loading' });
    void loadGallery().then((urls) => {
      if (!cancelled) {
        setGallery({ status: 'ready', urls });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const choose = async (url: string) => {
    setBusy(true);
    try {
      if ((await onSelect(url, 'gallery')) !== false) {
        toast.success(`${label} updated.`);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleFiles = async (files: File[]) => {
    const file = files[0];
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
      if ((await onSelect(result.data.url, 'upload')) !== false) {
        toast.success(`${label} updated.`);
        onClose();
      }
    } catch {
      toast.error(`Could not upload the ${label.toLowerCase()}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      isOpen={isOpen}
      onClose={() => !busy && onClose()}
      className="max-w-xl"
    >
      <Dialog.Title>{label}</Dialog.Title>
      <div className="mt-3 flex flex-col gap-4" data-testid="cover-art-picker">
        <Button
          variant="secondary"
          className="self-start"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon size={16} aria-hidden />
          {busy ? 'Saving…' : 'Upload image'}
        </Button>
        <HiddenFileInput
          ref={inputRef}
          accept={accept}
          disabled={busy}
          onFiles={(files) => void handleFiles(files)}
        />
        {gallery.status === 'loading' ? (
          <InlineLoader label="Loading artwork…" className="py-6" />
        ) : gallery.urls.length > 0 ? (
          <ImageThumbnailPicker
            className="max-h-[50vh] grid-cols-4 gap-2 overflow-y-auto p-0.5 sm:grid-cols-5 lg:grid-cols-5"
            items={gallery.urls.map((url, index) => ({
              id: url,
              imageUrl: url,
              ariaLabel: `Use artwork ${index + 1}`,
            }))}
            selected={value ?? null}
            onSelect={(url) => {
              if (!busy) {
                void choose(url);
              }
            }}
          />
        ) : null}
        {extra}
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
