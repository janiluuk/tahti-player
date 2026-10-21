import { PauseIcon, PlayIcon } from 'lucide-react';

import { Button, PlayerBar, Tooltip } from '@tahti-player/ui';

import { usePlayerStore } from '../../../stores/playerStore';

/** Mini transport for the collection's current track. It owns the
 * `currentTime`/`duration` subscriptions so the (very large) editor view
 * doesn't re-render on every playback tick. */
export function NowPlayingBar({ title }: { title: string }) {
  const status = usePlayerStore((s) => s.status);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const isPlaying = status === 'playing' || status === 'loading';

  return (
    <div className="border-border bg-background-input flex items-center gap-3 rounded-lg border px-3 py-2">
      <Tooltip content={isPlaying ? 'Pause' : 'Play'} side="top">
        <Button
          size="icon-sm"
          variant="text"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={() => setStatus(isPlaying ? 'paused' : 'playing')}
        >
          {isPlaying ? (
            <PauseIcon size={16} aria-hidden />
          ) : (
            <PlayIcon size={16} aria-hidden />
          )}
        </Button>
      </Tooltip>
      <span className="max-w-[40%] shrink-0 truncate text-sm font-medium">
        {title}
      </span>
      <PlayerBar.SeekBar
        className="min-w-0 flex-1"
        progress={duration > 0 ? (currentTime / duration) * 100 : 0}
        elapsedSeconds={currentTime}
        remainingSeconds={Math.max(0, duration - currentTime)}
        isLoading={status === 'loading'}
        onSeek={
          duration > 0
            ? (percent) => seekTo((percent / 100) * duration)
            : undefined
        }
      />
    </div>
  );
}
