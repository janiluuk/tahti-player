import { UploadIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, FilePicker } from '@tahti-player/ui';

import { uploadUserMediaFile } from '../api/user-media';

type Props = {
  isOpen: boolean;
  label: string;
  onClose: () => void;
  onUploaded: (url: string) => void;
};

/** Opened from the hover-upload icon on an artwork preset's preview
 * thumbnail — replaces that preset's image in place. */
export function ArtworkPresetUploadDialog({
  isOpen,
  label,
  onClose,
  onUploaded,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setFile(null);
    setBusy(false);
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!file) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await uploadUserMediaFile(file);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onUploaded(result.data.url);
    handleClose();
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={handleClose}>
      <Dialog.Title>
        <span className="inline-flex items-center gap-2">
          <UploadIcon size={18} aria-hidden />
          Replace {label}
        </span>
      </Dialog.Title>
      <Dialog.Description>
        Upload a square JPG, PNG, WebP, or GIF to replace this preset.
      </Dialog.Description>
      <div className="mt-4">
        <FilePicker
          labels={{
            title: 'Image',
            description: 'JPG, PNG, WebP, or GIF',
            browse: file ? 'Choose another image' : 'Choose image',
          }}
          accept="image/jpeg,image/png,image/webp,image/gif"
          selectedFiles={file ? [file] : []}
          disabled={busy}
          onFiles={(files) => setFile(files[0] ?? null)}
        />
        {error && (
          <p className="text-accent-red-strong mt-2 text-sm" role="alert">
            {error}
          </p>
        )}
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button onClick={() => void submit()} disabled={busy || !file}>
          <UploadIcon size={16} aria-hidden className="mr-1.5" />
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
