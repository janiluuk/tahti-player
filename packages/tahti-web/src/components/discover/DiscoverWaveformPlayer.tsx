import { PauseIcon, PlayIcon, XIcon } from 'lucide-react';

import { Button, Tooltip } from '@tahti-player/ui';

import type { DiscoverTrackItem, TahtiPlayable } from '../../api/types';
import { usePlayerStore } from '../../stores/playerStore';
import { WaveformSeekbar } from '../tahti/WaveformSeekbar';

export type DiscoverSelection = {
  item: DiscoverTrackItem;
  playable: TahtiPlayable;
};

export function DiscoverWaveformPlayer({
  selection,
  onClose,
}: {
  selection: DiscoverSelection;
  onClose: () => void;
}) {
  const currentId = usePlayerStore((state) => state.currentId);
  const status = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const currentPeaks = usePlayerStore((state) => state.currentPeaks);
  const play = usePlayerStore((state) => state.play);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const isCurrent = currentId === selection.playable.id;
  const isPlaying = isCurrent && (status === 'playing' || status === 'loading');
  const progress = isCurrent && duration > 0 ? currentTime / duration : 0;
  const peaks = (isCurrent ? currentPeaks : null) ?? selection.playable.peaks;

  return (
    <section
      className="border-border bg-background-secondary rounded-md border p-4 shadow-sm"
      aria-label="Waveform player"
    >
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="text"
          size="flexible"
          className="bg-foreground text-background hover:bg-foreground/90 flex size-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105"
          onClick={() => {
            if (isCurrent) {
              setStatus(isPlaying ? 'paused' : 'playing');
            } else {
              play(selection.playable);
            }
          }}
          aria-label={
            isPlaying ? 'Pause selected track' : 'Play selected track'
          }
        >
          {isPlaying ? <PauseIcon size={17} /> : <PlayIcon size={17} />}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {selection.playable.title}
          </p>
          <p className="text-foreground-secondary truncate text-xs">
            {selection.playable.artist}
          </p>
          <WaveformSeekbar
            trackId={selection.playable.id}
            progress={progress}
            peaks={peaks}
            label={selection.playable.title}
            durationSec={isCurrent ? duration : undefined}
            className="mt-3 h-9 w-full"
            onSeek={
              isCurrent && duration > 0
                ? (fraction) => seekTo(fraction * duration)
                : undefined
            }
          />
        </div>
        <Tooltip
          content="Close waveform player"
          side="top"
          wrapperClassName="shrink-0"
        >
          <Button
            type="button"
            variant="text"
            size="icon-sm"
            className="text-foreground-secondary hover:text-foreground shrink-0"
            onClick={onClose}
            aria-label="Close waveform player"
          >
            <XIcon size={16} />
          </Button>
        </Tooltip>
      </div>
    </section>
  );
}
