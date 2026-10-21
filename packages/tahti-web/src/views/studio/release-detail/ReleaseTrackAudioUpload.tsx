import { UploadIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, FilePicker } from '@tahti-player/ui';

import type { StudioReleaseTrack } from '../../../api/studio-types';
import {
  isReleaseTrackProcessing,
  RELEASE_TRACK_AUDIO_TYPES,
  type ReleaseTrackUploadResult,
} from '../../../api/studio/release-track-upload';
import { ReleaseTrackUploadProgress } from './ReleaseTrackUploadProgress';
import { useReleaseTrackUpload } from './useReleaseTrackUpload';

export function reportReleaseTrackUpload(
  result: ReleaseTrackUploadResult,
): result is Extract<ReleaseTrackUploadResult, { ok: true }> {
  if (result.ok) {
    toast.success('Audio uploaded. It is being processed now.');
    return true;
  }
  if (result.cancelled) {
    toast.info('Upload cancelled.');
  } else {
    toast.error(result.error);
  }
  return false;
}

/** Upload source audio for a release track that has none, then show its
 * processing state. Library-linked tracks already have audio; replacement
 * masters go through the Versions tab. */
export function ReleaseTrackAudioUpload({
  releaseId,
  track,
  onUploaded,
}: {
  releaseId: string;
  track: StudioReleaseTrack;
  onUploaded: (
    trackId: string,
    patch: Pick<StudioReleaseTrack, 'sourceKey' | 'status'>,
  ) => void;
}) {
  const [picking, setPicking] = useState(false);
  const { uploading, progress, upload, cancel } = useReleaseTrackUpload();

  if (track.soundId) {
    return null;
  }

  const start = async (files: readonly File[]) => {
    const file = files[0];
    if (!file) {
      return;
    }
    setPicking(false);
    const result = await upload(releaseId, track.id, file);
    if (reportReleaseTrackUpload(result)) {
      onUploaded(track.id, {
        sourceKey: result.sourceKey,
        status: result.status,
      });
    }
  };

  if (uploading) {
    return (
      <ReleaseTrackUploadProgress
        title={track.title}
        progress={progress}
        onCancel={cancel}
      />
    );
  }

  if (isReleaseTrackProcessing(track.status)) {
    return (
      <Badge variant="pill" color="secondary">
        Processing
      </Badge>
    );
  }

  if (track.status === 'READY') {
    return null;
  }

  if (picking) {
    return (
      <div className="flex w-full flex-col gap-2">
        <FilePicker
          labels={{
            title: `Audio for ${track.title}`,
            description: 'WAV, FLAC, MP3, AAC or AIFF',
            browse: 'Choose audio file',
          }}
          accept={RELEASE_TRACK_AUDIO_TYPES.join(',')}
          onFiles={(files) => void start(files)}
        />
        <Button
          size="sm"
          variant="text"
          className="self-start"
          onClick={() => setPicking(false)}
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {track.status === 'FAILED' ? (
        <Badge variant="pill" color="red">
          Processing failed
        </Badge>
      ) : null}
      <Button size="sm" variant="secondary" onClick={() => setPicking(true)}>
        <UploadIcon size={14} aria-hidden className="mr-1.5" />
        {track.status === 'FAILED' ? 'Upload again' : 'Upload audio'}
      </Button>
    </div>
  );
}
