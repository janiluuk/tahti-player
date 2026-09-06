import { Link } from '@tanstack/react-router';
import { RadioTowerIcon } from 'lucide-react';

import { Box, Button, MediaArtwork, Tooltip } from '@tahti-player/ui';

import { resolvePublicVisualizerPreset } from '../api/channel-design';
import { ChannelVisualizer, type VisualColorScheme } from './ChannelVisualizer';

export type RadioListItemProps = {
  name: string;
  coverUrl?: string | null;
  /** Already-resolved status line — now-playing title/artist, "24/7
   * community stream", or "Temporarily offline". */
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
      className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden"
    >
      {isPlaying ? (
        <div className="pointer-events-none absolute inset-0 opacity-45">
          <ChannelVisualizer
            preset={resolvePublicVisualizerPreset(visualPreset)}
            colorScheme={colorScheme}
            colorSchemeJson={colorSchemeJson}
            visualSettingsJson={visualSettingsJson}
            artworkUrl={coverUrl ?? undefined}
            className="h-full min-h-28 w-full"
          />
        </div>
      ) : null}
      <div className="relative z-10 flex min-w-0 items-center gap-3">
        <MediaArtwork
          src={coverUrl}
          alt=""
          size="thumb"
          className="rounded-lg"
          placeholder={
            <RadioTowerIcon size={20} className="text-foreground-secondary" />
          }
          onPlay={onTogglePlay}
          isPlaying={isPlaying}
          playDisabled={disabled}
          playLabel="Play Radio"
          pauseLabel="Pause Radio"
        />
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-tight">{name}</div>
          <p className="text-foreground-secondary truncate text-xs">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="relative z-10 flex flex-wrap items-center gap-2">
        <Tooltip content="Open radio" side="top">
          <Link to={openHref}>
            <Button size="icon-sm" variant="secondary" aria-label="Open radio">
              <RadioTowerIcon size={16} aria-hidden />
            </Button>
          </Link>
        </Tooltip>
      </div>
    </Box>
  );
}
