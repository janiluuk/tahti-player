import type {
  ArchiveItem,
  AuthUser,
  ChannelDirectoryResponse,
  ChatAccess,
  ChatMessage,
  FanTiersResponse,
  PublicChannel,
  PublicCollection,
  PublicProfile,
  RadioNowPlaying,
  RadioStation,
  SmartLinkView,
  TahtiPlayable,
  TransparencyGrantReport,
  TransparencyLedgerEntry,
  TransparencyYtd,
  VenueDirectoryItem,
} from './types';
import { TAHTI_RADIO_SLUG } from './types';

/** Public HLS fixture so the player works without a live Tahti stack. */
export const DEMO_HLS =
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.playlist.m3u8';

/** Sample progressive audio for archive / collection mocks. */
export const DEMO_MP3 =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const MOCK_DIRECTORY: ChannelDirectoryResponse = {
  items: [
    {
      slug: 'northern-lights',
      displayName: 'Northern Lights',
      avatarUrl: null,
      genres: ['ambient', 'live'],
    },
    {
      slug: 'screenshot-demo',
      displayName: 'Screenshot Demo',
      avatarUrl: null,
      genres: ['electronic'],
    },
    {
      slug: 'tahti-radio',
      displayName: 'Tahti Radio',
      avatarUrl: null,
      genres: ['radio'],
    },
  ],
};

export function mockDirectory(): ChannelDirectoryResponse {
  return MOCK_DIRECTORY;
}

export function mockChannel(slug: string): PublicChannel {
  const item = MOCK_DIRECTORY.items.find((c) => c.slug === slug) ?? {
    slug,
    displayName: slug,
    avatarUrl: null,
    genres: [],
  };
  const isRadio = slug === 'tahti-radio';
  return {
    slug: item.slug,
    state: 'LIVE',
    hlsUrl: DEMO_HLS,
    chatEnabled: true,
    visualPreset: 'AURORA',
    colorSchemeJson: JSON.stringify({
      accent: '#22D3EE',
      highlight: '#A78BFA',
      background: '#0B1220',
      foreground: '#F8FAFC',
      muted: '#64748B',
    }),
    colorScheme: {
      accent: '#22D3EE',
      highlight: '#A78BFA',
      background: '#0B1220',
      foreground: '#F8FAFC',
      muted: '#64748B',
    },
    user: {
      username: item.slug,
      displayName: item.displayName,
      bio: isRadio
        ? 'Org meta-stream of live Tahti channels (mock).'
        : 'Mock channel for the Nuclear × Tahti listen POC.',
      avatarUrl: item.avatarUrl,
    },
    nowPlaying: {
      title: isRadio ? 'Tahti Radio (mock)' : 'Live set (mock HLS)',
      artistName: item.displayName,
      artistUsername: item.slug,
      artworkUrl: null,
    },
  };
}

export function mockRadio(): RadioNowPlaying {
  return {
    live: true,
    channel: {
      slug: 'northern-lights',
      artistName: 'Northern Lights',
      displayName: 'Northern Lights',
      hlsUrl: DEMO_HLS,
      title: 'Featured live (mock)',
      artworkUrl: null,
    },
  };
}

export function mockRadioStation(): RadioStation {
  return {
    slug: TAHTI_RADIO_SLUG,
    state: 'LIVE',
    hlsUrl: DEMO_HLS,
    displayName: 'Tahti Radio',
    username: TAHTI_RADIO_SLUG,
    avatarUrl: null,
    chatEnabled: true,
    nowPlaying: {
      title: 'Tahti Radio (mock)',
      artistName: 'Community rotation',
      artistUsername: null,
      artworkUrl: null,
    },
    memberRelay: mockRadio(),
    recentlyPlayed: [
      {
        id: 'mock-rp-1',
        title: 'Midnight Broadcast',
        artistName: 'Northern Lights',
        artistUsername: 'northern-lights',
        artworkUrl: null,
        playedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      },
      {
        id: 'mock-rp-2',
        title: 'Archive Session 02',
        artistName: 'Northern Lights',
        artistUsername: 'northern-lights',
        artworkUrl: null,
        playedAt: new Date(Date.now() - 15 * 60_000).toISOString(),
      },
    ],
  };
}

export function mockArchiveItems(slug: string): ArchiveItem[] {
  const channel = mockChannel(slug);
  const artist = channel.user.displayName;
  return [
    {
      id: `${slug}-archive-1`,
      title: 'Midnight Broadcast',
      artistName: artist,
      durationSec: 372,
      bannerUrl: null,
      audioUrl: DEMO_MP3,
      genre: 'ambient',
      createdAt: '2026-07-01T20:00:00.000Z',
    },
    {
      id: `${slug}-archive-2`,
      title: 'Archive Session 02',
      artistName: artist,
      durationSec: 541,
      bannerUrl: null,
      audioUrl: DEMO_MP3,
      genre: 'live',
      createdAt: '2026-06-12T18:30:00.000Z',
    },
    {
      id: `${slug}-archive-3`,
      title: 'Demo HLS cut',
      artistName: artist,
      durationSec: 120,
      bannerUrl: null,
      audioUrl: DEMO_HLS,
      genre: 'electronic',
      createdAt: '2026-05-01T12:00:00.000Z',
    },
  ];
}

export function mockProfile(username: string): PublicProfile {
  const channel = mockChannel(username);
  const archive = mockArchiveItems(username);
  return {
    artist: {
      username: channel.user.username,
      displayName: channel.user.displayName,
      bio: channel.user.bio,
      avatarUrl: channel.user.avatarUrl,
      tipJarUrl: null,
      tier: 'FREE',
      pronouns: null,
      followerCount: 12,
    },
    channel: { slug: channel.slug, state: channel.state, artistKind: 'SINGLE' },
    releases: [
      {
        id: `${username}-rel-1`,
        title: 'First Light EP',
        type: 'EP',
        artworkUrl: null,
        smartLinkSlug: `${username}-first-light`,
        releaseDate: '2026-04-01T00:00:00.000Z',
        description: 'Mock release for the listen POC.',
        tracks: archive.slice(0, 2).map((a, i) => ({
          position: i + 1,
          title: a.title,
          durationSec: a.durationSec,
          archiveItemId: a.id,
          playUrl: a.audioUrl,
        })),
      },
    ],
    tracks: archive.map((a) => ({
      id: a.id,
      title: a.title,
      artistName: a.artistName,
      durationSec: a.durationSec,
      bannerUrl: a.bannerUrl,
      playUrl: a.audioUrl,
      releaseSlug: `${username}-first-light`,
    })),
    fanTiers: [{ id: 'tier-1', name: 'Supporter', amountCents: 500 }],
    collections: [
      {
        slug: 'favorites-vault',
        name: 'Favorites vault',
        type: 'PLAYLIST',
        style: 'LIST',
        description: 'Mock public collection.',
        coverUrl: null,
        isFeatured: true,
        itemCount: 2,
        url: `/u/${username}/c/favorites-vault`,
        rssUrl: `/api/v1/collections/favorites-vault/rss.xml`,
      },
    ],
    links: {
      channel: `/c/${channel.slug}`,
      subscribe: `/u/${username}/subscribe`,
      feeds: { archive: `/api/v1/u/${username}/rss.xml` },
      presskit: `/api/v1/u/${username}/press-kit.zip`,
    },
    backgroundMusicUrl: null,
  };
}

export function mockCollection(
  slug: string,
  username = 'northern-lights',
): PublicCollection {
  const archive = mockArchiveItems(username);
  return {
    slug,
    name: slug === 'favorites-vault' ? 'Favorites vault' : slug,
    description: 'Mock public collection for the Nuclear × Tahti POC.',
    coverUrl: null,
    isPublic: true,
    collaborative: false,
    user: {
      username,
      displayName: mockChannel(username).user.displayName,
    },
    items: archive.slice(0, 2).map((a, i) => ({
      id: `col-item-${a.id}`,
      position: i,
      archiveItem: {
        id: a.id,
        title: a.title,
        durationSec: a.durationSec,
        bannerUrl: a.bannerUrl,
        audioUrl: a.audioUrl,
        channel: { slug: username },
      },
      release: null,
    })),
    links: {
      page: `https://tahti.live/u/${username}/c/${slug}`,
      rss: `/api/v1/collections/${slug}/rss.xml`,
    },
  };
}

export function mockSmartLink(smartLinkSlug: string): SmartLinkView {
  const username = smartLinkSlug.includes('-')
    ? (smartLinkSlug.split('-')[0] ?? 'northern-lights')
    : 'northern-lights';
  const profile = mockProfile(username);
  const release = profile.releases[0]!;
  return {
    release: {
      id: release.id,
      title: release.title,
      type: release.type,
      artworkUrl: release.artworkUrl,
      description: release.description,
      smartLinkSlug,
      tracks: (release.tracks ?? []).map((t) => ({
        title: t.title,
        position: t.position,
        isrc: null,
      })),
    },
    artist: {
      username: profile.artist.username,
      displayName: profile.artist.displayName,
      avatarUrl: profile.artist.avatarUrl,
    },
    featuredCollections: profile.collections.map((c) => ({
      slug: c.slug,
      name: c.name,
      coverUrl: c.coverUrl,
      itemCount: c.itemCount,
      url: c.url,
    })),
    profileUrl: `https://tahti.live/u/${username}`,
    releaseUrl: `https://tahti.live/u/${username}#release-${release.id}`,
    targets: {
      bandcamp: 'https://bandcamp.com',
      spotify: 'https://open.spotify.com',
    },
    embedUrl: `https://tahti.live/embed/r/${release.id}`,
  };
}

export function mockVenues(): VenueDirectoryItem[] {
  return [
    {
      id: 'venue-1',
      slug: 'kuudes-linja',
      name: 'Kuudes Linja',
      city: 'Helsinki',
      countryCode: 'FI',
      capacity: 400,
      description: 'Mock venue for the listen POC.',
    },
  ];
}

export function channelToPlayable(
  channel: PublicChannel,
): TahtiPlayable | null {
  if (!channel.hlsUrl) {
    return null;
  }
  return {
    id: `live:${channel.slug}`,
    kind: channel.slug === TAHTI_RADIO_SLUG ? 'radio' : 'live',
    title: channel.nowPlaying?.title ?? `${channel.user.displayName} LIVE`,
    artist: channel.nowPlaying?.artistName ?? channel.user.displayName,
    coverUrl:
      channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl ?? undefined,
    streamUrl: channel.hlsUrl,
    protocol: 'hls',
    channelSlug: channel.slug,
  };
}

/** Prefer the always-on station HLS; member-relay-only payloads are not playable alone. */
export function radioStationToPlayable(
  station: RadioStation,
): TahtiPlayable | null {
  if (!station.hlsUrl) {
    return null;
  }
  return {
    id: `radio:${station.slug}`,
    kind: 'radio',
    title: station.nowPlaying?.title ?? 'Tahti Radio',
    artist: station.nowPlaying?.artistName ?? station.displayName,
    coverUrl:
      station.nowPlaying?.artworkUrl ?? station.avatarUrl ?? undefined,
    streamUrl: station.hlsUrl,
    protocol: 'hls',
    channelSlug: station.slug,
  };
}

/** @deprecated Use radioStationToPlayable — /api/v1/radio has no stream URL. */
export function radioToPlayable(radio: RadioNowPlaying): TahtiPlayable | null {
  const ch = radio.channel;
  if (!radio.live || !ch?.hlsUrl) {
    return null;
  }
  return {
    id: `radio:${ch.slug}`,
    kind: 'radio',
    title: ch.title ?? 'Tahti Radio',
    artist: ch.artistName ?? ch.displayName ?? ch.slug,
    coverUrl: ch.artworkUrl ?? undefined,
    streamUrl: ch.hlsUrl,
    protocol: 'hls',
    channelSlug: ch.slug,
  };
}

export function archiveItemToPlayable(
  item: ArchiveItem,
  channelSlug?: string,
): TahtiPlayable | null {
  if (!item.audioUrl) {
    return null;
  }
  const isHls = item.audioUrl.includes('.m3u8');
  return {
    id: `archive:${item.id}`,
    kind: 'archive',
    title: item.title,
    artist: item.artistName ?? channelSlug ?? 'Unknown',
    coverUrl: item.bannerUrl ?? undefined,
    streamUrl: item.audioUrl,
    protocol: isHls ? 'hls' : 'https',
    channelSlug,
    sourceProvider: item.sourceProvider ?? 'tahti',
  };
}

export function mockChatAccess(): ChatAccess {
  return {
    fanChatEnabled: true,
    isSupporter: false,
    canJoinFanChat: false,
    subscribersOnly: false,
    canPostInChat: true,
  };
}

export function mockChatHistory(slug: string): ChatMessage[] {
  const now = Date.now();
  return [
    {
      id: `${slug}-m1`,
      handle: 'listener',
      text: 'Loving this set (mock chat)',
      ts: now - 120_000,
    },
    {
      id: `${slug}-m2`,
      handle: slug.slice(0, 12) || 'host',
      text: 'Welcome — Nuclear × Tahti chat POC',
      ts: now - 60_000,
      channelRole: 'owner',
    },
  ];
}

export function mockAuthUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: 'mock-user-1',
    email: 'demo@tahti.live',
    username: 'demo',
    displayName: 'Demo Artist',
    tier: 'ARTIST',
    avatarUrl: null,
    isMember: true,
    channel: {
      slug: 'demo',
      state: 'OFFLINE',
      goneLiveAt: null,
      customDomain: null,
      customDomainVerified: false,
    },
    ...overrides,
  };
}

export function mockFanTiers(username: string): FanTiersResponse {
  const channel = mockChannel(username);
  return {
    artist: {
      id: `artist-${username}`,
      displayName: channel.user.displayName,
      username: channel.user.username,
      bio: channel.user.bio,
      avatarUrl: channel.user.avatarUrl,
    },
    tiers: [
      {
        id: 'tier-1',
        name: 'Supporter',
        amountCents: 500,
        description: 'Name in the credits + supporter badge in chat.',
        perks: ['Supporter badge', 'Early archive drops'],
      },
      {
        id: 'tier-2',
        name: 'Patron',
        amountCents: 1500,
        description: 'Everything in Supporter plus fan chat access.',
        perks: ['Fan chat', 'Monthly note from the artist'],
      },
    ],
    paymentsReady: true,
  };
}

export function mockTransparencyYtd(): TransparencyYtd {
  return {
    year: String(new Date().getFullYear()),
    byCategory: {
      REVENUE_SUBSCRIPTION: '420000',
      REVENUE_GRANT_INBOUND: '150000',
      COST_INFRASTRUCTURE: '180000',
      COST_OPERATIONS: '90000',
      GRANT_DISBURSEMENT: '200000',
    },
    runningSurplus: '100000',
    monthsFinalized: 6,
  };
}

export function mockTransparencyGrants(
  year = new Date().getFullYear(),
): TransparencyGrantReport {
  return {
    year,
    totalCents: '200000',
    grantCount: 2,
    disbursedAt: `${year}-03-01T12:00:00.000Z`,
    grants: [
      {
        publishedAs: 'Artist grant A',
        units: 1,
        amountCents: '120000',
        state: 'PUBLISHED',
      },
      {
        publishedAs: 'Artist grant B',
        units: 1,
        amountCents: '80000',
        state: 'PUBLISHED',
      },
    ],
  };
}

export function mockTransparencyLedger(): TransparencyLedgerEntry[] {
  return [
    {
      id: '1',
      description: 'Member subscriptions (mock)',
      category: 'REVENUE_SUBSCRIPTION',
      amountCents: '40000',
      createdAt: '2026-07-01T10:00:00.000Z',
    },
    {
      id: '2',
      description: 'Hosting (mock)',
      category: 'COST_INFRASTRUCTURE',
      amountCents: '-15000',
      createdAt: '2026-07-02T10:00:00.000Z',
    },
  ];
}
