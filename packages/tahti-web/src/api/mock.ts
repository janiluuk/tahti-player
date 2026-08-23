import { getMockFreeSubscriptionsEnabled } from './mock-profile-preferences';
import type {
  Announcement,
  ArchiveItem,
  AuthUser,
  ChannelDirectoryResponse,
  ChatAccess,
  ChatMessage,
  FanTiersResponse,
  FeedResponse,
  PublicChannel,
  PublicCollection,
  PublicProfile,
  RadioNowPlaying,
  RadioRecentlyPlayedItem,
  SmartLinkView,
  TahtiPlayable,
  TransparencyGrantReport,
  TransparencyLedgerEntry,
  TransparencyYtd,
  VenueDirectoryItem,
} from './types';

/** Always-on station slug — matches production `TAHTI_RADIO_SLUG`. */
export const TAHTI_RADIO_SLUG = 'tahti-radio';

/** Public HLS fixture so the player works without a live Tahti stack. */
export const DEMO_HLS =
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.playlist.m3u8';

/** Sample progressive audio for archive / collection mocks. */
export const DEMO_MP3 =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

/** Slugs actually broadcasting in the mock world — everyone else is an
 * artist you browse (archive/tracks), not a live station. Matches the
 * member relay in `mockRadio()`. */
const LIVE_SLUGS = new Set([TAHTI_RADIO_SLUG, 'northern-lights']);

type StationRelease = {
  title: string;
  type: 'ALBUM' | 'EP' | 'SINGLE';
  description: string;
};

type StationContent = {
  displayName: string;
  genres: string[];
  bio: string;
  colorAccent: string;
  colorHighlight: string;
  nowPlayingTitle: string;
  followerCount: number;
  pronouns?: string | null;
  trackTitles: string[];
  releases: StationRelease[];
  /** Optional artwork — most mock stations intentionally ship without any
   * (avatarUrl/bannerUrl/artworkUrl null) to keep fixtures obviously
   * placeholder; a station can opt in for screenshot fidelity. */
  avatarUrl?: string;
  /** Parallel to `trackTitles` — cover art each track/archive item shows. */
  trackArtwork?: string[];
  /** Parallel to `releases`. */
  releaseArtwork?: string[];
};

/** Per-station mock content — keeps the listen directory, artist pages, and
 * archive items feeling like distinct channels instead of one repeated blurb. */
const STATION_CONTENT: Record<string, StationContent> = {
  'northern-lights': {
    displayName: 'Northern Lights',
    genres: ['ambient', 'live'],
    bio: '24/7 community radio — always on while we grow the member meta-stream. Tune in and chat with listeners worldwide.',
    colorAccent: '#22D3EE',
    colorHighlight: '#A78BFA',
    nowPlayingTitle: 'Aurora Drift',
    followerCount: 412,
    pronouns: 'she/her',
    trackTitles: [
      'Aurora Drift',
      'Midnight Broadcast',
      'Archive Session 02',
      'Kaamos Bloom',
    ],
    releases: [
      {
        title: 'First Light EP',
        type: 'EP',
        description:
          'Four-track EP built from a winter of live broadcasts — slow-building pads recorded during actual aurora activity over Rovaniemi.',
      },
      {
        title: 'Polar Static',
        type: 'ALBUM',
        description:
          'A full-length ambient record mixed entirely from field recordings collected on member listening sessions across two winters.',
      },
    ],
    releaseArtwork: [
      '/mock/northern-lights/cover-first-light.svg',
      '/mock/northern-lights/cover-polar-static.svg',
    ],
  },
  'screenshot-demo': {
    displayName: 'Screenshot Demo',
    genres: ['electronic'],
    bio: 'Demo channel used for screenshot fixtures — kept intentionally minimal so UI captures stay legible.',
    colorAccent: '#22D3EE',
    colorHighlight: '#A78BFA',
    nowPlayingTitle: 'Live set',
    followerCount: 58,
    trackTitles: ['Fixture Loop', 'Screenshot Pad', 'Test Tone Suite'],
    releases: [
      {
        title: 'Fixture Set',
        type: 'EP',
        description: 'Placeholder release used to populate screenshot flows.',
      },
    ],
  },
  'midnight-cartography': {
    displayName: 'Midnight Cartography',
    genres: ['downtempo', 'trip-hop'],
    bio: 'Helsinki duo mapping late-night bus routes into slow breakbeats and tape-warped bass. Weekly show, Thursdays after midnight.',
    colorAccent: '#FB7185',
    colorHighlight: '#FBBF24',
    nowPlayingTitle: 'Route 550 (live dub)',
    followerCount: 1024,
    pronouns: 'they/them',
    trackTitles: [
      'Route 550',
      'Ring Rail Interlude',
      'Sleeper Cabin',
      'Harbour Fog',
      'Last Tram Home',
    ],
    releases: [
      {
        title: 'Night Bus Atlas',
        type: 'ALBUM',
        description:
          'Nine tracks recorded riding Helsinki night buses end to end, each named for the route that inspired it. Field noise left in on purpose.',
      },
      {
        title: 'Ring Rail',
        type: 'SINGLE',
        description:
          'A single built entirely from recordings made on the Ring Rail loop over one rainy October week.',
      },
    ],
  },
  'tundra-static': {
    displayName: 'Tundra Static',
    genres: ['noise', 'experimental'],
    bio: 'Contact-mic experiments and modular noise from an artist collective in Oulu. Not for the faint of speaker.',
    colorAccent: '#34D399',
    colorHighlight: '#64748B',
    nowPlayingTitle: 'Permafrost Feedback Loop',
    followerCount: 233,
    trackTitles: [
      'Permafrost Feedback Loop',
      'Rust Belt Choir',
      'Pipeline Hum',
      'Static Migration',
    ],
    releases: [
      {
        title: 'Signal Decay',
        type: 'ALBUM',
        description:
          'A full-length exploration of contact-mic recordings taken from decommissioned industrial sites around the Oulu river.',
      },
    ],
  },
  'saimaa-sessions': {
    displayName: 'Saimaa Sessions',
    genres: ['jazz', 'improv'],
    bio: 'Lakeside improv jazz trio broadcasting live from a boathouse studio on Saimaa. Expect long forms and open mic guests.',
    colorAccent: '#60A5FA',
    colorHighlight: '#FBBF24',
    nowPlayingTitle: 'Boathouse Session — Set 1',
    followerCount: 687,
    pronouns: 'he/him',
    trackTitles: [
      'Boathouse Session — Set 1',
      'Ice-Out Suite',
      'Ferry Bell Changes',
      'Late Summer Modal',
      'Boathouse Session — Set 2',
    ],
    releases: [
      {
        title: 'Ice-Out',
        type: 'ALBUM',
        description:
          'Recorded live over three consecutive lake thaws, this record follows the trio through fully improvised long-form sets.',
      },
      {
        title: 'Boathouse Sessions Vol. 1',
        type: 'EP',
        description:
          'The first in an ongoing archive series pulled straight from unedited boathouse broadcast tapes.',
      },
    ],
  },
  'kaiku-collective': {
    displayName: 'Kaiku Collective',
    genres: ['hip-hop', 'beats'],
    bio: 'Turku beatmaker collective — six producers trading a weekly slot, always closing with an open freestyle line.',
    colorAccent: '#A78BFA',
    colorHighlight: '#22D3EE',
    nowPlayingTitle: 'Echo Chamber Cypher',
    followerCount: 1560,
    trackTitles: [
      'Echo Chamber Cypher',
      'Turku Loop Diary',
      'Sample Crate Vol. 4',
      'Freestyle Line (Live)',
    ],
    releases: [
      {
        title: 'Loop Diary',
        type: 'ALBUM',
        description:
          'A rotating-producer compilation — each of the six Kaiku members contributes two beats built the same week they were recorded.',
      },
      {
        title: 'Cypher Tapes',
        type: 'EP',
        description:
          'Raw freestyle closers pulled from six months of live weekly sessions, sequenced back to back with no edits.',
      },
    ],
  },
  'valo-radio': {
    displayName: 'Valo Radio',
    genres: ['synthwave', 'retro'],
    bio: 'Neon-soaked synth broadcasts out of Tampere. Analog gear only, monthly all-night streams for the arcade crowd.',
    colorAccent: '#FBBF24',
    colorHighlight: '#FB7185',
    nowPlayingTitle: 'Arcade Sunset',
    followerCount: 894,
    pronouns: 'she/her',
    trackTitles: [
      'Arcade Sunset',
      'Analog Heart',
      'Grid Runner',
      'Chrome Highway',
      'Neon Curfew',
    ],
    releases: [
      {
        title: 'Chrome Highway',
        type: 'ALBUM',
        description:
          'An all-analog synthwave record tracked live to tape over a single all-night session, no sequencing plugins used.',
      },
      {
        title: 'Arcade Sunset',
        type: 'SINGLE',
        description:
          'Lead single from the monthly all-night stream series — built around a single arpeggiator patch recorded live.',
      },
    ],
  },
  metsanpeitto: {
    displayName: 'Metsänpeitto',
    genres: ['folk', 'acoustic'],
    bio: 'Dark Finnish folk duo recording acoustic sets deep in the forest — kantele, field recordings, and close harmony.',
    colorAccent: '#34D399',
    colorHighlight: '#A78BFA',
    nowPlayingTitle: 'Forest Cover (live)',
    followerCount: 349,
    pronouns: 'they/them',
    trackTitles: [
      'Forest Cover',
      'Kantele Waltz',
      'Moss Path',
      'Northern Lullaby',
    ],
    releases: [
      {
        title: 'Forest Cover',
        type: 'EP',
        description:
          'Four songs tracked outdoors on portable recorders during a week camped near Nuuksio — wind and birdsong left untouched.',
      },
    ],
  },
  'dj-moonlight': {
    displayName: 'DJ Moonlight',
    genres: ['deep house', 'nu-disco'],
    bio: 'Helsinki selector spinning warm, filtered house for the drive home. Monthly After Hours residency and the odd rooftop set when the weather holds.',
    colorAccent: '#A78BFA',
    colorHighlight: '#FB7185',
    nowPlayingTitle: 'Moonlight Drive (live mix)',
    followerCount: 2140,
    pronouns: 'she/her',
    avatarUrl: '/mock/dj-moonlight/avatar.svg',
    trackTitles: [
      'Moonlight Drive',
      'After Hours Radio',
      'Blue Hour',
      'Neon Tide',
    ],
    trackArtwork: [
      '/mock/dj-moonlight/cover-moonlight-drive.svg',
      '/mock/dj-moonlight/cover-moonlight-drive.svg',
      '/mock/dj-moonlight/cover-after-hours.svg',
      '/mock/dj-moonlight/cover-after-hours.svg',
    ],
    releases: [
      {
        title: 'Moonlight Drive',
        type: 'EP',
        description:
          'Two-track EP built for the late-night A1 loop out of Helsinki — sidechained pads and a vocoder hook recorded live during a winter drive.',
      },
      {
        title: 'After Hours',
        type: 'ALBUM',
        description:
          "Warm, filtered cuts from DJ Moonlight's residency — mixed down from the closing sets nobody wanted to leave.",
      },
    ],
    releaseArtwork: [
      '/mock/dj-moonlight/cover-moonlight-drive.svg',
      '/mock/dj-moonlight/cover-after-hours.svg',
    ],
  },
};

const MOCK_DIRECTORY: ChannelDirectoryResponse = {
  items: Object.entries(STATION_CONTENT).map(([slug, s]) => ({
    slug,
    displayName: s.displayName,
    avatarUrl: s.avatarUrl ?? null,
    genres: s.genres,
    live: LIVE_SLUGS.has(slug),
  })),
  // tahti-radio is featured via fetchRadioStation on Listen — not listed here.
};

export function mockDirectory(): ChannelDirectoryResponse {
  return MOCK_DIRECTORY;
}

function stationContent(slug: string): StationContent {
  return (
    STATION_CONTENT[slug] ?? {
      displayName: slug,
      genres: [],
      bio: 'Independent Tahti channel.',
      colorAccent: '#22D3EE',
      colorHighlight: '#A78BFA',
      nowPlayingTitle: 'Live set',
      followerCount: 12,
      trackTitles: ['Midnight Broadcast', 'Archive Session 02', 'Late Session'],
      releases: [
        {
          title: 'First Light EP',
          type: 'EP',
          description: 'Debut release.',
        },
      ],
    }
  );
}

export function mockChannel(slug: string): PublicChannel {
  const isRadio = slug === TAHTI_RADIO_SLUG;
  const content = stationContent(isRadio ? 'northern-lights' : slug);
  const live = LIVE_SLUGS.has(slug);
  return {
    slug,
    state: live ? 'LIVE' : 'OFFLINE',
    hlsUrl: live ? DEMO_HLS : null,
    chatEnabled: true,
    visualPreset: isRadio ? 'REACTIVE_GRID' : 'AURORA',
    colorSchemeJson: JSON.stringify({
      accent: content.colorAccent,
      highlight: content.colorHighlight,
      background: '#0B1220',
      foreground: '#F8FAFC',
      muted: '#64748B',
    }),
    colorScheme: {
      accent: content.colorAccent,
      highlight: content.colorHighlight,
      background: '#0B1220',
      foreground: '#F8FAFC',
      muted: '#64748B',
    },
    user: {
      username: slug,
      displayName: isRadio ? 'Tahti Radio' : content.displayName,
      bio: content.bio,
      avatarUrl: isRadio ? null : (content.avatarUrl ?? null),
    },
    nowPlaying: live
      ? {
          title: isRadio ? 'Aurora Drift' : content.nowPlayingTitle,
          artistName: isRadio ? 'Northern Lights' : content.displayName,
          artistUsername: isRadio ? 'northern-lights' : slug,
          artworkUrl: isRadio ? null : (content.trackArtwork?.[0] ?? null),
        }
      : null,
  };
}

/** Member-relay snapshot (GET /api/v1/radio) — distinct from the always-on station. */
export function mockRadio(): RadioNowPlaying {
  return {
    live: true,
    channel: {
      slug: 'northern-lights',
      displayName: 'Northern Lights',
      hlsUrl: DEMO_HLS,
      title: 'Featured live',
      artworkUrl: null,
    },
  };
}

export function mockRadioRecentlyPlayed(): RadioRecentlyPlayedItem[] {
  const now = Date.now();
  return [
    {
      id: 'mock-rp-1',
      title: 'Aurora Drift',
      artistName: 'Northern Lights',
      artistUsername: 'northern-lights',
      artworkUrl: null,
      playedAt: new Date(now - 3 * 60_000).toISOString(),
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    },
    {
      id: 'mock-rp-2',
      title: 'Route 550',
      artistName: 'Midnight Cartography',
      artistUsername: 'midnight-cartography',
      artworkUrl: null,
      playedAt: new Date(now - 18 * 60_000).toISOString(),
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
      id: 'mock-rp-3',
      title: 'Boathouse Session — Set 1',
      artistName: 'Saimaa Sessions',
      artistUsername: 'saimaa-sessions',
      artworkUrl: null,
      playedAt: new Date(now - 42 * 60_000).toISOString(),
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    },
    {
      id: 'mock-rp-4',
      title: 'Echo Chamber Cypher',
      artistName: 'Kaiku Collective',
      artistUsername: 'kaiku-collective',
      artworkUrl: null,
      playedAt: new Date(now - 71 * 60_000).toISOString(),
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
    {
      id: 'mock-rp-5',
      title: 'CC0 Selects Cut',
      artistName: 'Tahti Selects',
      artistUsername: null,
      artworkUrl: null,
      playedAt: new Date(now - 96 * 60_000).toISOString(),
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
  ];
}

const GENRE_TAGS: Record<string, string> = {
  ambient: 'ambient',
  live: 'live',
  electronic: 'electronic',
  downtempo: 'downtempo',
  'trip-hop': 'downtempo',
  noise: 'noise',
  experimental: 'experimental',
  jazz: 'jazz',
  improv: 'jazz',
  'hip-hop': 'hip-hop',
  beats: 'hip-hop',
  synthwave: 'synthwave',
  retro: 'synthwave',
  folk: 'folk',
  acoustic: 'folk',
};

export function mockArchiveItems(slug: string): ArchiveItem[] {
  const channel = mockChannel(slug);
  const content = stationContent(slug);
  const artist = channel.user.displayName;
  const primaryGenre = GENRE_TAGS[content.genres[0] ?? ''] ?? 'electronic';
  const durations = [372, 541, 120, 298, 615];
  const dates = [
    '2026-07-01T20:00:00.000Z',
    '2026-06-12T18:30:00.000Z',
    '2026-05-01T12:00:00.000Z',
    '2026-04-18T21:00:00.000Z',
    '2026-03-22T19:15:00.000Z',
  ];
  return content.trackTitles.map((title, i) => ({
    id: `${slug}-archive-${i + 1}`,
    title,
    artistName: artist,
    durationSec: durations[i % durations.length],
    bannerUrl: content.trackArtwork?.[i] ?? null,
    audioUrl: i === durations.length - 1 && i % 2 === 0 ? DEMO_HLS : DEMO_MP3,
    genre: primaryGenre,
    createdAt: dates[i % dates.length],
    ...(i === 0 ? { pinnedAt: '2026-07-15T12:00:00.000Z' } : {}),
  }));
}

export function mockProfile(username: string): PublicProfile {
  const channel = mockChannel(username);
  const content = stationContent(username);
  const archive = mockArchiveItems(username);
  const releaseSlugFor = (i: number) => `${username}-release-${i + 1}`;

  const releases = content.releases.map((rel, i) => ({
    id: `${username}-rel-${i + 1}`,
    title: rel.title,
    type: rel.type,
    artworkUrl: content.releaseArtwork?.[i] ?? null,
    smartLinkSlug: releaseSlugFor(i),
    releaseDate: [
      '2026-04-01T00:00:00.000Z',
      '2026-01-15T00:00:00.000Z',
      '2025-10-03T00:00:00.000Z',
    ][i % 3],
    genre: GENRE_TAGS[content.genres[0] ?? ''] ?? content.genres[0] ?? null,
    description: rel.description,
    tracks: archive.slice(i * 2, i * 2 + 2).map((a, j) => ({
      position: j + 1,
      title: a.title,
      durationSec: a.durationSec,
      archiveItemId: a.id,
      playUrl: a.audioUrl,
    })),
  }));

  return {
    artist: {
      username: channel.user.username,
      displayName: channel.user.displayName,
      bio: channel.user.bio,
      avatarUrl: channel.user.avatarUrl,
      tipJarUrl: null,
      tier: 'FREE',
      pronouns: content.pronouns ?? null,
      followerCount: content.followerCount,
      freeSubscriptionsEnabled: getMockFreeSubscriptionsEnabled(
        channel.user.username,
      ),
    },
    channel: { slug: channel.slug, state: channel.state, artistKind: 'SINGLE' },
    releases,
    tracks: archive.map((a, i) => ({
      id: a.id,
      title: a.title,
      artistName: a.artistName,
      durationSec: a.durationSec,
      bannerUrl: a.bannerUrl,
      playUrl: a.audioUrl,
      releaseSlug: releaseSlugFor(
        Math.floor(i / 2) % Math.max(releases.length, 1),
      ),
      pinned: Boolean(a.pinnedAt),
      pinnedAt: a.pinnedAt ?? null,
    })),
    fanTiers: [
      {
        id: 'tier-1',
        name: 'Supporter',
        amountCents: 500,
      },
      {
        id: 'tier-2',
        name: 'Patron',
        amountCents: 1500,
      },
    ],
    collections: [
      {
        slug: 'favorites-vault',
        name: 'Favorites vault',
        type: 'PLAYLIST',
        style: 'LIST',
        description: `Hand-picked highlights from ${content.displayName}'s archive.`,
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
    items: [
      ...archive.slice(0, 2).map((a, i) => ({
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
      // Embed-only row: Tahti stores just the reference, so the provider's
      // own widget supplies the audio and cover art.
      {
        id: 'col-item-hearthis-mock',
        position: 2,
        archiveItem: {
          id: 'archive-hearthis-mock',
          title: 'Deep Space Transmission (hearthis.at)',
          durationSec: 2280,
          bannerUrl: null,
          audioUrl: null,
          channel: { slug: username },
          embedProvider: 'HEARTHIS' as const,
          embedUri: '1234567',
        },
        release: null,
      },
    ],
    links: {
      page: `https://tahti.live/u/${username}/c/${slug}`,
      rss: `/api/v1/collections/${slug}/rss.xml`,
    },
  };
}

export function mockSmartLink(smartLinkSlug: string): SmartLinkView {
  const username =
    smartLinkSlug.match(/^(.*)-release-\d+$/)?.[1] ?? 'northern-lights';
  const profile = mockProfile(username);
  const release = profile.releases[0]!;
  return {
    release: {
      id: release.id,
      title: release.title,
      type: release.type,
      artworkUrl: release.artworkUrl,
      releaseDate: release.releaseDate,
      genre: release.genre,
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
  const isRadio = channel.slug === TAHTI_RADIO_SLUG;
  return {
    id: isRadio ? `radio:${channel.slug}` : `live:${channel.slug}`,
    kind: isRadio ? 'radio' : 'live',
    title: channel.nowPlaying?.title ?? `${channel.user.displayName} LIVE`,
    artist: channel.nowPlaying?.artistName ?? channel.user.displayName,
    coverUrl:
      channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl ?? undefined,
    streamUrl: channel.hlsUrl,
    protocol: 'hls',
    channelSlug: channel.slug,
  };
}

export function radioToPlayable(radio: RadioNowPlaying): TahtiPlayable | null {
  const ch = radio.channel;
  if (!radio.live || !ch?.hlsUrl) {
    return null;
  }
  return {
    id: `radio:${ch.slug}`,
    kind: 'radio',
    title: ch.title ?? 'Tahti Radio',
    artist: ch.displayName ?? ch.slug,
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
      text: 'Loving this set',
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
      description: 'Member subscriptions',
      category: 'REVENUE_SUBSCRIPTION',
      amountCents: '40000',
      createdAt: '2026-07-01T10:00:00.000Z',
    },
    {
      id: '2',
      description: 'Hosting',
      category: 'COST_INFRASTRUCTURE',
      amountCents: '-15000',
      createdAt: '2026-07-02T10:00:00.000Z',
    },
  ];
}

export function mockAnnouncements(): Announcement[] {
  return [
    {
      id: '3',
      headline: 'Fan subscriptions now support tiers',
      summary:
        'Artists can define multiple fan subscription tiers with custom perks and pricing.',
      authorName: 'Tahti team',
      publishedAt: '2026-08-05T09:00:00.000Z',
    },
    {
      id: '2',
      headline: 'Fixed HLS stalls on channel reconnect',
      summary:
        'Live channels now recover cleanly after a network drop instead of freezing on the last frame.',
      authorName: 'Tahti team',
      publishedAt: '2026-07-22T14:30:00.000Z',
    },
    {
      id: '1',
      headline: 'Welcome to Tahti',
      summary:
        'Search, playlists, radio, and artist studio tools are live in beta. Send feedback from Settings.',
      authorName: 'Tahti team',
      publishedAt: '2026-07-01T08:00:00.000Z',
    },
  ];
}

function feedArtist(slug: string) {
  const channel = mockChannel(slug);
  return {
    username: slug,
    displayName: channel.user.displayName,
    avatarUrl: channel.user.avatarUrl,
  };
}

/** GET /api/me/feed — recent posts/tracks/releases from artists the member
 * follows. Mixes a few of the richer mock stations so it reads like a real
 * timeline instead of one repeated fixture. */
export function mockFeed(): FeedResponse {
  const moonlight = stationContent('dj-moonlight');
  const cartography = stationContent('midnight-cartography');
  return {
    followingCount: 5,
    items: [
      {
        kind: 'release',
        id: 'feed-1',
        date: '2026-08-14T18:00:00.000Z',
        artist: feedArtist('dj-moonlight'),
        title: moonlight.releases[1].title,
        releaseType: moonlight.releases[1].type,
        artworkUrl: moonlight.releaseArtwork?.[1] ?? null,
        smartLinkSlug: 'dj-moonlight-release-2',
      },
      {
        kind: 'post',
        id: 'feed-2',
        date: '2026-08-13T09:30:00.000Z',
        artist: feedArtist('midnight-cartography'),
        title: 'Thursday show moved an hour later',
        body: 'Starting at 01:00 EEST this week — recording a special Ring Rail segment first. See you after midnight.',
      },
      {
        kind: 'track',
        id: 'feed-3',
        date: '2026-08-12T21:15:00.000Z',
        artist: feedArtist('dj-moonlight'),
        title: moonlight.trackTitles[0],
        bannerUrl: moonlight.trackArtwork?.[0] ?? null,
        channelSlug: 'dj-moonlight',
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        kind: 'release',
        id: 'feed-4',
        date: '2026-08-10T12:00:00.000Z',
        artist: feedArtist('kaiku-collective'),
        title:
          stationContent('kaiku-collective').releases[0]?.title ??
          'New release',
        releaseType:
          stationContent('kaiku-collective').releases[0]?.type ?? 'EP',
        artworkUrl: null,
        smartLinkSlug: 'kaiku-collective-release-1',
      },
      {
        kind: 'track',
        id: 'feed-5',
        date: '2026-08-08T19:45:00.000Z',
        artist: feedArtist('midnight-cartography'),
        title: cartography.trackTitles[0],
        bannerUrl: null,
        channelSlug: 'midnight-cartography',
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      {
        kind: 'post',
        id: 'feed-6',
        date: '2026-08-05T15:00:00.000Z',
        artist: feedArtist('northern-lights'),
        title: null,
        body: 'Winter field recordings from the Rovaniemi session are archived now — check the catalog for the raw takes.',
      },
    ],
  };
}
