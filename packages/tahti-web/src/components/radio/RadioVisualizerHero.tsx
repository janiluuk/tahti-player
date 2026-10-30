import type { ReactNode } from 'react';

import { Box, MediaArtwork } from '@tahti-player/ui';

import type { PublicChannel } from '../../api/types';
import { radioVisualizerPreset } from '../../lib/radioVisualizer';
import { ChannelVisualizer } from '../ChannelVisualizer';

/** Radio's on-air hero: the station visualizer as a large backdrop with the
 * station logo (the only Tahti Radio logo on the page), what is playing and
 * the station actions laid over it. */
export function RadioVisualizerHero({
  station,
  logoUrl,
  info,
  actions,
}: {
  station: PublicChannel;
  logoUrl: string | null;
  info: ReactNode;
  actions: ReactNode;
}) {
  return (
    <Box
      variant="secondary"
      className="relative flex min-h-[340px] flex-col overflow-hidden rounded-xl p-0 sm:min-h-[440px]"
      data-testid="radio-visualizer-hero"
    >
      <div className="absolute inset-0 opacity-80">
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
        className="from-background/90 via-background/30 absolute inset-0 bg-linear-to-t to-transparent"
      />
      <div className="relative z-10 flex flex-1 flex-col justify-between gap-6 p-4 sm:p-6">
        <div data-testid="radio-station-logo" className="self-start">
          <MediaArtwork
            size="md"
            src={logoUrl}
            alt="Tahti Radio"
            fit="contain"
            className="bg-surface-secondary size-20 min-w-20 rounded-xl text-2xl font-bold tracking-tight sm:size-28 sm:min-w-28"
            placeholder="TR"
          />
        </div>
        <div className="flex flex-col gap-4">
          {info}
          <div className="flex flex-wrap items-start gap-3">{actions}</div>
        </div>
      </div>
    </Box>
  );
}
