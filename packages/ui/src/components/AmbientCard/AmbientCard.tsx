import { CassetteTape } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Box } from '../Box';
import { MediaArtwork } from '../MediaArtwork';
import { labelTone, useDominantColor } from './useDominantColor';

export type AmbientCardProps = {
  src?: string;
  image?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  onClick?: () => void;
  imageReveal?: boolean;
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
  /** Skip canvas sampling and tint with this RGB (Storybook / offline). */
  ambientRgb?: [number, number, number] | null;
};

export const AmbientCard: FC<AmbientCardProps> = ({
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
  ambientRgb,
}) => {
  const sampled = useDominantColor(ambientRgb === undefined ? src : null);
  const rgb = ambientRgb === undefined ? sampled : ambientRgb;
  const tone = labelTone(rgb);
  const hasOverlays = Boolean(onPlay || onQueue || onFavorite);
  const wash = rgb
    ? `radial-gradient(circle at 30% 20%, rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.85), transparent 55%), radial-gradient(circle at 80% 90%, rgba(${rgb[2]}, ${rgb[0]}, ${rgb[1]}, 0.55), transparent 50%)`
    : undefined;

  return (
    <div
      data-testid="ambient-card"
      role={onClick && !hasOverlays ? 'button' : undefined}
      tabIndex={onClick && !hasOverlays ? 0 : undefined}
      className={cn(
        'border-border shadow-shadow relative flex w-46 flex-col items-stretch gap-2 overflow-hidden rounded-md border-(length:--border-width) p-2 text-left transition-all',
        onClick &&
          !hasOverlays &&
          'hover:translate-x-shadow-x hover:translate-y-shadow-y cursor-pointer hover:shadow-none',
        className,
      )}
      style={
        rgb
          ? { backgroundColor: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` }
          : undefined
      }
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
      <div className="pointer-events-none absolute inset-0 -z-0" aria-hidden>
        {src ? (
          <img
            src={src}
            alt=""
            className="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-2xl saturate-150"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={wash ? { backgroundImage: wash } : undefined}
        />
        <div className="absolute inset-0 bg-black/15" />
      </div>

      <Box
        variant="primary"
        shadow="none"
        className="border-border/40 relative z-10 aspect-square w-full items-center justify-center overflow-hidden border p-0 shadow-sm"
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
        <div
          data-testid="ambient-card-label"
          className={cn(
            'relative z-10 min-w-0 rounded-md border px-2 py-1.5 backdrop-blur-xl backdrop-saturate-150',
            tone === 'light'
              ? 'border-white/50 bg-white/70 text-neutral-950'
              : 'border-white/20 bg-black/45 text-white',
          )}
        >
          {title &&
            (onTitleClick ? (
              <button
                type="button"
                data-testid="ambient-card-title"
                onClick={(e) => {
                  e.stopPropagation();
                  onTitleClick();
                }}
                className="block w-full truncate text-left text-sm font-bold hover:underline"
              >
                {title}
              </button>
            ) : (
              <div
                data-testid="ambient-card-title"
                className="truncate text-sm font-bold"
              >
                {title}
              </div>
            ))}
          {subtitle && (
            <div
              className={cn(
                'truncate text-xs',
                tone === 'light' ? 'text-neutral-700' : 'text-white/85',
              )}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
