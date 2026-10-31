import { CassetteTape } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Box } from '../Box';
import { MediaArtwork } from '../MediaArtwork';

type CardProps = {
  src?: string;
  image?: ReactNode;
  artworkOverlay?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  onClick?: () => void;
  imageReveal?: boolean;
  surface?: 'brand' | 'neutral';
  onPlay?: () => void;
  playLabel?: string;
  pauseLabel?: string;
  isPlaying?: boolean;
  playDisabled?: boolean;
  onQueue?: () => void;
  queueLabel?: string;
  queueDisabled?: boolean;
  onFavorite?: () => void;
  favorited?: boolean;
  onTitleClick?: () => void;
};

export const Card: FC<CardProps> = ({
  src,
  image,
  artworkOverlay,
  title,
  subtitle,
  className,
  onClick,
  imageReveal = true,
  surface = 'brand',
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
  const isNeutral = surface === 'neutral';
  const titleClass = isNeutral ? 'text-foreground' : 'text-primary-foreground';
  const subtitleClass = isNeutral
    ? 'text-foreground-secondary'
    : 'text-primary-foreground';

  return (
    <div
      data-testid="card"
      data-playing={isPlaying || undefined}
      data-surface={surface}
      role={onClick && !hasOverlays ? 'button' : undefined}
      tabIndex={onClick && !hasOverlays ? 0 : undefined}
      className={cn(
        'border-border shadow-shadow flex w-46 flex-col items-stretch gap-2 rounded-md border-(length:--border-width) p-2 text-left transition-all',
        isNeutral
          ? 'bg-background-secondary text-foreground'
          : 'text-primary-foreground bg-primary',
        onClick &&
          !hasOverlays &&
          'hover:translate-x-shadow-x hover:translate-y-shadow-y cursor-pointer hover:shadow-none',
        isPlaying && 'ring-foreground/25 ring-2 ring-inset',
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
        variant={isNeutral ? 'tertiary' : 'primary'}
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
        {artworkOverlay ? (
          <div className="pointer-events-none absolute top-2 left-2 z-10">
            {artworkOverlay}
          </div>
        ) : null}
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
                className={cn(
                  'block w-full truncate text-left text-sm font-bold hover:underline',
                  titleClass,
                )}
              >
                {title}
              </button>
            ) : (
              <div
                data-testid="card-title"
                className={cn('truncate text-sm font-bold', titleClass)}
              >
                {title}
              </div>
            ))}
          {subtitle && (
            <div className={cn('truncate text-xs', subtitleClass)}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
