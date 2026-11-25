import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { MarqueeText } from '../MarqueeText';
import { MediaArtwork } from '../MediaArtwork';

type PlayerBarNowPlayingProps = {
  title: string;
  artist: string;
  coverUrl?: string;
  /** Stable id that picks the default artwork when there is no cover. */
  artworkSeed?: string;
  className?: string;
  action?: ReactNode;
  onTitleClick?: () => void;
  onArtistClick?: () => void;
};

const linkClass =
  'flex w-full min-w-0 justify-start rounded-sm text-left hover:underline active:scale-100';

export const PlayerBarNowPlaying: FC<PlayerBarNowPlayingProps> = ({
  title,
  artist,
  coverUrl,
  artworkSeed,
  className = '',
  action,
  onTitleClick,
  onArtistClick,
}) => {
  const titleText = (
    <MarqueeText className="text-foreground w-full text-sm font-semibold tracking-tight">
      {title}
    </MarqueeText>
  );
  const artistText = (
    <MarqueeText className="text-foreground-secondary w-full text-xs">
      {artist}
    </MarqueeText>
  );
  return (
    <div className={cn('flex min-w-0 items-center gap-3.5', className)}>
      <MediaArtwork
        src={coverUrl}
        seed={artworkSeed ?? title}
        size="md"
        className="border-border shrink-0 rounded-lg border-(length:--border-width) shadow-sm ring-1 ring-white/5"
      />
      <div className="min-w-0 flex-1">
        {onTitleClick ? (
          <Button
            variant="plain"
            size="flexible"
            className={linkClass}
            data-testid="now-playing-title"
            title={title}
            onClick={onTitleClick}
          >
            {titleText}
          </Button>
        ) : (
          <div data-testid="now-playing-title" title={title}>
            {titleText}
          </div>
        )}
        {onArtistClick ? (
          <Button
            variant="plain"
            size="flexible"
            className={linkClass}
            data-testid="player-now-playing-artist"
            title={artist}
            onClick={onArtistClick}
          >
            {artistText}
          </Button>
        ) : (
          <div data-testid="player-now-playing-artist" title={artist}>
            {artistText}
          </div>
        )}
      </div>
      {action}
    </div>
  );
};
