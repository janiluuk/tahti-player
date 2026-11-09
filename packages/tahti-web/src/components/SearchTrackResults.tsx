import { Link } from '@tanstack/react-router';
import { LockIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { MediaArtwork } from '@tahti-player/ui';

import type { SearchTrackResult } from '../api/search-types';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { formatDuration } from '../lib/playableToTrack';
import { searchTrackPlayable } from '../lib/searchTrackPlayable';
import { PlayableAmbientTrackList } from './PlayableAmbientTrackList';

/** Search and tag-search tracks: the ones this viewer can play as full track
 * rows (play, queue, love, add to playlist); members-only or for-sale ones
 * as links to their page, which explains how to get them. */
export function SearchTrackResults({
  tracks,
}: {
  tracks: SearchTrackResult[];
}) {
  const { t } = useTranslation('web');
  const playable = tracks.flatMap((track) => {
    const item = searchTrackPlayable(track);
    return item ? [item] : [];
  });
  const playableIds = new Set(playable.map((item) => item.id));
  const others = tracks.filter(
    (track) =>
      !playableIds.has(`sound:${track.id}`) && !playableIds.has(track.id),
  );

  return (
    <div className="flex flex-col gap-3" data-testid="search-track-results">
      {playable.length > 0 ? (
        <PlayableAmbientTrackList items={playable} compactActions />
      ) : null}
      {others.length > 0 ? (
        <ul
          className="flex flex-col gap-1"
          aria-label={t('searchTrackResultsText.tracksToOpen')}
        >
          {others.map((track) => (
            <li key={track.id}>
              <Link
                to="/t/$id"
                params={{ id: track.id }}
                className="hover:bg-background-secondary flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5"
              >
                <MediaArtwork
                  size="sm"
                  src={track.coverUrl ?? placeholderArtworkUrl(track.id)}
                  alt=""
                  className="shrink-0"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {track.title}
                  </span>
                  <span className="text-foreground-secondary truncate text-xs">
                    {track.artistName}
                  </span>
                </span>
                {track.gate ? (
                  <span className="text-foreground-secondary flex shrink-0 items-center gap-1 text-xs">
                    <LockIcon size={12} aria-hidden />
                    {track.gate.reason === 'PURCHASE' ? 'Buy' : 'Members'}
                  </span>
                ) : null}
                {track.durationSec != null ? (
                  <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
                    {formatDuration(track.durationSec)}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
