import {
  HeartIcon,
  MessageCircle,
  PauseIcon,
  PlayIcon,
  WifiOffIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, Loader, Tooltip } from '@tahti-player/ui';

import { fetchChannel } from '../../api/client';
import type { PublicChannel } from '../../api/types';
import {
  parseNowPlayingOverlaySettings,
  resolveNowPlayingOverlayPreset,
} from '../../content/nowPlayingOverlayPresets';
import { useLayoutStore } from '../../stores/layoutStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { NowPlayingOverlay } from '../NowPlayingOverlay';
import { WaveformSeekbar } from '../tahti/WaveformSeekbar';

type Props = {
  channel: PublicChannel;
  slug: string;
  live: boolean;
  subtle: boolean;
  chatOn: boolean;
};

/** The channel's player: now-playing overlay plus chat / favorite / play
 * controls. Rendered by the hero block, or as a fixed Stage section when
 * the hero block is hidden, so the player stays reachable either way. */
export function ChannelStagePlayer({
  channel,
  slug,
  live,
  subtle,
  chatOn,
}: Props) {
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setPlaybackStatus = usePlayerStore((s) => s.setStatus);
  const toggleFavoriteChannel = useLibraryStore((s) => s.toggleFavoriteChannel);
  const favorited = useLibraryStore((s) =>
    s.favoriteChannels.some((c) => c.slug === slug),
  );
  const openChatRail = useLayoutStore((s) => s.openChatRail);
  const rightCollapsed = useLayoutStore((s) => s.rightCollapsed);
  const toggleRight = useLayoutStore((s) => s.toggleRight);

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
    if (rightCollapsed) {
      openChatRail(slug);
    } else {
      toggleRight();
    }
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
      .catch(() => toast.error('Could not start the stream. Try again.'));
  };

  const handleToggleFavoriteChannel = () =>
    toggleFavoriteChannel({
      slug,
      displayName: channel.user.displayName,
      avatarUrl: channel.user.avatarUrl,
    });

  return !live && !channel.nowPlaying ? (
    <div className="bg-background-secondary flex items-center justify-center py-12">
      <WifiOffIcon
        size={56}
        strokeWidth={1.5}
        className="text-foreground-secondary/40"
        aria-hidden
      />
    </div>
  ) : (
    <div
      className={`relative p-4 pr-24 sm:p-6 sm:pr-40 ${
        subtle
          ? 'bg-gradient-to-t from-black/80 via-black/35 to-black/10'
          : 'bg-gradient-to-t from-black/70 to-black/5'
      }`}
    >
      {channel.nowPlaying ? (
        <NowPlayingOverlay
          presetId={resolveNowPlayingOverlayPreset(
            channel.nowPlayingOverlayStyle,
          )}
          title={channel.nowPlaying.title}
          artist={channel.nowPlaying.artistName}
          artworkUrl={channel.nowPlaying.artworkUrl}
          settings={parseNowPlayingOverlaySettings(
            channel.nowPlayingOverlaySettingsJson,
          )}
          seekbar={
            <WaveformSeekbar
              trackId={`channel:${slug}`}
              progress={
                channelIsCurrent && duration > 0 ? currentTime / duration : 0
              }
              bars={72}
              className="mt-3 h-10 max-w-2xl"
              playedColor={channel.colorScheme?.accent}
              unplayedColor={channel.colorScheme?.muted}
              onSeek={
                channelIsCurrent && duration > 0
                  ? (fraction) => seekTo(fraction * duration)
                  : undefined
              }
            />
          }
        />
      ) : (
        <p className="text-sm text-white/80">
          Stream is live — hit Play live to drive the visualizer.
        </p>
      )}
      {(live || channel.hlsUrl) && (
        <div className="absolute right-4 bottom-4 z-[2] flex items-center gap-3">
          {chatOn && (
            <Tooltip
              content={rightCollapsed ? 'Expand chat' : 'Collapse chat'}
              side="top"
            >
              <Button
                size="icon"
                variant="text"
                className="size-11 bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
                onClick={handleToggleChat}
                aria-pressed={!rightCollapsed}
                aria-label={rightCollapsed ? 'Expand chat' : 'Collapse chat'}
              >
                <MessageCircle size={20} aria-hidden />
              </Button>
            </Tooltip>
          )}
          <Tooltip content={favorited ? 'Favorited' : 'Favorite'} side="top">
            <Button
              size="icon"
              variant="text"
              className="size-11 bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
              onClick={handleToggleFavoriteChannel}
              aria-pressed={favorited}
              aria-label={favorited ? 'Favorited' : 'Favorite'}
            >
              <HeartIcon
                size={20}
                className={
                  favorited ? 'text-accent-red fill-current' : undefined
                }
                aria-hidden
              />
            </Button>
          </Tooltip>
          <Tooltip
            content={
              channelIsLoading
                ? 'Loading stream'
                : channelIsPlaying
                  ? 'Pause stream'
                  : live
                    ? 'Play live'
                    : 'Play stream'
            }
            side="top"
          >
            <Button
              size="icon"
              className="bg-primary text-primary-foreground h-16 w-16 rounded-full shadow-lg"
              onClick={handlePlayChannel}
              aria-label={
                channelIsLoading
                  ? 'Loading stream'
                  : channelIsPlaying
                    ? 'Pause stream'
                    : live
                      ? 'Play live'
                      : 'Play stream'
              }
              aria-pressed={channelIsPlaying}
            >
              {channelIsLoading ? (
                <Loader />
              ) : channelIsPlaying ? (
                <PauseIcon size={26} className="fill-current" aria-hidden />
              ) : (
                <PlayIcon size={26} className="fill-current" aria-hidden />
              )}
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
