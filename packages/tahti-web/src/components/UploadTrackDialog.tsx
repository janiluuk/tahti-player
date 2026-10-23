import { useNavigate } from '@tanstack/react-router';
import { UploadIcon } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  ButtonLink,
  Dialog,
  FilePicker,
  InlineError,
  Input,
} from '@tahti-player/ui';

import { uploadSoundFile } from '../api/studio';
import {
  UPLOAD_AUDIO_ACCEPT,
  UPLOAD_AUDIO_FORMATS_LABEL,
} from '../lib/uploadAudioFormats';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUploaded?: (itemId: string) => void;
};

export function UploadTrackDialog({ isOpen, onClose, onUploaded }: Props) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setFile(null);
    setBusy(false);
    setError(null);
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
    const fallbackTitle = file.name.replace(/\.[^.]+$/, '') || file.name;
    const result = await uploadSoundFile({
      file,
      title: title.trim() || fallbackTitle,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onUploaded?.(result.itemId);
    handleClose();
    void navigate({ to: '/studio/sounds/$id', params: { id: result.itemId } });
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
          Add audio to your Music archive.
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
              description: UPLOAD_AUDIO_FORMATS_LABEL,
              browse: file ? 'Choose another file' : 'Choose audio',
            }}
            accept={UPLOAD_AUDIO_ACCEPT}
            selectedFiles={file ? [file] : []}
            onFiles={(files) => setFile(files[0] ?? null)}
          />
          {error && <InlineError>{error}</InlineError>}
        </div>
        <Dialog.Actions>
          <ButtonLink
            to="/library/upload"
            variant="text"
            size="sm"
            className="mr-auto"
            onClick={handleClose}
          >
            Open full upload page
          </ButtonLink>
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
