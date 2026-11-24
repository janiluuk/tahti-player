import { useTranslation } from '@tahti-player/i18n';

import type { RadioShowUpcomingTrack } from '../api/shows';
import { PageEmpty, PageError, PageErrorBanner } from './PageStates';
import { RadioTrackTable, type RadioTrackRow } from './radio/RadioTrackTable';

/** Radio → Up next: the rotation tracks coming after the current one while
 * the station plays its rotation. Booked live shows have their own tab. */
export function RadioUpNextPanel({
  current,
  onRotation,
  rotation,
  rotationError,
  onRetryRotation,
}: {
  current?: RadioTrackRow | null;
  onRotation: boolean;
  rotation: RadioShowUpcomingTrack[];
  rotationError?: string;
  onRetryRotation: () => void;
}) {
  const { t } = useTranslation('web');
  if (!onRotation) {
    return (
      <PageEmpty
        title={t('radio.memberSetOnAir')}
        description={t('radio.memberSetOnAirDescription')}
      />
    );
  }
  return (
    <section
      className="flex flex-col gap-2"
      data-testid="radio-up-next-rotation"
    >
      {rotationError && (rotation.length > 0 || current) ? (
        <PageErrorBanner
          title={t('radio.rotationRefreshError')}
          description={rotationError}
          onRetry={onRetryRotation}
        />
      ) : null}
      {rotationError && rotation.length === 0 && !current ? (
        <PageError
          title={t('radio.rotationLoadError')}
          description={rotationError}
          onRetry={onRetryRotation}
        />
      ) : rotation.length === 0 && !current ? (
        <PageEmpty title={t('radio.rotationEmpty')} />
      ) : (
        <RadioTrackTable rows={[...(current ? [current] : []), ...rotation]} />
      )}
    </section>
  );
}
