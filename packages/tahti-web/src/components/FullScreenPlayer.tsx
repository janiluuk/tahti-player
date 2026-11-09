import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoreHorizontalIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { formatArtistNames } from '@tahti-player/model';
import {
  BackButton,
  Button,
  cn,
  MediaArtwork,
  PlayerBar,
  Tooltip,
} from '@tahti-player/ui';
import type { VisualizerMode } from '@tahti-player/visualizer';

import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe';
import { useIsMobile } from '../hooks/useIsMobile';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';
import { usePlayerStationNowPlaying } from '../hooks/useStationNowPlaying';
import {
  loadChannelVizMode,
  saveChannelVizMode,
} from '../lib/channelVizPreset';
import { soundIdFromPlayableId } from '../lib/soundId';
import { useDominantColor } from '../lib/useDominantColor';
import { useLayoutStore } from '../stores/layoutStore';
import { usePlaybackPrefsStore } from '../stores/playbackPrefsStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { AddToPlaylistButton } from './AddToPlaylistButton';
import { ChannelVisualizer } from './ChannelVisualizer';
import { EmbedSurface } from './EmbedSurface';
import { useHearthisEmbedClaimed } from './HearthisEmbedHost';
import { NowPlayingActionSheet } from './NowPlayingActionSheet';
import { ConnectedSeekBar, PlayerLiveIndicator } from './PlayerSeekBar';
import { VisualizerModeMenu } from './VisualizerModeMenu';

const ANIMATION_MS = 280;

/** Matches the back button: a light frosted circle that reads on any
 * artwork or visualizer behind it. */
const TOP_BUTTON_CLASS =
  'rounded-full border-0 bg-background/55 text-foreground shadow-none backdrop-blur-md hover:bg-background/80';

/** Same frosted chip for the elapsed / remaining times, at the player bar's
 * text size, so they stay readable over a bright visualizer frame. */
const SEEK_LABEL_CHIP =
  'bg-background/55 text-foreground rounded-full px-2 py-1 text-center text-xs backdrop-blur-md';

/** Full-viewport now-playing overlay — expand button in the player bar
 * opens it, X or Escape closes it back to the compact bar. Backdrop tint
 * follows the current track's cover art (sampled via useDominantColor)
 * since there's no per-track/channel colour override wired up for
 * arbitrary queue items yet — see the commit note for why that's
 * deliberately out of scope here.
 *
 * Browser “complete” fullscreen (`document.fullscreenElement`) is driving
 * mode: bigger art and transport, edge prev/next taps, secondary chrome
 * hidden. Touch swipe left/right always changes track while this overlay
 * is open. */
export function FullScreenPlayer() {
  const { t } = useTranslation('web');
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
  const keepScreenOn = usePlaybackPrefsStore((s) => s.keepScreenOn);

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [screenFilled, setScreenFilled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const canFillScreen =
    typeof document !== 'undefined' && document.fullscreenEnabled;
  const driving = screenFilled;

  useEffect(() => {
    const onChange = () => setScreenFilled(Boolean(document.fullscreenElement));
    onChange();
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleScreenFilled = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    void document.documentElement.requestFullscreen().catch(() => undefined);
  };

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    setMenuOpen(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
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
      if (e.key !== 'Escape') {
        return;
      }
      const target = e.target as Node | null;
      if (target === document.body || rootRef.current?.contains(target)) {
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
  const stationNowPlaying = usePlayerStationNowPlaying(playable);
  const title =
    stationNowPlaying?.title ?? playable?.title ?? t('player.nothingPlaying');
  const artist =
    stationNowPlaying?.artist ??
    playable?.artist ??
    (current ? formatArtistNames(current.track.artists) : '');
  const soundId = soundIdFromPlayableId(playable?.id ?? currentId);
  const channelKey =
    playable?.channelSlug?.trim() || soundId || currentId || 'default';
  const [engineMode, setEngineMode] = useState<VisualizerMode>(() =>
    loadChannelVizMode(channelKey),
  );
  useEffect(() => {
    setEngineMode(loadChannelVizMode(channelKey));
  }, [channelKey]);
  const onEngineModeChange = useMemo(
    () => (mode: VisualizerMode) => {
      setEngineMode(mode);
      saveChannelVizMode(channelKey, mode);
    },
    [channelKey],
  );
  const isPlaying = status === 'playing' || status === 'loading';
  useScreenWakeLock(open && (keepScreenOn || driving) && isPlaying);
  const isLoading = status === 'loading';
  const embed = playable?.embed;
  const embedHostedElsewhere = useHearthisEmbedClaimed();
  const restoredPending = usePlayerStore((s) => s.restoredPending);
  const reloadNonce = usePlayerStore((s) => s.reloadNonce);

  const rgb = useDominantColor(coverUrl);
  const swipe = useHorizontalSwipe({
    onPrev: previous,
    onNext: next,
    threshold: driving ? 40 : 60,
  });

  if (!mounted) {
    return null;
  }

  const bgStyle = rgb
    ? {
        backgroundColor: 'var(--background)',
        backgroundImage: `radial-gradient(circle at 50% 20%, rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.18), transparent 70%)`,
      }
    : undefined;

  const dialogLabel = driving
    ? t('player.nowPlayingDriving')
    : t('player.nowPlayingFullScreen');

  return (
    <div
      ref={rootRef}
      className={cn(
        'bg-background fixed inset-0 z-[60] flex flex-col overflow-hidden transition-all',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
      style={{ ...bgStyle, transitionDuration: `${ANIMATION_MS}ms` }}
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      data-driving={driving || undefined}
      data-testid="full-screen-player"
    >
      <div className="bg-background/35 absolute inset-0 backdrop-blur-md">
        <ChannelVisualizer
          className="h-full w-full"
          artworkUrl={coverUrl}
          engineMode={engineMode}
          showModeButtons={false}
        />
      </div>

      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <Tooltip content={t('player.backToPlayer')} side="right">
          <BackButton
            onClick={close}
            aria-label={t('player.minimize')}
            className={driving ? 'size-14' : undefined}
          />
        </Tooltip>
        <div className="flex items-start gap-2">
          {!driving ? (
            <VisualizerModeMenu
              mode={engineMode}
              onModeChange={onEngineModeChange}
              triggerClassName={cn(TOP_BUTTON_CLASS, 'size-12')}
              panelClassName="z-[70]"
            />
          ) : null}
          {canFillScreen ? (
            <Tooltip
              content={
                screenFilled
                  ? t('player.exitFullScreen')
                  : t('player.enterDrivingMode')
              }
              side="left"
            >
              <Button
                size="icon"
                variant="text"
                onClick={toggleScreenFilled}
                aria-label={
                  screenFilled
                    ? t('player.exitFullScreen')
                    : t('player.enterDrivingMode')
                }
                aria-pressed={screenFilled}
                className={cn(
                  TOP_BUTTON_CLASS,
                  driving ? 'size-14' : 'size-12',
                )}
              >
                {screenFilled ? (
                  <MinimizeIcon size={driving ? 28 : 22} aria-hidden />
                ) : (
                  <MaximizeIcon size={22} aria-hidden />
                )}
              </Button>
            </Tooltip>
          ) : null}
          {playable && !driving ? (
            <Tooltip
              content={t('player.moreOptionsFor', { title })}
              side="left"
            >
              <Button
                size="icon"
                variant="text"
                onClick={() => setMenuOpen(true)}
                aria-label={t('player.moreOptionsFor', { title })}
                aria-haspopup="dialog"
                className={cn(TOP_BUTTON_CLASS, 'size-12')}
              >
                <MoreHorizontalIcon size={22} aria-hidden />
              </Button>
            </Tooltip>
          ) : null}
        </div>
      </div>

      <div
        role="group"
        aria-label={t('player.swipeTracks')}
        aria-keyshortcuts="ArrowLeft ArrowRight"
        tabIndex={0}
        className="tahti-hide-scrollbar relative z-10 flex min-h-0 flex-1 touch-pan-y flex-col items-center justify-center-safe gap-4 overflow-y-auto px-6 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] outline-none"
        data-testid="full-screen-player-stage"
        {...swipe}
      >
        {driving ? (
          <>
            <button
              type="button"
              data-testid="driving-prev"
              className="absolute inset-y-16 left-0 z-10 w-[22%] max-w-40 cursor-pointer border-0 bg-transparent"
              aria-label={t('player.previous')}
              onClick={previous}
            />
            <button
              type="button"
              data-testid="driving-next"
              className="absolute inset-y-16 right-0 z-10 w-[22%] max-w-40 cursor-pointer border-0 bg-transparent"
              aria-label={t('player.next')}
              onClick={next}
            />
            <div
              className="pointer-events-none absolute inset-y-1/3 left-2 flex items-center opacity-40"
              aria-hidden
            >
              <ChevronLeftIcon size={40} />
            </div>
            <div
              className="pointer-events-none absolute inset-y-1/3 right-2 flex items-center opacity-40"
              aria-hidden
            >
              <ChevronRightIcon size={40} />
            </div>
          </>
        ) : null}

        <div
          className={cn(
            'flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-2xl',
            driving
              ? 'w-[min(20rem,48vh)] sm:w-[min(24rem,52vh)]'
              : 'w-[min(14rem,30vh)] sm:w-[min(18rem,34vh)] md:w-[min(22rem,36vh)]',
            isLive
              ? 'border-white/20 bg-white/10 p-6 inset-ring inset-ring-white/10 backdrop-blur-xl backdrop-saturate-150 sm:p-8'
              : 'border-border bg-background-secondary',
          )}
        >
          {coverUrl ? (
            <MediaArtwork
              src={coverUrl}
              alt={isLive ? `${artist} logo` : ''}
              fit={isLive ? 'contain' : 'cover'}
              imageReveal={false}
              className="relative size-full"
            />
          ) : null}
        </div>

        <div
          className={cn(
            'bg-background/35 max-w-md shrink-0 rounded-xl px-5 py-2 text-center backdrop-blur-md',
            driving && 'max-w-lg px-6 py-4',
          )}
        >
          <h1
            className={cn(
              'line-clamp-2 font-bold tracking-tight',
              driving ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl',
            )}
          >
            {title}
          </h1>
          {artist && (
            <p
              className={cn(
                'text-foreground-secondary mt-0.5 truncate',
                driving ? 'text-lg sm:text-xl' : 'text-base',
              )}
            >
              {artist}
            </p>
          )}
          {soundId && playable && !driving ? (
            <div className="mt-2 flex justify-center">
              <AddToPlaylistButton
                soundId={soundId}
                trackTitle={playable.title}
                variant="secondary"
                iconOnly={false}
              />
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            'flex w-full flex-col items-center gap-2',
            driving ? 'max-w-lg gap-4' : 'max-w-md',
          )}
        >
          {embed && !embedHostedElsewhere ? (
            <EmbedSurface
              provider={embed.provider}
              embedUri={embed.embedUri}
              title={title}
              autoplay={restoredPending !== playable?.id}
              mountKey={reloadNonce}
            />
          ) : null}
          <p
            role="status"
            className="text-foreground-secondary h-4 text-xs tracking-wide uppercase"
          >
            {isLoading ? t('player.buffering') : ''}
          </p>
          <PlayerBar.Controls
            hidePlayPause={Boolean(embed)}
            size="large"
            isPlaying={isPlaying}
            isLoading={isLoading}
            isShuffleActive={!isLive && shuffle}
            repeatMode={
              isLive ? (repeatMode === 'off' ? 'off' : 'all') : repeatMode
            }
            showDiscovery={false}
            showShuffle={!driving}
            showRepeat={!driving}
            labels={{
              shuffleOn: isLive
                ? t('player.shuffleArchiveOnly')
                : t('player.shuffleOn'),
              shuffleOff: isLive
                ? t('player.shuffleArchiveOnly')
                : t('player.shuffleOff'),
              repeatOff: isLive
                ? t('player.loopStationsOff')
                : t('player.repeatOff'),
              repeatAll: isLive
                ? t('player.loopStations')
                : t('player.repeatAll'),
              repeatOne: t('player.repeatOne'),
              next: t('player.next'),
              previous: t('player.previous'),
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
          ) : isLive ? null : driving ? (
            <div className="text-foreground-secondary w-full text-center text-sm tabular-nums">
              <ConnectedSeekBar labelClassName={SEEK_LABEL_CHIP} />
            </div>
          ) : (
            <div className="w-full">
              <ConnectedSeekBar labelClassName={SEEK_LABEL_CHIP} />
            </div>
          )}
          {!isMobile && !driving && (
            <PlayerBar.Volume
              value={muted ? 0 : Math.round(volume * 100)}
              onValueChange={(v) => setVolume(v / 100)}
            />
          )}
        </div>
      </div>
      {playable ? (
        <NowPlayingActionSheet
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          playable={playable}
        />
      ) : null}
    </div>
  );
}
