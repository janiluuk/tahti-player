import {
  isHeaderImageUrl,
  isValidHeaderBackdropUrl,
  resolvePublicVisualizerPreset,
  youtubeEmbedUrl,
} from '../../api/channel-design';
import type { PublicChannel } from '../../api/types';
import {
  normalizeColorScheme,
  type NormalizedColorScheme,
} from '../../lib/colorScheme';
import { ChannelVisualizer } from '../ChannelVisualizer';

const CHANNEL_RADIO_VIZ_SETTINGS = { speed: 1.15, intensity: 1.8, scale: 1 };

/** Channels with their own saved visualizer tuning keep it; others get the
 * radio defaults. */
export function heroVisualizerSettingsFor(channel: PublicChannel) {
  return channel.visualSettingsJson ? undefined : CHANNEL_RADIO_VIZ_SETTINGS;
}

type Props = {
  channel: PublicChannel;
  pageScheme: NormalizedColorScheme;
  backgroundVisualPreset:
    | Parameters<typeof resolvePublicVisualizerPreset>[0]
    | null;
  heroVisible: boolean;
  live: boolean;
  channelVideoMuted: boolean;
};

/** Full-bleed ambient backdrop behind the public page (view mode only):
 * the chosen background visualizer, else the header's video / image / solid
 * / gradient / visualizer when there is no hero block to show it. */
export function ChannelPageBackdrop({
  channel,
  pageScheme,
  backgroundVisualPreset,
  heroVisible,
  live,
  channelVideoMuted,
}: Props) {
  const showHeaderVideo =
    channel.headerStyle === 'VIDEO_LOOP' &&
    isValidHeaderBackdropUrl(channel.videoBackgroundUrl);
  const showSolidHeader = channel.headerStyle === 'SOLID';
  const headerScheme = normalizeColorScheme(channel.colorScheme);
  const headerBackground = headerScheme.bg;
  const headerAccent = headerScheme.accent;
  const headerHighlight = headerScheme.highlight;
  const headerBackdropIsImage = isHeaderImageUrl(channel.videoBackgroundUrl);
  const heroVisualizerSettings = heroVisualizerSettingsFor(channel);

  return (
    <>
      {backgroundVisualPreset ? (
        <ChannelVisualizer
          className="pointer-events-none absolute inset-0 z-0 size-full opacity-25"
          preset={resolvePublicVisualizerPreset(backgroundVisualPreset)}
          colorScheme={pageScheme}
          artworkUrl={channel.user.avatarUrl}
        />
      ) : null}
      {!heroVisible &&
        !backgroundVisualPreset &&
        (showHeaderVideo ? (
          youtubeEmbedUrl(channel.videoBackgroundUrl, channelVideoMuted) ? (
            <iframe
              title="Channel video backdrop"
              src={
                youtubeEmbedUrl(
                  channel.videoBackgroundUrl,
                  channelVideoMuted,
                ) ?? undefined
              }
              className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${
                live ? 'opacity-[0.32]' : 'opacity-[0.55]'
              }`}
              allow="autoplay; encrypted-media"
              aria-hidden="true"
            />
          ) : headerBackdropIsImage ? (
            <img
              className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover ${
                live ? 'opacity-[0.32]' : 'opacity-[0.55]'
              }`}
              src={channel.videoBackgroundUrl ?? undefined}
              alt=""
            />
          ) : (
            <video
              className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover ${
                live ? 'opacity-[0.32]' : 'opacity-[0.55]'
              }`}
              src={channel.videoBackgroundUrl ?? undefined}
              autoPlay
              loop
              muted={channelVideoMuted}
              playsInline
              aria-hidden="true"
            />
          )
        ) : showSolidHeader ? (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{ backgroundColor: headerBackground }}
            aria-hidden
          />
        ) : channel.headerStyle === 'GRADIENT' ? (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage: `linear-gradient(135deg, ${headerBackground}, ${headerAccent} 55%, ${headerHighlight})`,
            }}
            aria-hidden
          />
        ) : (
          <ChannelVisualizer
            className={`pointer-events-none absolute inset-0 z-0 ${
              live ? 'opacity-[0.32]' : 'opacity-[0.55]'
            }`}
            preset={resolvePublicVisualizerPreset(channel.visualPreset)}
            colorScheme={pageScheme}
            colorSchemeJson={channel.colorSchemeJson}
            visualSettingsJson={channel.visualSettingsJson}
            settings={heroVisualizerSettings}
            artworkUrl={
              channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl
            }
          />
        ))}
    </>
  );
}
