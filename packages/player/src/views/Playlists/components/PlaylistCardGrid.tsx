import { type FC, memo } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import type { PlaylistIndexEntry } from '@tahti-player/model';
import { Card, CardGrid } from '@tahti-player/ui';

import { PlaylistArtwork } from './PlaylistArtwork';

type PlaylistCardGridProps = {
  playlists: PlaylistIndexEntry[];
  onCardClick: (id: string) => void;
};

export const PlaylistCardGrid = memo<PlaylistCardGridProps>(({ playlists, onCardClick }) => {
  const { t } = useTranslation('playlists');

  return (
    <CardGrid>
      {playlists.map((playlist) => (
        <Card key={playlist.id} onClick={() => onCardClick(playlist.id)}>
          <PlaylistArtwork playlist={playlist} />
          <span className="text-foreground-secondary truncate line-clamp-1">
            {playlist.name}
          </span>
        </Card>
      ))}
    </CardGrid>
  );
});