import { UploadIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, FilePicker, InlineError } from '@tahti-player/ui';

import { uploadUserMediaFile } from '../api/user-media';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (url: string) => void;
};

export function ArtworkPresetUploadDialog({
  isOpen,
  onClose,
  onUploaded,
}: Props) {
  const { t } = useTranslation('web');
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
          {t('artworkPresetUploadDialog.addArtwork')}
        </span>
      </Dialog.Title>
      <Dialog.Description>
        {t('artworkPresetUploadDialog.uploadASquareJpgPng')}
      </Dialog.Description>
      <div className="mt-4">
        <FilePicker
          labels={{
            title: t('artworkPresetUploadDialogFields.image'),
            description: t('artworkPresetUploadDialogFields.jpgPngWebpOrGif'),
            browse: file
              ? t('artworkPresetUploadDialogStates.chooseAnotherImage')
              : t('artworkPresetUploadDialogStates.chooseImage'),
          }}
          accept="image/jpeg,image/png,image/webp,image/gif"
          selectedFiles={file ? [file] : []}
          disabled={busy}
          onFiles={(files) => setFile(files[0] ?? null)}
        />
        {error && <InlineError className="mt-2">{error}</InlineError>}
      </div>
      <Dialog.Actions>
        <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
        <Button onClick={() => void submit()} disabled={busy || !file}>
          <UploadIcon size={16} aria-hidden className="mr-1.5" />
          {busy
            ? t('artworkPresetUploadDialogStates.uploading')
            : t('artworkPresetUploadDialogStates.upload')}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
