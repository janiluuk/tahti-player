import { Music, Plus } from 'lucide-react';
import { FC } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { FavoriteButton } from '../FavoriteButton';
import { MediaArtwork } from '../MediaArtwork';
import { Tooltip } from '../Tooltip';
import type { HistoryRowProps } from './types';

export const HistoryRow: FC<HistoryRowProps> = ({
  title,
  artist,
  time,
  artworkUrl,
  isFavorite = false,
  isActive = false,
  onToggleFavorite,
  onAddToQueue,
  onPlayNow,
  labels,
  classes,
  className,
  ...props
}) => (
  <div
    data-testid="history-row"
    data-active={isActive || undefined}
    aria-current={isActive ? 'true' : undefined}
    className={cn(
      'border-border bg-background-secondary group grid grid-cols-[auto_auto_1fr_1fr_auto] items-center border-b-(length:--border-width) select-none last:border-b-0',
      isActive && 'border-l-accent-yellow bg-accent-yellow/15 border-l-2',
      classes?.root,
      className,
    )}
    {...props}
  >
    <div className="flex w-10 justify-center">
      {onToggleFavorite && (
        <FavoriteButton
          data-testid="history-row-favorite"
          size="sm"
          isFavorite={isFavorite}
          onToggle={onToggleFavorite}
          ariaLabelAdd={labels.favorite}
          ariaLabelRemove={labels.unfavorite}
        />
      )}
    </div>

    <div
      data-testid="history-row-thumbnail"
      className={cn(
        'flex size-12 min-w-12 items-center justify-center overflow-hidden',
        classes?.thumbnail,
      )}
    >
      <MediaArtwork
        size="thumb"
        src={artworkUrl}
        alt={title}
        imageReveal={false}
        onPlay={onPlayNow}
        playLabel="Play"
        placeholder={
          <Music
            size={16}
            absoluteStrokeWidth
            className="text-foreground opacity-20"
          />
        }
      />
    </div>

    <div
      data-testid="history-row-artist"
      className={cn('truncate px-2', classes?.artist)}
    >
      {artist}
    </div>

    <div className="truncate px-2">
      <div className="flex items-center justify-between gap-2">
        <button
          data-testid="history-row-title"
          className={cn(
            'min-w-0 flex-1 cursor-pointer truncate text-left hover:underline',
            classes?.title,
          )}
          onClick={(e) => {
            e.stopPropagation();
            onPlayNow?.();
          }}
        >
          {title}
        </button>
        {onAddToQueue && (
          <Tooltip content={labels.addToQueue} side="top">
            <Button
              data-testid="history-row-add-to-queue"
              size="icon-sm"
              variant="text"
              className="opacity-100 transition-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
              aria-label={labels.addToQueue}
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue();
              }}
            >
              <Plus size={16} />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>

    <div
      data-testid="history-row-played-at"
      className={cn('w-24 px-2 whitespace-nowrap tabular-nums', classes?.time)}
    >
      {time}
    </div>
  </div>
);
