import { Music2 } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';

type PlayerBarNowPlayingProps = {
  title: string;
  artist: string;
  coverUrl?: string;
  className?: string;
  action?: ReactNode;
  onTitleClick?: () => void;
  onArtistClick?: () => void;
};

export const PlayerBarNowPlaying: FC<PlayerBarNowPlayingProps> = ({
  title,
  artist,
  coverUrl,
  className = '',
  action,
  onTitleClick,
  onArtistClick,
}) => (
  <div className={cn('flex min-w-0 items-center gap-3.5', className)}>
    <div className="border-border bg-background-secondary size-12 shrink-0 overflow-hidden rounded-lg border-(length:--border-width) shadow-sm ring-1 ring-white/5">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          className="size-full object-cover select-none"
          data-testid="player-now-playing-thumbnail"
        />
      ) : (
        <div
          className="text-foreground-secondary flex size-full items-center justify-center"
          data-testid="player-now-playing-placeholder"
        >
          <Music2 size={20} />
        </div>
      )}
    </div>
    <div className="min-w-0 flex-1">
      {onTitleClick ? (
        <button
          type="button"
          className="text-foreground block w-full truncate text-left text-sm font-semibold tracking-tight hover:underline"
          data-testid="now-playing-title"
          onClick={onTitleClick}
        >
          {title}
        </button>
      ) : (
        <div
          className="text-foreground truncate text-sm font-semibold tracking-tight"
          data-testid="now-playing-title"
        >
          {title}
        </div>
      )}
      {onArtistClick ? (
        <button
          type="button"
          className="text-foreground-secondary block w-full truncate text-left text-xs hover:underline"
          data-testid="player-now-playing-artist"
          onClick={onArtistClick}
        >
          {artist}
        </button>
      ) : (
        <div
          className="text-foreground-secondary truncate text-xs"
          data-testid="player-now-playing-artist"
        >
          {artist}
        </div>
      )}
    </div>
    {action}
  </div>
);
