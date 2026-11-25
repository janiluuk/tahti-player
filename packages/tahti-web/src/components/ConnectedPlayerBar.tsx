import { useNavigate } from '@tanstack/react-router';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ListMusicIcon,
  Maximize2Icon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { formatArtistNames } from '@tahti-player/model';
import {
  Badge,
  Button,
  cn,
  InlineError,
  Loader,
  MarqueeText,
  MediaArtwork,
  OverflowMenu,
  PlayerBar,
  Tooltip,
} from '@tahti-player/ui';

import { TAHTI_RADIO_SLUG } from '../api/client';
import { radioStationIdForPlayable } from '../content/radioStations';
import { useIsMobile } from '../hooks/useIsMobile';
import { usePhonePlayerMinimized } from '../hooks/usePhonePlayerMinimized';
import { usePlaybackErrorToast } from '../hooks/usePlaybackErrorToast';
import { usePlayerStationNowPlaying } from '../hooks/useStationNowPlaying';
import { soundIdFromPlayableId } from '../lib/soundId';
import { streamFailureLabel } from '../lib/streamFailure';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { AddToPlaylistButton } from './AddToPlaylistButton';
import { useHearthisEmbedClaimed } from './HearthisEmbedHost';
import { ConnectedSeekBar, PlayerLiveBadge } from './PlayerSeekBar';
import { EmbedSlot } from './PlayingEmbedDock';
import { SidebarQueuePanel } from './SidebarQueuePanel';

export function ConnectedPlayerBar() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [phoneMinimized, setPhoneMinimized] = usePhonePlayerMinimized();
  const userId = useAuthStore((s) => s.user?.id);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const failure = usePlayerStore((s) => s.failure);
  const retry = usePlayerStore((s) => s.retry);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const isLive = usePlayerStore((s) => s.isLive);
  const isRealLive = usePlayerStore((s) => s.isRealLive);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const playerBarVisible = usePlayerStore((s) => s.playerBarVisible);
  const hidePlayerBar = usePlayerStore((s) => s.hidePlayerBar);
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
  const fullScreenPlayerOpen = useLayoutStore((s) => s.fullScreenPlayerOpen);

  const [signedOutPopoverOpen, setSignedOutPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const playerBarEnterPlayedRef = useRef(false);
  const [playerBarEnterClass, setPlayerBarEnterClass] = useState('');

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
  usePlaybackErrorToast(playable?.title);
  const isPlaying = status === 'playing' || status === 'loading';
  const isLoading = status === 'loading';
  const embed = playable?.embed;
  const hearthisHostedInRow = useHearthisEmbedClaimed();

  useEffect(() => {
    if (playerBarEnterPlayedRef.current || queue.length === 0) {
      return;
    }
    if (!playerBarVisible || !playable) {
      return;
    }
    playerBarEnterPlayedRef.current = true;
    setPlayerBarEnterClass('tahti-player-bar-enter motion-reduce:animate-none');
  }, [playerBarVisible, playable, queue.length]);

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

  // A catalog radio station is queued under its own name; while it plays the
  // title shows what the station says is on, and the name moves to the
  // second line.
  const stationNowPlaying = usePlayerStationNowPlaying(playable);

  if (!playerBarVisible || !playable) {
    return null;
  }

  const title =
    stationNowPlaying?.title ?? playable?.title ?? t('player.nothingPlaying');
  const provider =
    playable?.sourceProvider && playable.sourceProvider !== 'tahti'
      ? playable.sourceProvider
      : current?.track.source.provider &&
          current.track.source.provider !== 'tahti'
        ? current.track.source.provider
        : null;
  const artistBase =
    stationNowPlaying?.artist ??
    playable?.artist ??
    (current
      ? formatArtistNames(current.track.artists)
      : t('player.pickChannel'));
  // "internet-radio" is an internal provider id, not a source worth naming.
  const artist =
    provider && provider !== 'internet-radio'
      ? `${artistBase}, ${provider}`
      : artistBase;
  const soundId = soundIdFromPlayableId(playable?.id ?? currentId);
  const artistSlug = playable?.channelSlug;
  const radioStationId = playable
    ? radioStationIdForPlayable(playable)
    : undefined;
  const openRadioStation = radioStationId
    ? () => {
        void navigate({
          to: '/radio/station/$stationId',
          params: { stationId: radioStationId },
        });
      }
    : undefined;
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
        hidePlayPause={Boolean(embed)}
        isPlaying={isPlaying}
        isLoading={isLoading}
        isShuffleActive={!isLive && shuffle}
        repeatMode={
          isLive ? (repeatMode === 'off' ? 'off' : 'all') : repeatMode
        }
        showDiscovery={false}
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
          repeatAll: isLive ? t('player.loopStations') : t('player.repeatAll'),
          repeatOne: t('player.repeatOne'),
          next: t('player.next'),
          previous: t('player.previous'),
          play: t('actions.playItem', { title }),
          pause: t('actions.pauseItem', { title }),
        }}
        onPlayPause={onPlayPause}
        onNext={next}
        onPrevious={previous}
        onShuffleToggle={toggleShuffle}
        onRepeatToggle={cycleRepeat}
      />
      {status === 'error' ? (
        <div
          className="flex flex-wrap items-center gap-x-2"
          data-testid="player-error-note"
        >
          <InlineError textSize="xs" announce={false}>
            {isLive
              ? `${t('player.stationUnavailable')}${failure ? ` · ${streamFailureLabel(failure)}` : ''}`
              : t('player.cantPlay')}
          </InlineError>
          <Button size="xs" variant="text" onClick={retry}>
            {t('actions.tryAgain')}
          </Button>
        </div>
      ) : null}
    </div>
  );

  const playPauseLabel = isPlaying
    ? t('actions.pauseItem', { title })
    : t('actions.playItem', { title });

  const mobilePlayPauseButton = (
    <Tooltip content={playPauseLabel} side="top" wrapperClassName="shrink-0">
      <Button
        size="icon"
        onClick={onPlayPause}
        className={cn(
          'size-16 shrink-0 rounded-full shadow-md',
          isPlaying &&
            'bg-accent-green active:bg-accent-green text-black active:text-black',
        )}
        aria-label={playPauseLabel}
        aria-pressed={isPlaying}
        aria-busy={isLoading || undefined}
        data-testid={isPlaying ? 'player-pause-button' : 'player-play-button'}
      >
        {isLoading ? (
          <Loader
            shape="circle"
            size={28}
            data-testid="player-loading-spinner"
          />
        ) : isPlaying ? (
          <PauseIcon size={28} />
        ) : (
          <PlayIcon size={28} className="ml-0.5" />
        )}
      </Button>
    </Tooltip>
  );

  const queueLabel = queuePressed
    ? t('player.hideQueue')
    : queue.length > 1
      ? t('player.showQueueCount', { count: queue.length })
      : t('player.showQueue');

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
          data-testid="queue-count-badge"
          className="bg-primary text-primary-foreground ring-background pointer-events-none absolute -top-2 -right-2.5 h-4 min-w-4 px-1 py-0 text-center text-[9px] leading-4 font-bold tabular-nums ring-2"
        >
          {queue.length}
        </Badge>
      ) : null}
    </div>
  );

  // Embed-only tracks have no seekable stream: the provider widget is the
  // transport.
  const seekBar = isLive || embed ? null : <ConnectedSeekBar />;

  const embedHostedInRow = Boolean(embed) && hearthisHostedInRow;

  const barShellClass = cn(
    'flex w-full shrink-0 flex-col',
    playerBarEnterClass,
  );

  if (embed) {
    const skipControls = (
      <PlayerBar.Controls
        hidePlayPause
        showShuffle={false}
        showRepeat={false}
        isPlaying={isPlaying}
        isLoading={isLoading}
        isShuffleActive={false}
        repeatMode="off"
        showDiscovery={false}
        labels={{
          shuffleOn: t('player.shuffleOn'),
          shuffleOff: t('player.shuffleOff'),
          repeatOff: t('player.repeatOff'),
          repeatAll: t('player.repeatAll'),
          repeatOne: t('player.repeatOne'),
          next: t('player.next'),
          previous: t('player.previous'),
          play: t('actions.playItem', { title }),
          pause: t('actions.pauseItem', { title }),
        }}
        onPlayPause={onPlayPause}
        onNext={next}
        onPrevious={previous}
        onShuffleToggle={toggleShuffle}
        onRepeatToggle={cycleRepeat}
      />
    );
    return (
      <div
        className={cn(
          barShellClass,
          'bg-background-secondary border-border border-t',
        )}
        data-testid={isMobile ? 'mobile-player-bar' : 'player-embed-host'}
      >
        {embedHostedInRow || fullScreenPlayerOpen ? null : (
          <EmbedSlot
            id="player-bar"
            priority={10}
            className="w-full px-4 pt-2"
            testId="hearthis-player-embed"
          />
        )}
        <div className="flex items-center justify-end gap-2 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {skipControls}
          {isMobile ? null : (
            <Tooltip content={t('player.openFullScreen')} side="top">
              <Button
                size="icon-sm"
                variant="text"
                onClick={() => setFullScreenPlayerOpen(true)}
                aria-label={t('player.openFullScreen')}
                data-testid="expand-full-screen-player"
              >
                <Maximize2Icon size={16} />
              </Button>
            </Tooltip>
          )}
          {queueButton}
        </div>
      </div>
    );
  }

  if (isMobile && phoneMinimized) {
    return (
      <div
        className={cn(
          barShellClass,
          'bg-background-secondary border-border border-t',
        )}
        data-testid="mobile-player-bar"
        data-minimized=""
      >
        {isLive || embed ? null : <MiniStripProgress />}
        <div className="flex h-12 w-full items-center gap-2 pr-1 pl-3">
          <Button
            variant="plain"
            size="flexible"
            className="flex h-full min-w-0 flex-1 items-center gap-2.5 text-left active:scale-100"
            onClick={() => setPhoneMinimized(false)}
            aria-label={`${t('player.restorePlayer')}: ${title}`}
            data-testid="restore-mobile-player-bar"
          >
            <MediaArtwork
              src={coverUrl}
              seed={playable.id}
              size="sm"
              className="size-8 min-w-8 shrink-0 rounded-sm"
            />
            <MarqueeText className="min-w-0 flex-1 text-sm font-semibold">
              {title}
            </MarqueeText>
            {isRealLive ? <PlayerLiveBadge /> : null}
          </Button>
          <Button
            size="icon"
            variant="text"
            onClick={onPlayPause}
            className={cn(
              'size-11 shrink-0 rounded-full',
              isPlaying && 'text-accent-green-strong',
            )}
            aria-label={playPauseLabel}
            aria-pressed={isPlaying}
            aria-busy={isLoading || undefined}
            data-testid={
              isPlaying ? 'player-pause-button' : 'player-play-button'
            }
          >
            {isLoading ? (
              <Loader
                shape="circle"
                size={18}
                data-testid="player-loading-spinner"
              />
            ) : isPlaying ? (
              <PauseIcon size={20} />
            ) : (
              <PlayIcon size={20} className="ml-0.5" />
            )}
          </Button>
          <Tooltip content={t('player.restorePlayer')} side="top">
            <Button
              size="icon"
              variant="text"
              onClick={() => setPhoneMinimized(false)}
              aria-label={t('player.restorePlayer')}
              className="text-foreground-secondary size-11 shrink-0"
              data-testid="expand-mobile-player-bar"
            >
              <ChevronUpIcon size={18} aria-hidden />
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div
        className={cn(
          barShellClass,
          'bg-background-secondary border-border border-t',
        )}
        data-testid="mobile-player-bar"
      >
        {seekBar ? <div className="px-4 pt-2">{seekBar}</div> : null}
        <div className="flex w-full items-center gap-3 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Button
            variant="text"
            size="flexible"
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left hover:bg-transparent"
            onClick={() => setFullScreenPlayerOpen(true)}
            aria-label={`${t('player.openFullScreen')}: ${title}`}
            data-testid="expand-full-screen-player"
          >
            <MediaArtwork
              src={coverUrl}
              seed={playable.id}
              size="thumb"
              className="shrink-0"
            />
            <span className="min-w-0 flex-1">
              <MarqueeText
                className="text-sm font-semibold"
                data-testid="mobile-player-title"
              >
                {title}
              </MarqueeText>
              <MarqueeText className="text-foreground-secondary text-xs">
                {artist}
              </MarqueeText>
            </span>
            {isRealLive ? <PlayerLiveBadge /> : null}
          </Button>
          {embed ? null : mobilePlayPauseButton}
          {queueButton}
          {isPlaying ? (
            <Tooltip content={t('player.minimizePlayer')} side="top">
              <Button
                size="icon"
                variant="text"
                onClick={() => setPhoneMinimized(true)}
                aria-label={t('player.minimizePlayer')}
                className="text-foreground-secondary -mr-2 size-11 shrink-0"
                data-testid="minimize-mobile-player-bar"
              >
                <ChevronDownIcon size={18} aria-hidden />
              </Button>
            </Tooltip>
          ) : (
            <OverflowMenu
              label={t('player.moreOptionsFor', { title })}
              trigger={
                <Button
                  size="icon"
                  variant="text"
                  aria-label={t('player.moreOptionsFor', { title })}
                  className="text-foreground-secondary -mr-2 size-11 shrink-0"
                  data-testid="mobile-player-more"
                >
                  <MoreHorizontalIcon size={18} aria-hidden />
                </Button>
              }
              items={[
                {
                  id: 'minimize',
                  label: t('player.minimizePlayer'),
                  icon: <ChevronDownIcon size={16} aria-hidden />,
                  onSelect: () => setPhoneMinimized(true),
                },
                {
                  id: 'close',
                  label: t('player.closePlayer'),
                  icon: <XIcon size={16} aria-hidden />,
                  onSelect: hidePlayerBar,
                },
              ]}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={barShellClass}>
      <PlayerBar
        left={
          <div className="flex min-w-0 items-center gap-2">
            <PlayerBar.NowPlaying
              title={title}
              artist={artist}
              coverUrl={coverUrl}
              artworkSeed={playable.id}
              action={isRealLive ? <PlayerLiveBadge /> : undefined}
              onTitleClick={
                playable ? () => setFullScreenPlayerOpen(true) : undefined
              }
              onArtistClick={
                openRadioStation ??
                (playable?.kind === 'radio'
                  ? artistSlug === TAHTI_RADIO_SLUG
                    ? () => {
                        void navigate({ to: '/radio' });
                      }
                    : undefined
                  : artistSlug
                    ? () => {
                        void navigate({
                          to: '/u/$username',
                          params: { username: artistSlug },
                        });
                      }
                    : undefined)
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
          <div className="flex w-full max-w-xl flex-col items-center gap-1">
            {controls}
            {seekBar}
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <Tooltip content={t('player.openFullScreen')} side="top">
              <Button
                size="icon-sm"
                variant="text"
                disabled={!playable}
                onClick={() => setFullScreenPlayerOpen(true)}
                aria-label={t('player.openFullScreen')}
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
              hideSlider={isMobile}
              labels={{
                mute: t('player.mute'),
                unmute: t('player.unmute'),
                volume: t('player.volume'),
              }}
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

/** Hairline progress along the top of the phone mini strip. Writes the
 * transform straight from the store subscription so playback ticks don't
 * re-render the bar. */
function MiniStripProgress() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (currentTime: number, duration: number) => {
      const fill = fillRef.current;
      if (!fill) {
        return;
      }
      const ratio =
        duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
      fill.style.transform = `scaleX(${ratio})`;
    };
    const { currentTime, duration } = usePlayerStore.getState();
    apply(currentTime, duration);
    return usePlayerStore.subscribe((state, prev) => {
      if (
        state.currentTime !== prev.currentTime ||
        state.duration !== prev.duration
      ) {
        apply(state.currentTime, state.duration);
      }
    });
  }, []);

  return (
    <div
      className="bg-foreground/10 relative h-0.5 w-full overflow-hidden"
      aria-hidden
      data-testid="mini-player-progress"
    >
      <div
        ref={fillRef}
        className="bg-primary absolute inset-0 origin-left"
        style={{ transform: 'scaleX(0)' }}
        data-testid="mini-player-progress-fill"
      />
    </div>
  );
}
