import { RadioTowerIcon } from 'lucide-react';

import { Box, ButtonLink, MediaArtwork, Tooltip } from '@tahti-player/ui';

import { prefetchHls } from '../lib/hlsLoader';
import { radioVisualizerPreset } from '../lib/radioVisualizer';
import { ChannelVisualizer, type VisualColorScheme } from './ChannelVisualizer';

export type RadioListItemProps = {
  name: string;
  coverUrl?: string | null;
  /** Already-resolved status line — now-playing title/artist, "24/7
   * community stream", or "Off air". */
  subtitle: string;
  isPlaying: boolean;
  /** True when there's no live stream to play (e.g. no hlsUrl yet). */
  disabled?: boolean;
  onTogglePlay: () => void;
  /** Destination for the secondary "Open radio" action. */
  openHref?: string;
  visualPreset?: string | null;
  colorScheme?: VisualColorScheme | null;
  colorSchemeJson?: string | null;
  visualSettingsJson?: string | null;
};

/** Tahti Radio row on the Listen page — cover art with a hover play
 * control, now-playing text, a live audio-reactive backdrop while
 * playing, and a shortcut into the full Radio page. */
export function RadioListItem({
  name,
  coverUrl,
  subtitle,
  isPlaying,
  disabled,
  onTogglePlay,
  openHref = '/radio',
  visualPreset,
  colorScheme,
  colorSchemeJson,
  visualSettingsJson,
}: RadioListItemProps) {
  return (
    <Box
      variant="secondary"
      className="relative items-stretch justify-between gap-3 overflow-hidden p-0"
    >
      {isPlaying ? (
        <div className="pointer-events-none absolute inset-0 opacity-45">
          <ChannelVisualizer
            preset={radioVisualizerPreset(
              openHref.split('/').filter(Boolean).at(-1) === 'radio'
                ? 'tahti-radio'
                : openHref.split('/').filter(Boolean).at(-1) || name,
              visualPreset,
            )}
            colorScheme={colorScheme}
            colorSchemeJson={colorSchemeJson}
            visualSettingsJson={visualSettingsJson}
            artworkUrl={coverUrl ?? undefined}
            className="h-full min-h-28 w-full"
          />
        </div>
      ) : null}
      <div
        className="relative z-10 flex min-w-0 flex-1 items-stretch gap-3"
        onPointerEnter={disabled ? undefined : prefetchHls}
        onFocus={disabled ? undefined : prefetchHls}
      >
        <div className="relative min-h-24 w-24 shrink-0 self-stretch">
          <MediaArtwork
            src={coverUrl}
            alt=""
            size="fill"
            placeholder={
              <RadioTowerIcon size={24} className="text-foreground-secondary" />
            }
            onPlay={onTogglePlay}
            isPlaying={isPlaying}
            playDisabled={disabled}
            playLabel="Play Radio"
            pauseLabel="Pause Radio"
          />
        </div>
        <div className="flex min-w-0 flex-col justify-center py-3">
          <div className="text-sm font-bold tracking-tight">{name}</div>
          <p className="text-foreground-secondary truncate text-xs">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="relative z-10 flex shrink-0 items-center gap-2 pr-3">
        <Tooltip content="Open radio" side="top">
          <ButtonLink
            to={openHref}
            size="icon-sm"
            variant="secondary"
            aria-label="Open radio"
          >
            <RadioTowerIcon size={16} aria-hidden />
          </ButtonLink>
        </Tooltip>
      </div>
    </Box>
  );
}
