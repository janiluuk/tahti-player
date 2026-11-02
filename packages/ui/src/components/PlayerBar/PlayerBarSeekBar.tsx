import { FC } from 'react';

import '../../styles.css';

import { cn } from '../../utils';
import { formatTimeSeconds } from '../../utils/time';
import { useSeekBar } from './useSeekBar';

export type PlayerSeekBarProps = {
  progress: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  isLoading?: boolean;
  onSeek?: (percent: number) => void;
  className?: string;
};

export const PlayerBarSeekBar: FC<PlayerSeekBarProps> = ({
  progress,
  elapsedSeconds,
  remainingSeconds,
  isLoading = false,
  onSeek,
  className = '',
}) => {
  const {
    clamped,
    shown,
    dragging,
    containerRef,
    handleClick,
    handleKeyDown,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    isInteractive,
  } = useSeekBar({
    progress,
    isLoading,
    onSeek,
  });

  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 select-none',
        'text-foreground-secondary text-xs leading-none tabular-nums',
        className,
      )}
    >
      <span className="min-w-10 text-right" data-testid="player-seek-elapsed">
        {formatTimeSeconds(elapsedSeconds)}
      </span>
      <div
        ref={containerRef}
        data-testid="player-seek-bar"
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-valuetext={`${formatTimeSeconds(elapsedSeconds)} elapsed, ${formatTimeSeconds(Math.abs(remainingSeconds))} remaining`}
        tabIndex={isInteractive ? 0 : -1}
        className={cn(
          'group relative h-5 min-w-0 flex-1 touch-none rounded-full',
          'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          {
            'pointer-events-none cursor-not-allowed': isLoading,
            'cursor-pointer': isInteractive,
          },
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        aria-disabled={isLoading}
      >
        <div className="border-border bg-background-input pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full border-(length:--border-width)">
          {isLoading ? (
            <div className="bg-stripes-diagonal absolute inset-0 opacity-80" />
          ) : (
            <div
              className="bg-primary h-full rounded-l-full"
              style={{ width: `${shown}%` }}
            />
          )}
        </div>
        {isInteractive ? (
          <div
            data-testid="player-seek-thumb"
            className={cn(
              'border-border pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-(length:--border-width) bg-white shadow-sm',
              'scale-0 transition-transform duration-150 group-hover:scale-100 group-focus-visible:scale-100 motion-reduce:transition-none',
              { 'scale-100': dragging },
            )}
            style={{ left: `${shown}%` }}
          />
        ) : null}
      </div>
      <span className="min-w-10" data-testid="player-seek-remaining">
        {formatTimeSeconds(-Math.abs(remainingSeconds))}
      </span>
    </div>
  );
};
