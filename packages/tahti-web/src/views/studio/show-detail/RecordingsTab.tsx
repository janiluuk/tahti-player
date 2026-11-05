import { Link } from '@tanstack/react-router';
import { PlayIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink } from '@tahti-player/ui';

import { ListingDate } from '../../../components/ListingDate';
import { PageEmpty, PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import type { ShowDetailState } from './useShowDetail';

export function RecordingsTab({ state }: { state: ShowDetailState }) {
  const { t } = useTranslation('web');
  const { episodes, episodesLoadError, bookingsLoadError, reload } = state;
  const recordings = episodes.filter(
    (episode) => episode.source === 'broadcast',
  );

  return (
    <StudioPanel
      title="Recordings from this show"
      description="Broadcast recordings linked to this show series."
    >
      {episodesLoadError ? (
        <PageError
          title={t('loadErrors.couldNotLoadRecordings')}
          description={episodesLoadError}
          onRetry={reload}
        />
      ) : recordings.length === 0 ? (
        <>
          <PageEmpty title={t('empties.noShowRecordings')} />
          {bookingsLoadError ? (
            <p className="text-foreground-secondary mt-2 text-xs">
              Upcoming bookings could not be refreshed: {bookingsLoadError}
            </p>
          ) : null}
        </>
      ) : (
        <ul className="divide-border divide-y">
          {recordings.map((episode) => (
            <li
              key={episode.id}
              className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0"
            >
              <span className="text-foreground-secondary w-10 text-xs">
                #{episode.episodeNumber}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  to="/studio/shows/episodes/$episodeId"
                  params={{ episodeId: episode.id }}
                  className="font-medium hover:underline"
                >
                  {episode.title}
                </Link>
                <p className="text-foreground-secondary text-xs">
                  {episode.slotStartAt ? (
                    <ListingDate value={episode.slotStartAt} />
                  ) : (
                    'Recorded episode'
                  )}{' '}
                  · {episode.status}
                </p>
              </div>
              {episode.soundId ? (
                <ButtonLink
                  to="/studio/sounds/$id"
                  params={{ id: episode.soundId }}
                  size="sm"
                  variant="secondary"
                >
                  <PlayIcon size={14} aria-hidden className="mr-1.5" />
                  Play recording
                </ButtonLink>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
