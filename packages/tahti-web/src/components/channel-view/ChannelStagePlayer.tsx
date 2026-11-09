import { useNavigate } from '@tanstack/react-router';
import {
  HeartIcon,
  MessageCircle,
  PauseIcon,
  PlayIcon,
  WifiOffIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, EmptyState, Loader, Tooltip } from '@tahti-player/ui';

import { fetchChannel } from '../../api/client';
import type { PublicChannel, TahtiPlayable } from '../../api/types';
import {
  parseNowPlayingOverlaySettings,
  resolveNowPlayingOverlayPreset,
} from '../../content/nowPlayingOverlayPresets';
import { prefetchHls } from '../../lib/hlsLoader';
import {
  playableFromQueueItem,
  usePlayerStore,
} from '../../stores/playerStore';
import { EmbedSurface } from '../EmbedSurface';
import { useHearthisEmbedClaim } from '../HearthisEmbedHost';
import { NowPlayingOverlay } from '../NowPlayingOverlay';
import { Eyebrow } from '../tahti/Eyebrow';
import { WaveformSeekbar } from '../tahti/WaveformSeekbar';
import { ChannelAirBadge, channelAirState } from './ChannelAirBadge';
import { ChannelStageTrackMeta } from './ChannelStageTrackMeta';
import { stageNowPlayingTrack } from './stageNowPlayingTrack';
import { useRotationNowPlaying } from './useRotationNowPlaying';

type Props = {
  channel: PublicChannel;
  slug: string;
  live: boolean;
  subtle: boolean;
  chatOn: boolean;
  follow: {
    following: boolean;
    busy: boolean;
    toggle: () => Promise<void>;
  } | null;
  signedIn: boolean;
  /** Playable ids of this channel's own tracks: when one of them is an
   * embed and is playing, its widget shows in the stage. */
  trackIds?: ReadonlySet<string>;
  /** This channel's tracks, to find the rotation's now-playing track and
   * draw its real waveform (or its embed widget). */
  playables?: readonly TahtiPlayable[];
  /** Opens chat on the page itself; without it the chat button goes to
   * the standalone chat route. */
  onOpenChat?: () => void;
};

/** The channel's player: now-playing overlay plus chat / follow / play
 * controls. Rendered by the hero block, or as a fixed Stage section when
 * the hero block is hidden, so the player stays reachable either way. */
export function ChannelStagePlayer({
  channel,
  slug,
  live,
  subtle,
  chatOn,
  follow,
  signedIn,
  trackIds,
  playables,
  onOpenChat,
}: Props) {
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setPlaybackStatus = usePlayerStore((s) => s.setStatus);
  const queue = usePlayerStore((s) => s.queue);
  const restoredPending = usePlayerStore((s) => s.restoredPending);
  const reloadNonce = usePlayerStore((s) => s.reloadNonce);
  const activeItem = currentId
    ? queue.find((item) => item.id === currentId)
    : undefined;
  const activePlayable = activeItem ? playableFromQueueItem(activeItem) : null;
  const currentPlayable =
    currentId && trackIds?.has(currentId) ? activePlayable : null;
  const stageEmbed = currentPlayable?.embed ? currentPlayable : null;
  useHearthisEmbedClaim(Boolean(stageEmbed));
  const { t } = useTranslation('web');
  const favorited = follow?.following ?? false;
  const favoriteLabel = signedIn
    ? `${t('actions.follow')} ${channel.user.displayName}`
    : t('actions.favorite');
  const favoriteTooltip = favorited
    ? signedIn
      ? t('actions.following')
      : t('actions.favorited')
    : favoriteLabel;
  const navigate = useNavigate();
  const onAir = live && channelAirState(channel) === 'on-air';
  const { nowPlaying, next } = useRotationNowPlaying(
    slug,
    channel.nowPlaying,
    channel.nowPlayingNext,
  );

  const channelIsCurrent =
    currentId === `live:${slug}` || currentId === `radio:${slug}`;
  const channelIsPlaying =
    channelIsCurrent &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');
  const channelIsLoading = channelIsCurrent && playbackStatus === 'loading';

  const handleToggleChat = () => {
    if (!chatOn) {
      return;
    }
    if (onOpenChat) {
      onOpenChat();
      return;
    }
    void navigate({ to: '/chat/$slug', params: { slug } });
  };

  const handlePlayChannel = () => {
    if (channelIsCurrent) {
      setPlaybackStatus(channelIsPlaying ? 'paused' : 'playing');
      return;
    }
    void fetchChannel(slug)
      .then(({ playable }) => {
        if (playable) {
          play(playable);
        }
      })
      .catch(() => toast.error(t('toasts.couldNotStartStream')));
  };

  const hasControls = live || Boolean(channel.hlsUrl);
  const playLabel = channelIsLoading
    ? t('channelStage.loadingStream')
    : channelIsPlaying
      ? t('channelStage.pauseStream')
      : onAir
        ? t('channelStage.playLive')
        : t('channelStage.playStream');

  // A track without decoded peaks would draw a row of flat placeholder
  // bars; an embed shows its provider's widget instead, anything else
  // shows no waveform at all.
  const stageTrack = stageNowPlayingTrack(nowPlaying, playables);
  const stagePeaks = stageTrack?.peaks?.length ? stageTrack.peaks : null;
  const activeEmbedUri = activePlayable?.embed?.embedUri;
  const stageSeekbar = stagePeaks ? (
    <WaveformSeekbar
      trackId={`channel:${slug}`}
      peaks={stagePeaks}
      progress={channelIsCurrent && duration > 0 ? currentTime / duration : 0}
      bars={72}
      label={channel.user.displayName}
      durationSec={duration}
      className="mt-3 h-10 max-w-2xl"
      playedColor={channel.colorScheme?.accent}
      unplayedColor={channel.colorScheme?.muted}
      onSeek={
        channelIsCurrent && duration > 0
          ? (fraction) => seekTo(fraction * duration)
          : undefined
      }
    />
  ) : stageTrack?.embed && stageTrack.embed.embedUri !== activeEmbedUri ? (
    <div className="mt-3 max-w-2xl" data-testid="channel-stage-embed-widget">
      <EmbedSurface
        provider={stageTrack.embed.provider}
        embedUri={stageTrack.embed.embedUri}
        title={stageTrack.title}
        autoplay={false}
        compact
      />
    </div>
  ) : undefined;

  const airBadge = (
    <div className="absolute top-3 left-4 z-[2] sm:left-6">
      <ChannelAirBadge channel={channel} />
    </div>
  );

  if (stageEmbed?.embed) {
    return (
      <div
        className="bg-background-secondary relative flex flex-col gap-3 px-4 pt-10 pb-4 sm:px-6"
        data-testid="channel-stage-embed"
      >
        {airBadge}
        <div className="min-w-0">
          <Eyebrow tone="muted">{t('channelStage.nowPlaying')}</Eyebrow>
          <p className="truncate text-lg font-bold">{stageEmbed.title}</p>
          <p className="text-foreground-secondary truncate text-sm">
            {stageEmbed.artist}
          </p>
        </div>
        <EmbedSurface
          provider={stageEmbed.embed.provider}
          embedUri={stageEmbed.embed.embedUri}
          title={stageEmbed.title}
          autoplay={restoredPending !== stageEmbed.id}
          mountKey={reloadNonce}
        />
      </div>
    );
  }

  return !live && !nowPlaying ? (
    <div className="bg-background-secondary relative px-4 pt-10 pb-6 sm:px-6">
      {airBadge}
      <EmptyState
        size="sm"
        className="gap-3 p-4 sm:p-6"
        icon={
          <WifiOffIcon
            size={28}
            strokeWidth={1.75}
            className="text-foreground-secondary"
            aria-hidden
          />
        }
        title={t('channelStage.offAirTitle')}
        description={t('channelStage.offAirDescription')}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              document
                .getElementById('channel-block-sound')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            {t('channelStage.browseTracks')}
          </Button>
        }
      />
    </div>
  ) : (
    <div
      className={`relative p-4 pt-12 ${hasControls ? 'pr-28 sm:pr-32' : ''} sm:p-6 sm:pt-12 ${
        subtle
          ? 'bg-gradient-to-t from-black/80 via-black/35 to-black/10'
          : 'bg-gradient-to-t from-black/70 to-black/5'
      }`}
    >
      {airBadge}
      <div className="flex items-start gap-4">
        {hasControls ? (
          <Tooltip content={playLabel} side="top">
            <Button
              variant="text"
              className="size-14 shrink-0 justify-center rounded-full bg-white p-0 text-black shadow-xl hover:bg-white active:bg-white"
              onClick={handlePlayChannel}
              onPointerEnter={prefetchHls}
              onFocus={prefetchHls}
              aria-label={playLabel}
              aria-pressed={channelIsPlaying}
              data-testid="channel-stage-play"
            >
              {channelIsLoading ? (
                <Loader />
              ) : channelIsPlaying ? (
                <PauseIcon size={22} className="fill-current" aria-hidden />
              ) : (
                <PlayIcon
                  size={22}
                  className="ml-0.5 fill-current"
                  aria-hidden
                />
              )}
            </Button>
          </Tooltip>
        ) : null}
        <div className="min-w-0 flex-1">
          {nowPlaying ? (
            <>
              <NowPlayingOverlay
                presetId={resolveNowPlayingOverlayPreset(
                  channel.nowPlayingOverlayStyle,
                )}
                title={nowPlaying.title}
                artist={nowPlaying.artistName}
                artworkUrl={nowPlaying.artworkUrl ?? channel.user.avatarUrl}
                artworkSeed={slug}
                settings={parseNowPlayingOverlaySettings(
                  channel.nowPlayingOverlaySettingsJson,
                )}
                seekbar={stageSeekbar}
              />
              <ChannelStageTrackMeta nowPlaying={nowPlaying} next={next} />
            </>
          ) : (
            <p className="text-sm text-white/80">
              {onAir
                ? t('channelStage.liveHint')
                : t('channelStage.rotationHint')}
            </p>
          )}
        </div>
      </div>
      {hasControls && (chatOn || follow) ? (
        <div className="absolute right-4 bottom-4 z-[2] flex items-center gap-3">
          {chatOn && (
            <Tooltip content="Open chat" side="top">
              <Button
                size="icon"
                variant="text"
                className="size-11 bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
                onClick={handleToggleChat}
                aria-label="Open chat"
              >
                <MessageCircle size={20} aria-hidden />
              </Button>
            </Tooltip>
          )}
          {follow ? (
            <Tooltip content={favoriteTooltip} side="top">
              <Button
                size="icon"
                variant="text"
                className="size-11 bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
                onClick={() => void follow.toggle()}
                disabled={follow.busy}
                aria-pressed={favorited}
                aria-label={favoriteLabel}
              >
                <HeartIcon
                  size={20}
                  className={
                    favorited
                      ? 'text-accent-red-strong fill-current'
                      : undefined
                  }
                  aria-hidden
                />
              </Button>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
