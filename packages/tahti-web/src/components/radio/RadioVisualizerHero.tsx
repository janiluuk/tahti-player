import type { ReactNode } from 'react';

import { Box, MediaArtwork } from '@tahti-player/ui';

import type { PublicChannel } from '../../api/types';
import { cn } from '../../lib/cn';
import { radioVisualizerPreset } from '../../lib/radioVisualizer';
import { ChannelVisualizer } from '../ChannelVisualizer';

/** Radio's on-air hero: the station visualizer as a large backdrop with one
 * thumbnail (the playing track's cover, else the station logo), what is
 * playing and the station actions laid over it. The scrim takes
 * `--radio-ambient` from the parent widget when set. When `embedded`, skip the outer Box so a
 * parent (RadioPlayerWidget) can own the chrome. */
export function RadioVisualizerHero({
  station,
  logoUrl,
  artworkUrl = null,
  info,
  actions,
  embedded = false,
  compact = false,
}: {
  station: PublicChannel;
  logoUrl: string | null;
  artworkUrl?: string | null;
  info: ReactNode;
  actions: ReactNode;
  embedded?: boolean;
  /** Short strip with a small logo, for the minimized player widget. */
  compact?: boolean;
}) {
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
            ? 'items-end gap-4 pr-14'
            : 'flex-col justify-between gap-6 sm:p-6',
        )}
      >
        <div data-testid="radio-station-logo" className="shrink-0 self-start">
          <MediaArtwork
            size="md"
            src={artworkUrl || logoUrl}
            alt={artworkUrl ? '' : 'Tahti Radio'}
            fit={artworkUrl ? 'cover' : 'contain'}
            className={cn(
              'bg-surface-secondary rounded-xl font-bold tracking-tight shadow-lg ring-1 ring-white/15',
              compact
                ? 'size-14 min-w-14 text-lg'
                : 'size-20 min-w-20 text-2xl sm:size-28 sm:min-w-28',
            )}
            placeholder="TR"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {info}
          <div className="flex flex-wrap items-start gap-3">{actions}</div>
        </div>
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
