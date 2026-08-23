import { CassetteTape, Heart, ListPlus, Pause, Play } from 'lucide-react';
import { FC, ReactNode, type MouseEvent } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { ImageReveal } from '../ImageReveal';

export type MediaArtworkAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
};

export type MediaArtworkProps = {
  src?: string | null;
  alt?: string;
  /** Visual size preset — `fill` stretches to parent (card cover). */
  size?: 'sm' | 'md' | 'lg' | 'fill';
  className?: string;
  imageReveal?: boolean;
  placeholder?: ReactNode;
  /** Centered circular play control. */
  onPlay?: () => void;
  playLabel?: string;
  pauseLabel?: string;
  isPlaying?: boolean;
  playDisabled?: boolean;
  /** Convenience queue action (top-right overlay). */
  onQueue?: () => void;
  queueLabel?: string;
  queueDisabled?: boolean;
  queueActive?: boolean;
  /** Convenience favorite action (top-right overlay). */
  onFavorite?: () => void;
  favorited?: boolean;
  favoriteLabel?: string;
  unfavoriteLabel?: string;
  /** Extra overlay actions (after queue / favorite). */
  actions?: MediaArtworkAction[];
  /** Click on bare artwork (ignored when clicking overlay controls). */
  onArtworkClick?: () => void;
};

const sizeClass = {
  sm: 'size-10 min-w-10',
  md: 'size-16 min-w-16',
  lg: 'size-42 min-w-42',
  fill: 'absolute inset-0 size-full',
} as const;

const playIconSize = {
  sm: 14,
  md: 18,
  lg: 22,
  fill: 22,
} as const;

const overlayIconSize = {
  sm: 12,
  md: 14,
  lg: 16,
  fill: 16,
} as const;

/** Hover / focus show overlays; always visible on coarse pointers (touch). */
const overlayReveal =
  'opacity-100 transition-opacity [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100';

export const MediaArtwork: FC<MediaArtworkProps> = ({
  src,
  alt,
  size = 'fill',
  className,
  imageReveal = true,
  placeholder,
  onPlay,
  playLabel = 'Play',
  pauseLabel = 'Pause',
  isPlaying = false,
  playDisabled,
  onQueue,
  queueLabel = 'Add to queue',
  queueDisabled,
  queueActive = false,
  onFavorite,
  favorited = false,
  favoriteLabel = 'Favorite',
  unfavoriteLabel = 'Remove favorite',
  actions = [],
  onArtworkClick,
}) => {
  const resolvedSrc = src ?? undefined;
  const iconPx = playIconSize[size];
  const overlayPx = overlayIconSize[size];

  const secondary: MediaArtworkAction[] = [
    ...(onQueue
      ? [
          {
            id: 'queue',
            label: queueLabel,
            icon: <ListPlus size={overlayPx} />,
            onClick: onQueue,
            disabled: queueDisabled,
            active: queueActive,
          } satisfies MediaArtworkAction,
        ]
      : []),
    ...(onFavorite
      ? [
          {
            id: 'favorite',
            label: favorited ? unfavoriteLabel : favoriteLabel,
            icon: (
              <Heart
                size={overlayPx}
                className={favorited ? 'fill-current' : undefined}
              />
            ),
            onClick: onFavorite,
            active: favorited,
          } satisfies MediaArtworkAction,
        ]
      : []),
    ...actions,
  ];

  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const hasPlay = Boolean(onPlay);
  const hasSecondary = secondary.length > 0;
  const interactive = hasPlay || hasSecondary || Boolean(onArtworkClick);

  return (
    <div
      data-testid="media-artwork"
      className={cn(
        'group relative overflow-hidden',
        sizeClass[size],
        interactive && 'cursor-pointer',
        className,
      )}
      onClick={
        onArtworkClick
          ? (e) => {
              // Ignore if a child control handled it
              if ((e.target as HTMLElement).closest('button')) {
                return;
              }
              onArtworkClick();
            }
          : undefined
      }
    >
      {resolvedSrc ? (
        imageReveal && size !== 'sm' ? (
          <ImageReveal
            enabled
            src={resolvedSrc}
            alt={alt}
            className="absolute inset-0"
            imgClassName="h-full w-full object-cover"
            placeholder={
              placeholder ?? (
                <CassetteTape
                  size={48}
                  absoluteStrokeWidth
                  className="opacity-20"
                />
              )
            }
          />
        ) : (
          <img
            src={resolvedSrc}
            alt={alt ?? ''}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      ) : (
        <div className="bg-background-secondary absolute inset-0 flex items-center justify-center">
          {placeholder ?? (
            <CassetteTape
              size={size === 'sm' ? 20 : 48}
              absoluteStrokeWidth
              className="text-foreground opacity-20"
            />
          )}
        </div>
      )}

      {(hasPlay || hasSecondary) && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 bg-black/0 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:bg-black/45 [@media(hover:hover)_and_(pointer:fine)]:group-hover:bg-black/45',
            // Always dim slightly on touch so controls read clearly
            '[@media(hover:none)]:bg-black/35',
          )}
          aria-hidden
        />
      )}

      {/* Small (row-context) artwork: play + queue/favorite sit together,
          centered, so the queue action reads as "next to play" rather than
          pinned to a far corner like on the larger grid-card sizes below. */}
      {size === 'sm' ? (
        (hasPlay || hasSecondary) && (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center justify-center gap-0.5',
              overlayReveal,
            )}
          >
            {hasPlay && (
              <Button
                type="button"
                size="icon-sm"
                variant="default"
                disabled={playDisabled}
                title={isPlaying ? pauseLabel : playLabel}
                aria-label={isPlaying ? pauseLabel : playLabel}
                aria-pressed={isPlaying || undefined}
                data-testid="media-artwork-play"
                className="pointer-events-auto size-6 rounded-full shadow-md"
                onClick={(e) => {
                  stop(e);
                  onPlay?.();
                }}
              >
                {isPlaying ? (
                  <Pause size={iconPx} className="fill-current" />
                ) : (
                  <Play size={iconPx} className="translate-x-px fill-current" />
                )}
              </Button>
            )}
            {secondary.map((action) => (
              <Button
                key={action.id}
                type="button"
                size="icon-sm"
                variant="secondary"
                disabled={action.disabled}
                title={action.label}
                aria-label={action.label}
                aria-pressed={action.active}
                data-testid={`media-artwork-${action.id}`}
                className={cn(
                  'pointer-events-auto size-4 rounded-full bg-black/55 text-white shadow-sm backdrop-blur-sm',
                  action.active && 'bg-primary text-primary-foreground',
                )}
                onClick={(e) => {
                  stop(e);
                  action.onClick();
                }}
              >
                {action.icon}
              </Button>
            ))}
          </div>
        )
      ) : (
        <>
          {hasPlay && (
            <div
              className={cn(
                'pointer-events-none absolute inset-0 flex items-center justify-center',
                overlayReveal,
              )}
            >
              <Button
                type="button"
                size="icon-sm"
                variant="default"
                disabled={playDisabled}
                title={isPlaying ? pauseLabel : playLabel}
                aria-label={isPlaying ? pauseLabel : playLabel}
                aria-pressed={isPlaying || undefined}
                data-testid="media-artwork-play"
                className={cn(
                  'pointer-events-auto rounded-full shadow-md',
                  size === 'md' ? 'size-9' : 'size-11',
                )}
                onClick={(e) => {
                  stop(e);
                  onPlay?.();
                }}
              >
                {isPlaying ? (
                  <Pause size={iconPx} className="fill-current" />
                ) : (
                  <Play size={iconPx} className="translate-x-px fill-current" />
                )}
              </Button>
            </div>
          )}

          {hasSecondary && (
            <div
              className={cn(
                'pointer-events-none absolute top-1 right-1 z-[1] flex flex-col gap-0.5',
                overlayReveal,
              )}
            >
              {secondary.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  disabled={action.disabled}
                  title={action.label}
                  aria-label={action.label}
                  aria-pressed={action.active}
                  data-testid={`media-artwork-${action.id}`}
                  className="pointer-events-auto size-7 rounded-full bg-black/55 text-white shadow-sm backdrop-blur-sm"
                  onClick={(e) => {
                    stop(e);
                    action.onClick();
                  }}
                >
                  {action.icon}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
