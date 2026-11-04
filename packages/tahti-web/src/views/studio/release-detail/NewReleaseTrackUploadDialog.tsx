import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, FilePicker, Input } from '@tahti-player/ui';

import { addStudioReleaseTrack } from '../../../api/studio';
import type { StudioReleaseTrack } from '../../../api/studio-types';
import { RELEASE_TRACK_AUDIO_TYPES } from '../../../api/studio/release-track-upload';
import { reportReleaseTrackUpload } from './ReleaseTrackAudioUpload';
import { ReleaseTrackUploadProgress } from './ReleaseTrackUploadProgress';
import { useReleaseTrackUpload } from './useReleaseTrackUpload';

function titleFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, '').trim();
}

export function NewReleaseTrackUploadDialog({
  releaseId,
  isOpen,
  onClose,
  onTrackCreated,
  onUploaded,
}: {
  releaseId: string;
  isOpen: boolean;
  onClose: () => void;
  onTrackCreated: (track: StudioReleaseTrack) => void;
  onUploaded: (
    trackId: string,
    patch: Pick<StudioReleaseTrack, 'sourceKey' | 'status'>,
  ) => void;
}) {
  const { t } = useTranslation('web');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const { uploading, progress, upload, cancel } = useReleaseTrackUpload();
  const busy = creating || uploading;

  const reset = () => {
    setTitle('');
    setFile(null);
  };

  const close = () => {
    if (busy) {
      return;
    }
    reset();
    onClose();
  };

  const submit = async () => {
    const trackTitle = title.trim();
    if (!file || !trackTitle) {
      return;
    }
    setCreating(true);
    const created = await addStudioReleaseTrack(releaseId, {
      title: trackTitle,
    });
    setCreating(false);
    if (!created.ok) {
      toast.error(created.error);
      return;
    }
    onTrackCreated(created.data);
    const result = await upload(releaseId, created.data.id, file);
    if (reportReleaseTrackUpload(result)) {
      onUploaded(created.data.id, {
        sourceKey: result.sourceKey,
        status: result.status,
      });
    }
    reset();
    onClose();
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={close}>
      <Dialog.Title>{t('library.uploadNewReleaseTrackTitle')}</Dialog.Title>
      <Dialog.Description>
        {t('library.uploadNewReleaseTrackDescription')}
      </Dialog.Description>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="flex flex-col gap-3 py-3">
          <FilePicker
            labels={{
              title: t('library.audioFile'),
              description: t('library.releaseAudioFormats'),
              browse: t('library.chooseAudioFileBrowse'),
            }}
            accept={RELEASE_TRACK_AUDIO_TYPES.join(',')}
            disabled={busy}
            selectedFiles={file ? [file] : []}
            onFiles={(files) => {
              const picked = files[0];
              if (!picked) {
                return;
              }
              setFile(picked);
              if (!title.trim()) {
                setTitle(titleFromFilename(picked.name));
              }
            }}
          />
          <Input
            label={t('library.releaseTrackTitle')}
            value={title}
            disabled={busy}
            onChange={(event) => setTitle(event.target.value)}
          />
          {uploading ? (
            <ReleaseTrackUploadProgress
              title={title.trim() || 'track'}
              progress={progress}
              onCancel={cancel}
            />
          ) : null}
        </div>
        <Dialog.Actions>
          <Button variant="text" disabled={busy} onClick={close}>
            {t('actions.cancel')}
          </Button>
          <Button disabled={busy || !file || !title.trim()} type="submit">
            {busy
              ? t('library.uploading')
              : t('library.uploadTrackDialogTitle')}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
