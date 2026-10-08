import { CassetteTape } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Box } from '../Box';
import { MediaArtwork } from '../MediaArtwork';

type CardProps = {
  src?: string;
  image?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  onClick?: () => void;
  imageReveal?: boolean;
  /** Centered play overlay on the cover. */
  onPlay?: () => void;
  playLabel?: string;
  pauseLabel?: string;
  isPlaying?: boolean;
  playDisabled?: boolean;
  /** Queue overlay on the cover. */
  onQueue?: () => void;
  queueLabel?: string;
  queueDisabled?: boolean;
  /** Favorite overlay on the cover. */
  onFavorite?: () => void;
  favorited?: boolean;
  /** Click on the title text specifically — separate from `onClick`
   * (artwork) when the two should navigate differently. */
  onTitleClick?: () => void;
};

export const Card: FC<CardProps> = ({
  src,
  image,
  title,
  subtitle,
  className,
  onClick,
  imageReveal = true,
  onPlay,
  playLabel,
  pauseLabel,
  isPlaying,
  playDisabled,
  onQueue,
  queueLabel,
  queueDisabled,
  onFavorite,
  favorited,
  onTitleClick,
}) => {
  const hasOverlays = Boolean(onPlay || onQueue || onFavorite);

  return (
    <div
      data-testid="card"
      role={onClick && !hasOverlays ? 'button' : undefined}
      tabIndex={onClick && !hasOverlays ? 0 : undefined}
      className={cn(
        'text-primary-foreground bg-primary border-border shadow-shadow flex w-46 flex-col items-stretch gap-2 rounded-md border-(length:--border-width) p-2 text-left transition-all',
        onClick &&
          !hasOverlays &&
          'hover:translate-x-shadow-x hover:translate-y-shadow-y cursor-pointer hover:shadow-none',
        className,
      )}
      onClick={hasOverlays ? undefined : onClick}
      onKeyDown={
        onClick && !hasOverlays
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <Box
        variant="primary"
        shadow="none"
        className="relative aspect-square w-full items-center justify-center overflow-hidden p-0"
      >
        {image ?? (
          <MediaArtwork
            size="fill"
            src={src}
            alt={typeof title === 'string' ? title : ''}
            imageReveal={imageReveal}
            onPlay={onPlay}
            playLabel={playLabel}
            pauseLabel={pauseLabel}
            isPlaying={isPlaying}
            playDisabled={playDisabled}
            onQueue={onQueue}
            queueLabel={queueLabel}
            queueDisabled={queueDisabled}
            onFavorite={onFavorite}
            favorited={favorited}
            onArtworkClick={hasOverlays ? onClick : undefined}
            placeholder={
              <CassetteTape
                size={96}
                absoluteStrokeWidth
                className="opacity-20"
              />
            }
          />
        )}
      </Box>

      {(title || subtitle) && (
        <div className="min-w-0">
          {title &&
            (onTitleClick ? (
              <button
                type="button"
                data-testid="card-title"
                onClick={(e) => {
                  e.stopPropagation();
                  onTitleClick();
                }}
                className="text-primary-foreground block w-full truncate text-left text-sm font-bold hover:underline"
              >
                {title}
              </button>
            ) : (
              <div
                data-testid="card-title"
                className="text-primary-foreground truncate text-sm font-bold"
              >
                {title}
              </div>
            ))}
          {subtitle && (
            <div className="text-primary-foreground truncate text-xs opacity-60">
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
