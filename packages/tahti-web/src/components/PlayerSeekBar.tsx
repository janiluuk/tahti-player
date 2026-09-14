import { Badge, cn, PlayerBar } from '@tahti-player/ui';

import { usePlayerStore } from '../stores/playerStore';

/** Isolated so `currentTime`'s ~4x/sec `timeupdate` ticks only re-render this
 * small subtree, not whatever player surface it's embedded in (NowPlaying,
 * volume, queue controls, visualizer, etc. -- none of which depend on
 * playback position). Shared by the compact player bar and the full-screen
 * overlay. */
export function ConnectedSeekBar({ className }: { className?: string }) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const status = usePlayerStore((s) => s.status);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const seekProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerBar.SeekBar
      className={className}
      progress={seekProgress}
      elapsedSeconds={currentTime}
      remainingSeconds={Math.max(0, duration - currentTime)}
      isLoading={status === 'loading'}
      onSeek={(percent) => {
        if (duration <= 0) {
          return;
        }
        seekTo((percent / 100) * duration);
      }}
    />
  );
}

/** Replaces the seek bar for a live stream, which has no duration/position
 * to show — occupies the same slot (so the layout doesn't jump when
 * switching between live and on-demand playback) but renders no track,
 * just a small translucent "Live" badge anchored to the left corner where
 * the seek bar's elapsed-time label would otherwise sit. Used by the
 * full-screen player, which has room to spare; the compact bottom bar uses
 * PlayerLiveBadge instead, inline, so live playback doesn't reserve a
 * whole extra row it doesn't need. */
export function PlayerLiveIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-6 w-full', className)}>
      <Badge
        variant="pill"
        color="red"
        className="border-accent-red/40 bg-accent-red/10 text-accent-red absolute top-1/2 left-0 -translate-y-1/2 gap-1.5 px-2 py-0.5 text-[10px] tracking-wide"
      >
        <span
          className="bg-accent-red size-1.5 rounded-full motion-safe:animate-pulse"
          aria-hidden
        />
        Live
      </Badge>
    </div>
  );
}

/** Compact "rec light" for the bottom player bar's own NowPlaying row —
 * just the blinking dot plus label, sized to sit inline next to the
 * title/artist instead of claiming a full-width row above the bar (see
 * PlayerLiveIndicator, used where that room already exists). */
export function PlayerLiveBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="pill"
      color="red"
      className={cn(
        'border-accent-red/40 bg-accent-red/10 text-accent-red shrink-0 gap-1.5 px-2 py-0.5 text-[10px] tracking-wide',
        className,
      )}
    >
      <span
        className="bg-accent-red size-1.5 rounded-full motion-safe:animate-pulse"
        aria-hidden
      />
      Live
    </Badge>
  );
}
