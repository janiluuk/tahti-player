import { Link } from '@tanstack/react-router';
import { UploadIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, FilePicker, Input } from '@tahti-player/ui';

import { uploadSoundFile } from '../api/studio';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUploaded?: (itemId: string) => void;
};

export function UploadTrackDialog({ isOpen, onClose, onUploaded }: Props) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setFile(null);
    setBusy(false);
    setError(null);
    setNote(null);
    setItemId(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!file) {
      setError('Choose an audio file.');
      return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    const result = await uploadSoundFile({ file, title: title || file.name });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItemId(result.itemId);
    onUploaded?.(result.itemId);
    setNote('Upload complete — processing may take a minute.');
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={handleClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Dialog.Title>
          <span className="inline-flex items-center gap-2">
            <UploadIcon size={18} aria-hidden />
            Upload track
          </span>
        </Dialog.Title>
        <Dialog.Description>
          Add audio to your Music archive. MP3, WAV, FLAC, or AIFF.
        </Dialog.Description>
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional — defaults to filename"
            autoFocus
          />
          <FilePicker
            labels={{
              title: 'Audio file',
              description: 'MP3, WAV, FLAC, or AIFF',
              browse: file ? 'Choose another file' : 'Choose audio',
            }}
            accept="audio/*,.flac,.wav,.mp3,.aiff"
            selectedFiles={file ? [file] : []}
            onFiles={(files) => setFile(files[0] ?? null)}
          />
          {error && (
            <p className="text-accent-red-strong text-sm" role="alert">
              {error}
            </p>
          )}
          {note && (
            <p className="text-foreground-secondary text-sm" role="status">
              {note}
            </p>
          )}
          {itemId && (
            <Link
              to="/studio/sounds/$id"
              params={{ id: itemId }}
              className="text-sm underline"
              onClick={handleClose}
            >
              Open in Music
            </Link>
          )}
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button type="submit" disabled={busy || !file}>
            <UploadIcon size={16} aria-hidden className="mr-1.5" />
            {busy ? 'Uploading…' : 'Upload'}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
