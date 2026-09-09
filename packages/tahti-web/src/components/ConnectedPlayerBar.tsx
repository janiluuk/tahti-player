import { useNavigate } from '@tanstack/react-router';
import {
  ListMusicIcon,
  Maximize2Icon,
  PauseIcon,
  PlayIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { formatArtistNames } from '@tahti-player/model';
import { Badge, Button, cn, PlayerBar, Tooltip } from '@tahti-player/ui';

import { useIsMobile } from '../hooks/useIsMobile';
import { soundIdFromPlayableId } from '../lib/soundId';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { AddToPlaylistButton } from './AddToPlaylistButton';
import { HearthisEmbedSurface } from './HearthisEmbedSurface';
import { PlayerLiveBadge } from './PlayerSeekBar';
import { SidebarQueuePanel } from './SidebarQueuePanel';
import { WaveformSeekbar } from './tahti/WaveformSeekbar';

const WAVEFORM_COMPACT = 'h-8';
const WAVEFORM_EXPANDED = 'h-14';

export function ConnectedPlayerBar() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const userId = useAuthStore((s) => s.user?.id);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const isLive = usePlayerStore((s) => s.isLive);
  const isRealLive = usePlayerStore((s) => s.isRealLive);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const playerBarVisible = usePlayerStore((s) => s.playerBarVisible);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const rightCollapsed = useLayoutStore((s) => s.rightCollapsed);
  const rightRailTab = useLayoutStore((s) => s.rightRailTab);
  const toggleQueueRail = useLayoutStore((s) => s.toggleQueueRail);
  const toggleBottomQueue = useLayoutStore((s) => s.toggleBottomQueue);
  const bottomQueueOpen = useLayoutStore((s) => s.bottomQueueOpen);
  const setFullScreenPlayerOpen = useLayoutStore(
    (s) => s.setFullScreenPlayerOpen,
  );

  const [waveformExpanded, setWaveformExpanded] = useState(false);
  const [signedOutPopoverOpen, setSignedOutPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const canUseRightRail = Boolean(userId) && !isMobile;
  const queueRailActive =
    canUseRightRail && !rightCollapsed && rightRailTab === 'queue';
  const queuePressed = canUseRightRail
    ? queueRailActive
    : isMobile
      ? bottomQueueOpen
      : signedOutPopoverOpen;

  const current = queue.find((q) => q.id === currentId);
  const playable = current ? playableFromQueueItem(current) : null;
  const isPlaying = status === 'playing' || status === 'loading';
  const hearthisEmbed = playable?.embed;

  useEffect(() => {
    if (!signedOutPopoverOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setSignedOutPopoverOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [signedOutPopoverOpen]);

  if (!playerBarVisible || !playable) {
    return null;
  }

  const title = playable?.title ?? 'Nothing playing';
  const provider =
    playable?.sourceProvider && playable.sourceProvider !== 'tahti'
      ? playable.sourceProvider
      : current?.track.source.provider &&
          current.track.source.provider !== 'tahti'
        ? current.track.source.provider
        : null;
  const artistBase =
    playable?.artist ??
    (current
      ? formatArtistNames(current.track.artists)
      : 'Pick a channel to listen');
  const artist = provider ? `${artistBase}, ${provider}` : artistBase;
  const soundId = soundIdFromPlayableId(playable?.id ?? currentId);
  const artistSlug = playable?.channelSlug;
  const progress = duration > 0 ? currentTime / duration : 0;
  const coverUrl = playable?.coverUrl ?? current?.track.artwork?.items[0]?.url;

  const onQueueClick = () => {
    if (canUseRightRail) {
      toggleQueueRail();
      return;
    }
    if (isMobile) {
      toggleBottomQueue();
      return;
    }
    setSignedOutPopoverOpen((open) => !open);
  };

  const onPlayPause = () => {
    if (!playable) {
      return;
    }
    setStatus(isPlaying ? 'paused' : 'playing');
  };

  const controls = (
    <div className="flex flex-col items-center gap-1">
      <PlayerBar.Controls
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
        onPlayPause={onPlayPause}
        onNext={next}
        onPrevious={previous}
        onShuffleToggle={toggleShuffle}
        onRepeatToggle={cycleRepeat}
      />
      {isLive && status === 'error' ? (
        <div className="text-foreground-secondary text-xs tracking-wide uppercase">
          Error
        </div>
      ) : null}
    </div>
  );

  const mobilePlayPauseButton = (
    <Button
      size="icon"
      onClick={onPlayPause}
      className={cn(
        'size-12 shrink-0 rounded-full shadow-md',
        isPlaying &&
          'bg-accent-green active:bg-accent-green text-black active:text-black',
      )}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      aria-pressed={isPlaying}
      data-testid={isPlaying ? 'player-pause-button' : 'player-play-button'}
    >
      {isPlaying ? (
        <PauseIcon size={22} />
      ) : (
        <PlayIcon size={22} className="ml-0.5" />
      )}
    </Button>
  );

  const queueLabel = queuePressed
    ? 'Hide queue'
    : queue.length > 1
      ? `Show queue, ${queue.length} in queue`
      : 'Show queue';

  const queueButton = (
    <div className="relative">
      <Tooltip content={queueLabel} side="top">
        <Button
          size="icon-sm"
          variant={queuePressed ? 'secondary' : 'text'}
          onClick={onQueueClick}
          aria-label={queueLabel}
          aria-pressed={queuePressed}
          data-testid={
            queuePressed ? 'close-bottom-queue' : 'open-bottom-queue'
          }
        >
          <ListMusicIcon size={16} />
        </Button>
      </Tooltip>
      {queue.length > 1 ? (
        <Badge
          variant="pill"
          color="blue"
          className="bg-primary text-primary-foreground pointer-events-none absolute -top-0.5 -right-0.5 min-w-4 px-1 text-center text-[9px] font-bold tabular-nums"
        >
          {queue.length}
        </Badge>
      ) : null}
    </div>
  );

  const waveform = isLive ? null : (
    <div className="px-4 pt-1">
      <WaveformSeekbar
        trackId={playable?.id ?? currentId ?? 'none'}
        progress={progress}
        onSeek={(fraction) => {
          if (duration <= 0) {
            return;
          }
          seekTo(fraction * duration);
        }}
        className={cn(
          'w-full transition-[height] duration-200',
          waveformExpanded ? WAVEFORM_EXPANDED : WAVEFORM_COMPACT,
        )}
      />
    </div>
  );

  const hearthisPanel = hearthisEmbed ? (
    <div className="bg-background-secondary px-4 py-2">
      <HearthisEmbedSurface
        embedUri={hearthisEmbed.embedUri}
        title={title}
        autoplay={isPlaying}
        compact
      />
      <p className="text-foreground-secondary mt-1 text-center text-[11px]">
        Playback is controlled by the hearthis.at widget.
      </p>
    </div>
  ) : null;

  if (isMobile) {
    return (
      <div className="flex w-full flex-col">
        {waveform}
        {hearthisPanel}
        <div className="flex w-full items-center gap-3 px-4 py-2">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            onClick={() => setFullScreenPlayerOpen(true)}
            aria-label="Open full-screen player"
            data-testid="expand-full-screen-player"
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                className="size-10 shrink-0 rounded-md object-cover"
              />
            ) : null}
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {title}
              </span>
              <span className="text-foreground-secondary block truncate text-xs">
                {artist}
              </span>
            </span>
            {isRealLive ? <PlayerLiveBadge /> : null}
          </button>
          {mobilePlayPauseButton}
          {queueButton}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {waveform}
      {hearthisPanel}
      <PlayerBar
        left={
          <div className="flex min-w-0 items-center gap-2">
            <PlayerBar.NowPlaying
              title={title}
              artist={artist}
              coverUrl={coverUrl}
              action={isRealLive ? <PlayerLiveBadge /> : undefined}
              onTitleClick={
                isLive
                  ? undefined
                  : () => setWaveformExpanded((expanded) => !expanded)
              }
              onArtistClick={
                artistSlug
                  ? () => {
                      void navigate({
                        to: '/u/$username',
                        params: { username: artistSlug },
                      });
                    }
                  : undefined
              }
            />
            {soundId && playable && (
              <AddToPlaylistButton
                soundId={soundId}
                trackTitle={playable.title}
                variant="secondary"
              />
            )}
          </div>
        }
        center={
          <div className="flex w-full max-w-xl flex-col items-center">
            {controls}
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <Tooltip content="Full screen" side="top">
              <Button
                size="icon-sm"
                variant="text"
                disabled={!playable}
                onClick={() => setFullScreenPlayerOpen(true)}
                aria-label="Full screen"
                data-testid="expand-full-screen-player"
              >
                <Maximize2Icon size={16} />
              </Button>
            </Tooltip>
            <PlayerBar.Volume
              value={muted ? 0 : Math.round(volume * 100)}
              onValueChange={(v) => setVolume(v / 100)}
              muted={muted}
              onMuteToggle={toggleMute}
            />
            {!canUseRightRail && !isMobile ? (
              <div className="relative" ref={popoverRef}>
                {queueButton}
                {signedOutPopoverOpen ? (
                  <div className="border-border bg-background absolute right-0 bottom-full z-50 mb-2 w-80 overflow-hidden rounded-md border shadow-lg">
                    <SidebarQueuePanel compact />
                  </div>
                ) : null}
              </div>
            ) : (
              queueButton
            )}
          </div>
        }
      />
    </div>
  );
}
