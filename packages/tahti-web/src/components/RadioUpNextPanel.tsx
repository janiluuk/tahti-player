import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';
import { MediaArtwork } from '@tahti-player/ui';

import type { RadioShowUpcomingTrack } from '../api/shows';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { PageEmpty, PageError, PageErrorBanner } from './PageStates';

const LIST_CLASS =
  'border-border divide-border divide-y overflow-hidden rounded-lg border';

const HEADING_CLASS =
  'text-foreground-secondary text-xs font-semibold tracking-wide uppercase';

/** Radio → Up next: the rotation tracks coming after the current one while
 * the station plays its rotation. Booked live shows have their own tab. */
export function RadioUpNextPanel({
  onRotation,
  rotation,
  rotationError,
  onRetryRotation,
}: {
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
      <h3 className={HEADING_CLASS}>{t('radio.nextInRotation')}</h3>
      {rotationError && rotation.length > 0 ? (
        <PageErrorBanner
          title={t('radio.rotationRefreshError')}
          description={rotationError}
          onRetry={onRetryRotation}
        />
      ) : null}
      {rotationError && rotation.length === 0 ? (
        <PageError
          title={t('radio.rotationLoadError')}
          description={rotationError}
          onRetry={onRetryRotation}
        />
      ) : rotation.length === 0 ? (
        <PageEmpty title={t('radio.rotationEmpty')} />
      ) : (
        <ol className={LIST_CLASS}>
          {rotation.map((track) => (
            <li key={track.id} className="flex items-center gap-3 px-3 py-2">
              <MediaArtwork
                size="sm"
                src={track.artworkUrl ?? placeholderArtworkUrl(track.id)}
                alt=""
                className="shrink-0 rounded-md"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm leading-6 font-medium">
                  {track.title}
                </div>
                <div className="text-foreground-secondary truncate text-xs">
                  {track.artistUsername ? (
                    <Link
                      to="/u/$username"
                      params={{ username: track.artistUsername }}
                      className="underline-offset-2 hover:underline"
                    >
                      {track.artistName}
                    </Link>
                  ) : (
                    track.artistName
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
