import { mockChannel } from '@tahti-web/api/mock';
import type { PublicRadioShow } from '@tahti-web/api/shows';
import type { PublicChannel, TahtiPlayable } from '@tahti-web/api/types';
import type { ChannelBlockRenderContext } from '@tahti-web/components/channel-view';

export const CHANNEL_SLUG = 'northern-lights';
export const CHANNEL_NAME = 'Northern Lights';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export function isoFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

/** The shared mock channel with the fields a real rotation payload sends
 * (signal state, track timing, curated next track). */
export function storyChannel(
  patch: Partial<PublicChannel> = {},
): PublicChannel {
  const base = mockChannel(CHANNEL_SLUG);
  return {
    ...base,
    state: 'LIVE',
    hlsUrl: 'https://stream.tahti.live/northern-lights/index.m3u8',
    signalConnected: true,
    nowPlaying: {
      title: 'Aurora Drift',
      artistName: CHANNEL_NAME,
      artistUsername: CHANNEL_SLUG,
      artworkUrl: null,
      durationSec: 300,
      startedAt: isoFromNow(-2 * MINUTE),
    },
    nowPlayingNext: {
      title: 'Kaamos Bloom',
      artistName: 'Saimaa Sessions',
      artistUsername: 'saimaa-sessions',
    },
    ...patch,
  };
}

function playable(id: string, title: string, artist: string): TahtiPlayable {
  return {
    id,
    kind: 'sound',
    title,
    artist,
    streamUrl: `https://cdn.tahti.live/${id}.mp3`,
    protocol: 'https',
    channelSlug: CHANNEL_SLUG,
    durationSec: 245,
  };
}

export const PINNED_PLAYABLES = [
  playable('nl-pinned-1', 'Polar Static', CHANNEL_NAME),
];

export const CATALOG_PLAYABLES = [
  playable('nl-cat-1', 'Borrowed Light', CHANNEL_NAME),
  playable('nl-cat-2', 'Snowline', CHANNEL_NAME),
];

export const LIVE_SHOWS: PublicRadioShow = {
  artist: {
    displayName: CHANNEL_NAME,
    username: CHANNEL_SLUG,
    avatarUrl: null,
    channelSlug: CHANNEL_SLUG,
    bio: null,
  },
  upcomingEpisodes: [
    {
      id: 'nl-show-next',
      startAt: isoFromNow(30 * HOUR),
      endAt: isoFromNow(32 * HOUR),
      note: 'Night Drive Sessions #13',
      showType: 'LIVE_SET',
    },
  ],
  pastEpisodes: [
    {
      id: 'nl-show-past',
      startAt: isoFromNow(-6 * 24 * HOUR),
      endAt: isoFromNow(-6 * 24 * HOUR + 2 * HOUR),
      note: 'Night Drive Sessions #12',
      showType: 'LIVE_SET',
      recording: {
        soundId: 'nl-rec-12',
        title: 'Night Drive Sessions #12',
        channelItemUrl: `/channel/${CHANNEL_SLUG}#archive-item-nl-rec-12`,
      },
    },
  ],
  nextShowAt: null,
  lastShowAt: null,
};

export function blockContext(
  patch: Partial<ChannelBlockRenderContext> = {},
): ChannelBlockRenderContext {
  return {
    editing: false,
    channel: storyChannel({
      nextBroadcastAt: isoFromNow(30 * HOUR),
      nextBroadcastNote: 'Night Drive Sessions',
      followerCount: 1284,
      channelLinks: [
        { label: 'Bandcamp', url: 'https://northernlights.bandcamp.com' },
        { label: 'Instagram', url: 'https://instagram.com/northernlights' },
        { label: 'Old blog', url: 'https://example.com/blog', hidden: true },
      ],
    }),
    slug: CHANNEL_SLUG,
    isOwner: false,
    pinnedPlayables: PINNED_PLAYABLES,
    catalogPlayables: CATALOG_PLAYABLES,
    channelLinksDraft: [],
    liveShows: LIVE_SHOWS,
    sectionStatus: { sounds: 'ready', widgets: 'ready', shows: 'ready' },
    onRetrySection: () => undefined,
    chatOn: true,
    onOpenChat: () => undefined,
    listenerWidgetInstances: [],
    ...patch,
  };
}
