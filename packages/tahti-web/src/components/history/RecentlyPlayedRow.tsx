import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Card, CardsRow } from '@tahti-player/ui';

import type { TahtiPlayable } from '../../api/types';
import { radioStationIdForPlayable } from '../../content/radioStations';
import { resolveLocalPlayableForReplay } from '../../lib/nativeLibrary';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';

const RECENTLY_PLAYED_LIMIT = 20;

type RecentRowItem = { id: string; title: string; playable: TahtiPlayable };

export function RecentlyPlayedRow() {
  const { t } = useTranslation('web');
  const history = useLibraryStore((s) => s.history);
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const setStatus = usePlayerStore((s) => s.setStatus);

  const items = useMemo<RecentRowItem[]>(
    () =>
      history.slice(0, RECENTLY_PLAYED_LIMIT).map((entry) => ({
        id: entry.playable.id,
        title: entry.playable.title,
        playable: entry.playable,
      })),
    [history],
  );

  if (items.length === 0) {
    return null;
  }

  const isActive = (id: string) =>
    currentId === id && (status === 'playing' || status === 'loading');

  const replay = (playable: TahtiPlayable) => {
    if (currentId === playable.id) {
      setStatus(isActive(playable.id) ? 'paused' : 'playing');
      return;
    }
    resolveLocalPlayableForReplay(playable)
      .then((resolved) => {
        if (resolved) {
          play(resolved);
        } else {
          toast.error(i18n.t('web:batch52.reimportToPlay'));
        }
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error
            ? error.message
            : i18n.t('web:library.history.trackUnavailable'),
        );
      });
  };

  return (
    <CardsRow
      defaultLayout="cards"
      data-testid="history-recently-played"
      title={t('listen.recentlyPlayed')}
      filterable={false}
      items={items}
      labels={{
        filterPlaceholder: t('listen.filterTracks'),
        nothingFound: t('listen.nothingFound'),
      }}
      renderItem={({ playable }) => {
        const stationId = radioStationIdForPlayable(playable);
        return (
          <Card
            surface="neutral"
            title={
              stationId ? (
                <Link
                  to="/radio/station/$stationId"
                  params={{ stationId }}
                  className="hover:underline"
                >
                  {playable.title}
                </Link>
              ) : (
                playable.title
              )
            }
            subtitle={playable.artist}
            src={playable.coverUrl ?? placeholderArtworkUrl(playable.id)}
            isPlaying={isActive(playable.id)}
            onPlay={() => replay(playable)}
          />
        );
      }}
    />
  );
}
