import { CassetteTape } from 'lucide-react';
import { FC, ReactNode, useContext } from 'react';

import { cn } from '../../utils';
import { Box } from '../Box';
import {
  MEDIA_ROW_GROUP,
  MediaArtwork,
  useMediaArtworkDefaultSrc,
} from '../MediaArtwork';
import { trackRowMinHeightClass } from '../TrackTable/utils/rowClass';
import { CardLayoutContext } from './CardLayoutContext';

type CardProps = {
  src?: string;
  /** Stable id (slug, track or release id) that picks the default cover
   * when `src` is missing or fails to load; falls back to the title. */
  seed?: string;
  image?: ReactNode;
  artworkOverlay?: ReactNode;
  title?: ReactNode;
  /** Names the overlay buttons ("Play YleX") when `title` is not plain text. */
  itemName?: string;
  subtitle?: ReactNode;
  className?: string;
  onClick?: () => void;
  imageReveal?: boolean;
  surface?: 'brand' | 'neutral';
  onPlay?: () => void;
  playLabel?: string;
  pauseLabel?: string;
  isPlaying?: boolean;
  /** The playing or paused item: on touch screens only it shows a play /
   * pause control. Defaults to `isPlaying`. */
  isCurrent?: boolean;
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
  seed,
  image,
  artworkOverlay,
  title,
  itemName,
  subtitle,
  className,
  onClick,
  imageReveal = true,
  surface = 'brand',
  onPlay,
  playLabel,
  pauseLabel,
  isPlaying,
  isCurrent,
  playDisabled,
  onQueue,
  queueLabel,
  queueDisabled,
  onFavorite,
  favorited,
  onTitleClick,
}) => {
  const layout = useContext(CardLayoutContext);
  const isRow = layout === 'row';
  const hasOverlays = Boolean(onPlay || onQueue || onFavorite);
  const named = itemName || (typeof title === 'string' && title ? title : null);
  // A row sits on the page background, so it always uses the neutral text.
  const isNeutral = surface === 'neutral' || layout === 'row';
  const titleClass = isNeutral ? 'text-foreground' : 'text-primary-foreground';
  const subtitleClass = isNeutral
    ? 'text-foreground-secondary'
    : 'text-primary-foreground';

  const artworkAlt = typeof title === 'string' ? title : '';
  // Passing a placeholder turns off MediaArtwork's default-artwork fallback,
  // so the cassette is only for apps without a MediaArtworkDefaultProvider.
  const hasDefaultArtwork =
    useMediaArtworkDefaultSrc(seed || artworkAlt) !== null;

  const artwork = image ?? (
    <MediaArtwork
      size={isRow ? 'md' : 'fill'}
      src={src}
      seed={seed}
      alt={artworkAlt}
      imageReveal={imageReveal}
      onPlay={onPlay}
      playLabel={playLabel ?? (named ? `Play ${named}` : undefined)}
      pauseLabel={pauseLabel ?? (named ? `Pause ${named}` : undefined)}
      isPlaying={isPlaying}
      isCurrent={isCurrent}
      hideActivePlay={isRow}
      playDisabled={playDisabled}
      onQueue={onQueue}
      queueLabel={queueLabel ?? (named ? `Queue ${named}` : undefined)}
      queueDisabled={queueDisabled}
      onFavorite={onFavorite}
      favorited={favorited}
      favoriteLabel={named ? `Favorite ${named}` : undefined}
      unfavoriteLabel={named ? `Remove ${named} from favorites` : undefined}
      onArtworkClick={hasOverlays ? onClick : undefined}
      placeholder={
        hasDefaultArtwork ? undefined : (
          <CassetteTape
            size={layout === 'row' ? 20 : 96}
            absoluteStrokeWidth
            className="opacity-20"
          />
        )
      }
    />
  );

  const rowTitleClass = cn(
    'text-foreground',
    isPlaying && 'text-primary-strong font-semibold',
  );

  const titleBlock = (title || subtitle) && (
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
              'block w-full truncate text-left hover:underline',
              isRow ? rowTitleClass : ['text-sm font-bold', titleClass],
            )}
          >
            {title}
          </button>
        ) : (
          <div
            data-testid="card-title"
            className={cn(
              'truncate',
              isRow ? rowTitleClass : ['text-sm font-bold', titleClass],
            )}
          >
            {title}
          </div>
        ))}
      {subtitle && (
        <div className={cn('truncate text-xs', subtitleClass)}>{subtitle}</div>
      )}
    </div>
  );

  if (isRow) {
    return (
      <div
        data-testid="card"
        data-layout="row"
        data-playing={isPlaying || undefined}
        data-surface={surface}
        role={onClick && !hasOverlays ? 'button' : undefined}
        tabIndex={onClick && !hasOverlays ? 0 : undefined}
        className={cn(
          MEDIA_ROW_GROUP,
          'flex w-full items-center gap-2 pr-2 text-left',
          trackRowMinHeightClass,
          onClick && !hasOverlays && 'cursor-pointer',
          isPlaying && 'border-l-primary bg-primary/10 border-l-2',
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
        <div className="relative flex w-16 shrink-0 justify-center">
          {artwork}
        </div>
        <div className="min-w-0 flex-1 px-2">{titleBlock}</div>
        {artworkOverlay ? (
          <div className="shrink-0">{artworkOverlay}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      data-testid="card"
      data-layout={layout}
      data-playing={isPlaying || undefined}
      data-surface={surface}
      role={onClick && !hasOverlays ? 'button' : undefined}
      tabIndex={onClick && !hasOverlays ? 0 : undefined}
      className={cn(
        MEDIA_ROW_GROUP,
        'border-border shadow-shadow flex flex-col items-stretch gap-2 rounded-md border-(length:--border-width) p-2 text-left transition-all',
        layout === 'full' ? 'w-full' : 'w-46',
        isNeutral
          ? 'bg-background-secondary text-foreground'
          : 'text-primary-foreground bg-primary',
        onClick &&
          !hasOverlays &&
          'hover:ring-primary/45 cursor-pointer duration-150 ease-out hover:shadow-none hover:ring-2 hover:ring-inset motion-reduce:transition-none',
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
        {artwork}
        {artworkOverlay ? (
          <div className="pointer-events-none absolute top-2 left-2 z-10">
            {artworkOverlay}
          </div>
        ) : null}
      </Box>

      {titleBlock}
    </div>
  );
};
