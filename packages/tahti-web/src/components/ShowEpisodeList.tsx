import { Link } from '@tanstack/react-router';
import { Mic } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, MediaArtwork, Tooltip } from '@tahti-player/ui';

import type { PublicRadioShowEpisode } from '../api/shows';
import { isGreenRoomWindow } from '../lib/radioSchedule';
import { ShowEpisodeWhen } from './ShowEpisodeWhen';

/** A titled list of scheduled/recorded show episodes, each with its cover
 * thumbnail — shared by the artist profile's "Live shows" section and the
 * channel page's Events block. */
export function ShowEpisodeList({
  title,
  episodes,
  channelSlug,
  username,
}: {
  title: string;
  episodes: PublicRadioShowEpisode[];
  channelSlug?: string;
  username?: string;
}) {
  const { t } = useTranslation('web');
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {episodes.map((episode) => (
          <li key={episode.id} className="flex items-start gap-3 p-3">
            <MediaArtwork
              size="thumb"
              src={episode.coverUrl}
              seed={episode.id}
              alt=""
              className="rounded-md"
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {episode.title ?? episode.note ?? 'Tahti Radio show'}
              </div>
              <ShowEpisodeWhen
                episode={episode}
                className="text-foreground-secondary text-xs"
              />
              {episode.description ? (
                <p className="text-foreground-secondary mt-1 text-xs">
                  {episode.description}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {channelSlug ? (
                  <Link
                    to="/radio/show/$channelSlug"
                    params={{ channelSlug }}
                    className="text-primary-strong underline-offset-2 hover:underline"
                  >
                    {t('showEpisodeList.showDetails')}
                  </Link>
                ) : null}
                {episode.recording ? (
                  <a
                    href={episode.recording.channelItemUrl}
                    className="text-primary-strong underline-offset-2 hover:underline"
                  >
                    {t('showEpisodeList.listenToRecording')}
                  </a>
                ) : null}
              </div>
            </div>
            {username && isGreenRoomWindow(episode) ? (
              <Tooltip content={t('showEpisodeList.greenRoom')} side="top">
                <ButtonLink
                  to="/u/$username/green-room"
                  params={{ username }}
                  className="shrink-0"

                  size="icon-sm"
                  variant="secondary"
                  aria-label={t('showEpisodeList.openGreenRoom')}
                >
                  <Mic size={16} aria-hidden />
                </ButtonLink>
              </Tooltip>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
