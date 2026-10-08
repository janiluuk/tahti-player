import { MusicIcon } from 'lucide-react';

import { Button, cn } from '@tahti-player/ui';

import type { StudioSound } from '../../api/studio-types';
import { PageEmpty, PageError, PageLoading } from '../PageStates';
import { formatTrackDuration } from './visualizerEditorTracks';

export type VisualizerTrackPickerProps = {
  tracks: readonly StudioSound[];
  selectedId: string | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelect: (track: StudioSound) => void;
  playingId?: string | null;
};

export function VisualizerTrackPicker({
  tracks,
  selectedId,
  loading = false,
  error = null,
  onRetry,
  onSelect,
  playingId = null,
}: VisualizerTrackPickerProps) {
  if (loading) {
    return <PageLoading label="Loading tracks…" />;
  }
  if (error) {
    return (
      <PageError
        title="Could not load tracks"
        description={error}
        onRetry={onRetry}
      />
    );
  }
  if (tracks.length === 0) {
    return (
      <PageEmpty
        icon="package"
        title="No playable tracks"
        description="Upload a READY sound to preview a visualization against it."
      />
    );
  }

  return (
    <ul
      className="flex flex-col gap-1"
      data-testid="visualizer-track-picker"
      aria-label="Tracks"
    >
      {tracks.map((track) => {
        const selected = track.id === selectedId;
        const playing = track.id === playingId;
        const duration = formatTrackDuration(track.durationSec);
        return (
          <li key={track.id}>
            <Button
              type="button"
              variant="plain"
              size="flexible"
              aria-pressed={selected}
              aria-current={playing ? 'true' : undefined}
              onClick={() => onSelect(track)}
              className={cn(
                'border-border flex w-full items-center gap-3 rounded-lg border p-3 text-left whitespace-normal transition-colors active:scale-100',
                selected
                  ? 'border-primary bg-primary/10'
                  : 'hover:border-primary/50',
              )}
            >
              <span className="bg-background-secondary text-foreground-secondary flex size-10 shrink-0 items-center justify-center rounded-md">
                <MusicIcon size={18} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {track.title}
                </span>
                <span className="text-foreground-secondary block truncate text-xs">
                  {track.artistName || 'You'}
                  {duration ? ` · ${duration}` : ''}
                  {playing ? ' · Playing' : ''}
                </span>
              </span>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
