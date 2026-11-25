import { UploadIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import type {
  FingerprintMatch,
  StudioReleaseTrack,
} from '../../../api/studio-types';
import { FingerprintTrackPanel } from '../../../components/FingerprintTrackPanel';
import { PageEmpty } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

type Props = {
  releaseId: string;
  tracks: StudioReleaseTrack[];
  onUploadAudio: () => void;
  onTrackFingerprintUpdated: (
    trackId: string,
    match: FingerprintMatch | null,
  ) => void;
};

export function ReleaseFingerprintPanel({
  releaseId,
  tracks,
  onUploadAudio,
  onTrackFingerprintUpdated,
}: Props) {
  const { t } = useTranslation('web');
  const fingerprintable = tracks.filter((track) => track.sourceKey);
  return (
    <StudioPanel
      title={t('studioReleaseDetail.fingerprintTitle')}
      description={t('studioReleaseDetail.fingerprintDescription')}
    >
      {fingerprintable.length === 0 ? (
        <PageEmpty
          title={t('studioReleaseDetail.fingerprintNoAudioTitle')}
          description={t('studioReleaseDetail.fingerprintNoAudioDescription')}
          action={
            <Button size="sm" variant="secondary" onClick={onUploadAudio}>
              <UploadIcon size={16} aria-hidden />
              {t('emptyActions.uploadAudio')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {fingerprintable.map((track) => (
            <FingerprintTrackPanel
              key={track.id}
              releaseId={releaseId}
              track={track}
              onUpdated={(match) => onTrackFingerprintUpdated(track.id, match)}
            />
          ))}
        </div>
      )}
    </StudioPanel>
  );
}
