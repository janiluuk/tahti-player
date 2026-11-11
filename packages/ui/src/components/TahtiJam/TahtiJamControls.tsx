import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { FC } from 'react';

import { RepeatMode } from '@tahti-player/model';

import { cn } from '../../utils';
import { formatTimeSeconds } from '../../utils/time';
import { Button } from '../Button';
import { useSeekBar } from '../PlayerBar/useSeekBar';
import { Tooltip } from '../Tooltip';
import { useUiLabels } from '../UiLabels';

export type TahtiJamControlsProps = {
  isPlaying: boolean;
  isLoading?: boolean;
  shuffleActive: boolean;
  repeatMode: RepeatMode;
  isDiscoveryActive?: boolean;
  progress: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  onDiscoveryToggle?: () => void;
  onSeek: (percent: number) => void;
  className?: string;
};

export const TahtiJamControls: FC<TahtiJamControlsProps> = ({
  isPlaying,
  isLoading = false,
  shuffleActive,
  repeatMode,
  progress,
  elapsedSeconds,
  remainingSeconds,
  onPlayPause,
  onNext,
  onPrevious,
  onShuffleToggle,
  onRepeatToggle,
  onSeek,
  className,
}) => {
  const { clamped, containerRef, handleClick, isInteractive } = useSeekBar({
    progress,
    isLoading,
    onSeek,
  });
  const labels = useUiLabels();
  const repeatLabel =
    repeatMode === 'off'
      ? labels.repeatOff
      : repeatMode === 'one'
        ? labels.repeatOne
        : labels.repeatAll;

  return (
    <div
      className={cn(
        'border-border shrink-0 border-t-(length:--border-width) border-b-0 px-4 py-4',
        className,
      )}
    >
      <div className="flex items-center justify-center gap-1">
        <Tooltip
          content={shuffleActive ? labels.shuffleOn : labels.shuffleOff}
          side="top"
        >
          <Button
            size="icon"
            variant={shuffleActive ? 'default' : 'text'}
            onClick={onShuffleToggle}
            aria-label={shuffleActive ? labels.shuffleOn : labels.shuffleOff}
            aria-pressed={shuffleActive}
            data-testid="jam-shuffle-button"
          >
            <Shuffle size={18} />
          </Button>
        </Tooltip>

        <Tooltip content={labels.previous} side="top">
          <Button
            size="icon"
            variant="text"
            onClick={onPrevious}
            aria-label={labels.previous}
            data-testid="jam-previous-button"
          >
            <SkipBack size={24} />
          </Button>
        </Tooltip>

        <Tooltip content={isPlaying ? labels.pause : labels.play} side="top">
          <Button
            size="icon"
            variant="default"
            onClick={onPlayPause}
            className="size-14"
            aria-label={isPlaying ? labels.pause : labels.play}
            aria-pressed={isPlaying}
            data-testid={isPlaying ? 'jam-pause-button' : 'jam-play-button'}
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </Button>
        </Tooltip>

        <Tooltip content={labels.next} side="top">
          <Button
            size="icon"
            variant="text"
            onClick={onNext}
            aria-label={labels.next}
            data-testid="jam-next-button"
          >
            <SkipForward size={24} />
          </Button>
        </Tooltip>

        <Tooltip content={repeatLabel} side="top">
          <Button
            size="icon"
            variant={repeatMode !== 'off' ? 'default' : 'text'}
            onClick={onRepeatToggle}
            aria-label={repeatLabel}
            aria-pressed={repeatMode !== 'off'}
            data-testid="jam-repeat-button"
          >
            {repeatMode === 'one' ? (
              <Repeat1 size={18} />
            ) : (
              <Repeat size={18} />
            )}
          </Button>
        </Tooltip>
      </div>

      <div className="mt-3 w-full select-none">
        <div
          ref={containerRef}
          className={cn(
            'border-border bg-background-secondary relative h-5 w-full overflow-hidden rounded-md border-(length:--border-width)',
            {
              'cursor-pointer': isInteractive,
              'pointer-events-none': isLoading,
            },
          )}
          onClick={handleClick}
        >
          <div className="absolute right-0 left-0 z-10 flex h-full items-center justify-between px-2 text-xs">
            <span className="text-foreground tabular-nums">
              {formatTimeSeconds(elapsedSeconds)}
            </span>
            <span className="text-foreground tabular-nums">
              {formatTimeSeconds(-Math.abs(remainingSeconds))}
            </span>
          </div>
          {isLoading ? (
            <div className="bg-stripes-diagonal absolute inset-0 opacity-80" />
          ) : (
            <div
              className="bg-primary h-full transition-none"
              style={{ width: `${clamped}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
