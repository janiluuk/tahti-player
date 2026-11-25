import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Box, MediaArtwork } from '@tahti-player/ui';

import type { PublicChannel } from '../../api/types';
import { cn } from '../../lib/cn';
import { radioVisualizerPreset } from '../../lib/radioVisualizer';
import { ChannelVisualizer } from '../ChannelVisualizer';

export type RadioHeroLiveChannel = { slug: string; name: string };

/** Radio's on-air hero: the station visualizer as a large backdrop with one
 * thumbnail (the playing track's cover, else the station logo), what is
 * playing and the station actions laid over it. The scrim takes
 * `--radio-ambient` from the parent widget when set. When `embedded`, skip the outer Box so a
 * parent (RadioPlayerWidget) can own the chrome. */
export function RadioVisualizerHero({
  station,
  logoUrl,
  artworkUrl = null,
  liveChannel = null,
  info,
  actions,
  playControl,
  embedded = false,
  compact = false,
}: {
  station: PublicChannel;
  logoUrl: string | null;
  artworkUrl?: string | null;
  liveChannel?: RadioHeroLiveChannel | null;
  info: ReactNode;
  actions: ReactNode;
  /** Rendered in the bottom-left corner of the expanded hero; the compact
   * strip leaves it to the parent. */
  playControl?: ReactNode;
  embedded?: boolean;
  /** Short strip with a small logo, for the minimized player widget. */
  compact?: boolean;
}) {
  const { t } = useTranslation('web');
  const thumbClass =
    'bg-surface-secondary rounded-xl shadow-lg ring-1 ring-white/15';
  const sizeClass = compact
    ? 'size-14 min-w-14 text-lg'
    : 'size-28 min-w-28 text-3xl sm:size-44 sm:min-w-44 sm:text-5xl';
  const body = (
    <>
      <div className="absolute inset-0">
        <ChannelVisualizer
          preset={radioVisualizerPreset(station.slug, station.visualPreset)}
          colorSchemeJson={station.colorSchemeJson}
          visualSettingsJson={station.visualSettingsJson}
          showModeButtons={false}
          className="size-full"
        />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-[rgb(var(--radio-ambient,12_12_16)/0.7)] via-[rgb(var(--radio-ambient,12_12_16)/0.15)] to-transparent"
      />
      <div
        className={cn(
          'relative z-10 flex flex-1 p-4',
          compact
            ? 'items-end gap-3 pr-20 sm:gap-4 sm:pr-32'
            : 'flex-col justify-end gap-5 sm:p-6',
        )}
      >
        <div
          className={cn(
            'flex min-w-0',
            compact ? 'contents' : 'items-end gap-4 sm:gap-6',
          )}
        >
          <div data-testid="radio-station-logo" className="shrink-0 self-end">
            {liveChannel ? (
              <Link
                to="/channel/$slug"
                params={{ slug: liveChannel.slug }}
                aria-label={t('radio.openLiveChannel', {
                  name: liveChannel.name,
                })}
                className="block"
              >
                <MediaArtwork
                  size="md"
                  src={artworkUrl}
                  alt=""
                  seed={liveChannel.slug}
                  fit="cover"
                  className={cn(thumbClass, sizeClass)}
                />
              </Link>
            ) : (
              <MediaArtwork
                size="md"
                src={artworkUrl || logoUrl}
                alt={artworkUrl ? '' : 'Tahti Radio'}
                fit={artworkUrl ? 'cover' : 'contain'}
                className={cn(
                  thumbClass,
                  'font-bold tracking-tight',
                  sizeClass,
                )}
                placeholder="TR"
              />
            )}
          </div>
          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col gap-4',
              compact ? '' : 'self-end',
            )}
          >
            {info}
            {compact ? (
              <div className="flex flex-wrap items-center gap-3">{actions}</div>
            ) : null}
          </div>
        </div>
        {compact ? null : (
          <div
            className="flex flex-wrap items-center gap-3"
            data-testid="radio-hero-controls"
          >
            {playControl}
            {actions}
          </div>
        )}
      </div>
    </>
  );

  const shellClass = cn(
    'relative flex flex-col overflow-hidden p-0',
    compact ? 'min-h-[160px]' : 'min-h-[340px] sm:min-h-[440px]',
  );

  if (embedded) {
    return (
      <div
        className={shellClass}
        data-testid="radio-visualizer-hero"
        data-compact={compact || undefined}
      >
        {body}
      </div>
    );
  }

  return (
    <Box
      variant="secondary"
      className={cn(shellClass, 'rounded-xl')}
      data-testid="radio-visualizer-hero"
    >
      {body}
    </Box>
  );
}
