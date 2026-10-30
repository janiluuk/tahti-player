import { UploadIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, FilePicker, InlineError } from '@tahti-player/ui';

import { uploadUserMediaFile } from '../api/user-media';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (url: string) => void;
};

/** Uploads a new image for Admin → Artwork presets. */
export function ArtworkPresetUploadDialog({
  isOpen,
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
          Add artwork
        </span>
      </Dialog.Title>
      <Dialog.Description>
        Upload a square JPG, PNG, WebP, or GIF.
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
        {error && <InlineError className="mt-2">{error}</InlineError>}
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
