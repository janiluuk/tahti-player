import { ArrowLeftIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { formatArtistNames } from '@tahti-player/model';
import { Button, cn, PlayerBar, Tooltip } from '@tahti-player/ui';

import { useIsMobile } from '../hooks/useIsMobile';
import { soundIdFromPlayableId } from '../lib/soundId';
import { useDominantColor } from '../lib/useDominantColor';
import { useLayoutStore } from '../stores/layoutStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { AddToPlaylistButton } from './AddToPlaylistButton';
import { ChannelVisualizer } from './ChannelVisualizer';
import { HearthisEmbedSurface } from './HearthisEmbedSurface';
import { ConnectedSeekBar, PlayerLiveIndicator } from './PlayerSeekBar';

const ANIMATION_MS = 280;

/** Full-viewport now-playing overlay — expand button in the player bar
 * opens it, X or Escape closes it back to the compact bar. Backdrop tint
 * follows the current track's cover art (sampled via useDominantColor)
 * since there's no per-track/channel colour override wired up for
 * arbitrary queue items yet — see the commit note for why that's
 * deliberately out of scope here. */
export function FullScreenPlayer() {
  const isMobile = useIsMobile();
  const open = useLayoutStore((s) => s.fullScreenPlayerOpen);
  const setOpen = useLayoutStore((s) => s.setFullScreenPlayerOpen);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const isLive = usePlayerStore((s) => s.isLive);
  const isRealLive = usePlayerStore((s) => s.isRealLive);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), ANIMATION_MS);
    return () => clearTimeout(t);
  }, [open]);

  const close = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, setOpen]);

  const current = queue.find((q) => q.id === currentId);
  const playable = current ? playableFromQueueItem(current) : null;
  const coverUrl = playable?.coverUrl ?? current?.track.artwork?.items[0]?.url;
  const title = playable?.title ?? 'Nothing playing';
  const artist =
    playable?.artist ??
    (current ? formatArtistNames(current.track.artists) : '');
  const soundId = soundIdFromPlayableId(playable?.id ?? currentId);
  const isPlaying = status === 'playing' || status === 'loading';
  const hearthisEmbed = playable?.embed;

  const rgb = useDominantColor(coverUrl);

  if (!mounted) {
    return null;
  }

  // background-color (opaque) + background-image (the tint) as two
  // separate properties -- the shorthand `background: <gradient>` was
  // replacing the element's only opaque layer with one whose center
  // stop is 35% alpha, so the page underneath showed straight through
  // the middle of the fixed overlay instead of being covered by it.
  const bgStyle = rgb
    ? {
        backgroundColor: 'var(--background)',
        backgroundImage: `radial-gradient(circle at 50% 20%, rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.18), transparent 70%)`,
      }
    : undefined;

  return (
    <div
      className={cn(
        'bg-background fixed inset-0 z-[60] flex flex-col overflow-hidden transition-all',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
      style={{ ...bgStyle, transitionDuration: `${ANIMATION_MS}ms` }}
      role="dialog"
      aria-modal="true"
      aria-label="Now playing, full screen"
    >
      <div className="bg-background/35 absolute inset-0 backdrop-blur-md">
        <ChannelVisualizer className="h-full w-full" artworkUrl={coverUrl} />
      </div>

      {/* Must outrank the content column below: that div is `absolute`'s
       * only in-flow sibling here, so flex-1 stretches it to cover this
       * same top strip. Equal z-index would let DOM order hand it click
       * priority over this back button despite the button painting on
       * top visually. */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start p-4">
        <Tooltip content="Back to player" side="right">
          <Button
            size="icon"
            variant="text"
            onClick={close}
            aria-label="Minimize player"
            className="size-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
          >
            <ArrowLeftIcon size={28} aria-hidden />
          </Button>
        </Tooltip>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-6 pb-10">
        <div
          className={cn(
            'border-border bg-background-secondary flex aspect-square w-64 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-2xl sm:w-80 md:w-96',
            isLive && 'p-6 sm:p-8',
          )}
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={isLive ? `${artist} logo` : ''}
              className={cn(
                'size-full',
                isLive ? 'object-contain' : 'object-cover',
              )}
            />
          ) : null}
        </div>

        <div className="bg-background/35 max-w-md rounded-xl px-6 py-3 text-center backdrop-blur-md">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {artist && (
            <p className="text-foreground-secondary mt-1 text-lg">{artist}</p>
          )}
          {soundId && playable ? (
            <div className="mt-3 flex justify-center">
              <AddToPlaylistButton
                soundId={soundId}
                trackTitle={title}
                variant="secondary"
                iconOnly={false}
              />
            </div>
          ) : null}
        </div>

        <div className="flex w-full max-w-md flex-col items-center gap-2">
          {hearthisEmbed ? (
            <HearthisEmbedSurface
              embedUri={hearthisEmbed.embedUri}
              title={title}
              autoplay={isPlaying}
            />
          ) : null}
          <PlayerBar.Controls
            size="large"
            isPlaying={isPlaying}
            isShuffleActive={!isLive && shuffle}
            repeatMode={isLive ? 'off' : repeatMode}
            showDiscovery={false}
            labels={{
              shuffleOn: isLive ? 'Shuffle (archive only)' : 'Shuffle on',
              shuffleOff: isLive ? 'Shuffle (archive only)' : 'Shuffle off',
              repeatOff: isLive ? 'Repeat (archive only)' : 'Repeat off',
              repeatAll: 'Repeat all',
              repeatOne: 'Repeat one',
            }}
            onPlayPause={() => {
              if (!playable) {
                return;
              }
              setStatus(isPlaying ? 'paused' : 'playing');
            }}
            onNext={next}
            onPrevious={previous}
            onShuffleToggle={toggleShuffle}
            onRepeatToggle={cycleRepeat}
          />
          {isLive && status === 'error' ? (
            <div className="text-foreground-secondary text-xs tracking-wide uppercase">
              Error
            </div>
          ) : isRealLive ? (
            <PlayerLiveIndicator />
          ) : isLive ? null : (
            <div className="w-full">
              <ConnectedSeekBar />
            </div>
          )}
          {/* Mobile has no software volume control (iOS Safari ignores
           * HTMLMediaElement.volume entirely) — the device's hardware
           * buttons are the only real control there, so the slider is
           * just dead UI on mobile. */}
          {!isMobile && (
            <PlayerBar.Volume
              value={muted ? 0 : Math.round(volume * 100)}
              onValueChange={(v) => setVolume(v / 100)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
