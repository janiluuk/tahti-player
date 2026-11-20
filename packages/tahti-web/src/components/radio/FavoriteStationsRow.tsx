import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Card, CardsRow } from '@tahti-player/ui';

import { radioStationIdForPlayable } from '../../content/radioStations';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';

export function FavoriteStationsRow() {
  const { t } = useTranslation('web');
  const favoriteTracks = useLibraryStore((s) => s.favoriteTracks);
  const toggleFavoriteStation = useLibraryStore((s) => s.toggleFavoriteStation);
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const items = useMemo(
    () =>
      favoriteTracks
        .filter((track) => track.kind === 'radio')
        .map((playable) => ({
          id: playable.id,
          title: playable.title,
          playable,
        })),
    [favoriteTracks],
  );

  if (items.length === 0) {
    return null;
  }

  const isActive = (id: string) =>
    currentId === id && (status === 'playing' || status === 'loading');

  return (
    <CardsRow
      data-testid="radio-favorites"
      title={t('favoriteStationsRowText.favoriteStations')}
      badge={t('nav.favorites')}
      badgeColor="red"
      items={items}
      labels={{
        filterPlaceholder: t('listen.filterStations'),
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
            subtitle={
              playable.artist === playable.title
                ? t('listen.internetRadioBadge')
                : playable.artist
            }
            src={playable.coverUrl ?? placeholderArtworkUrl(playable.id)}
            isPlaying={isActive(playable.id)}
            onPlay={() => {
              if (currentId === playable.id) {
                setStatus(isActive(playable.id) ? 'paused' : 'playing');
                return;
              }
              play(playable);
            }}
            favorited
            onFavorite={() => toggleFavoriteStation(playable)}
          />
        );
      }}
    />
  );
}
