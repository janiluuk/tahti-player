import { useState } from 'react';
import { toast } from 'sonner';

import { Button, FilePicker } from '@tahti-player/ui';

import { uploadUserMediaFile } from '../api/user-media';
import { IMAGE_UPLOAD_ACCEPT_ATTR } from '../lib/imageUploadContentType';
import { ImageSlotDeleteBadge } from './imageSlot/ImageSlotDeleteBadge';
import { ImageSlotPreviewDialog } from './imageSlot/ImageSlotPreviewDialog';
import { useImageSlotChrome } from './imageSlot/useImageSlotChrome';

type Props = {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function ImageUploadField({
  label,
  description,
  value,
  onChange,
  className,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chrome = useImageSlotChrome({ onClear: () => onChange('') });

  const handleFiles = async (files: readonly File[]) => {
    const selected = files[0];
    if (!selected) {
      return;
    }
    setFile(selected);
    setError(null);
    setBusy(true);
    const result = await uploadUserMediaFile(selected);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    onChange(result.data.url);
    toast.success(`${label} updated.`);
  };

  return (
    <div className={className}>
      <FilePicker
        labels={{
          title: label,
          description,
          browse: file ? 'Choose another image' : 'Choose image',
        }}
        accept={IMAGE_UPLOAD_ACCEPT_ATTR}
        selectedFiles={file ? [file] : []}
        disabled={busy}
        onFiles={handleFiles}
      />
      {value ? (
        <div className="group relative mt-2 inline-block">
          <Button
            variant="plain"
            size="flexible"
            type="button"
            onClick={chrome.openPreview}
            aria-label={`Preview ${label.toLowerCase()}`}
            title={`Preview ${label.toLowerCase()}`}
            className="block rounded-none whitespace-normal active:scale-100"
          >
            <img
              src={value}
              alt={`${label} preview`}
              className="h-20 w-20 rounded-md object-cover"
            />
          </Button>
          <ImageSlotDeleteBadge label={label} onClick={chrome.requestDelete} />
        </div>
      ) : null}
      {error ? (
        <p className="text-accent-red-strong mt-1 text-xs">{error}</p>
      ) : null}
      <ImageSlotPreviewDialog
        isOpen={chrome.previewOpen}
        onClose={chrome.closePreview}
        label={label}
        src={value}
        onChangeClick={chrome.closePreview}
        confirmOpen={chrome.confirmOpen}
        clearing={chrome.clearing}
        onRequestDelete={chrome.requestDelete}
        onCancelDelete={chrome.cancelDelete}
        onConfirmDelete={chrome.confirmDelete}
      />
    </div>
  );
}
