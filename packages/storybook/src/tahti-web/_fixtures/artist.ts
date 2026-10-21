import type { ArtistEvent } from '@tahti-web/api/events';
import type { LikedTrack } from '@tahti-web/api/likes';
import type { PublicProfile } from '@tahti-web/api/types';

import type { MockOverrides } from '../_lib/mock-data';

export const ARTIST_USERNAME = 'northern-lights';
export const ARTIST_NAME = 'Northern Lights';
export const TIP_JAR_URL = 'https://ko-fi.com/northernlights';
export const BACKGROUND_MUSIC_URL = '/mock/northern-lights/lobby-loop.mp3';
export const PINNED_RELEASE_TITLE = 'Polar Static';

/** One-frame GIF; the hero swaps to it from the poster only on focus/hover. */
export const AVATAR_GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
export const AVATAR_POSTER = '/mock/dj-moonlight/avatar.svg';

const LIKED_TRACKS: LikedTrack[] = [
  {
    id: 'dj-moonlight-archive-1',
    title: 'After Hours Drive',
    bannerUrl: '/mock/dj-moonlight/cover-after-hours.svg',
    audioUrl: '/mock/dj-moonlight/after-hours.mp3',
    channelSlug: 'dj-moonlight',
    artistUsername: 'dj-moonlight',
    artistDisplayName: 'DJ Moonlight',
    likedAt: '2026-09-30T21:00:00.000Z',
    url: '/t/dj-moonlight-archive-1',
  },
  {
    id: 'dj-moonlight-archive-2',
    title: 'Moonlight Drive',
    bannerUrl: '/mock/dj-moonlight/cover-moonlight-drive.svg',
    audioUrl: '/mock/dj-moonlight/moonlight-drive.mp3',
    channelSlug: 'dj-moonlight',
    artistUsername: 'dj-moonlight',
    artistDisplayName: 'DJ Moonlight',
    likedAt: '2026-09-21T18:30:00.000Z',
    url: '/t/dj-moonlight-archive-2',
  },
  {
    id: 'kaiku-archive-4',
    title: 'Gated Subscriber Cut',
    bannerUrl: null,
    audioUrl: null,
    channelSlug: 'kaiku',
    artistUsername: 'kaiku',
    artistDisplayName: 'Kaiku Collective',
    likedAt: '2026-09-02T12:00:00.000Z',
    url: '/t/kaiku-archive-4',
  },
];

/** Dated far ahead so `fetchChannelEvents`'s "upcoming only" filter keeps them. */
export const ARTIST_EVENTS: ArtistEvent[] = [
  {
    id: 'evt-story-1',
    title: 'Polar Static live at Kuudes Linja',
    description: 'The full record, start to finish, on the modular rig.',
    place: 'Kuudes Linja',
    location: 'Helsinki, Finland',
    eventUrl: 'https://kuudeslinja.fi/events/polar-static',
    startAt: '2099-02-14T19:30:00.000Z',
  },
  {
    id: 'evt-story-2',
    title: 'Boathouse Sessions Vol. 3',
    description: 'Audience recording on the dock.',
    place: 'Saimaa Boathouse Studio',
    location: 'Lappeenranta, Finland',
    eventUrl: null,
    startAt: '2099-06-21T17:00:00.000Z',
  },
];

function richProfile(base: PublicProfile): PublicProfile {
  const [firstRelease, secondRelease, ...rest] = base.releases;
  const releases = [
    ...(firstRelease ? [firstRelease] : []),
    ...(secondRelease
      ? [
          {
            ...secondRelease,
            title: PINNED_RELEASE_TITLE,
            pinned: true,
            pinnedAt: '2026-09-01T12:00:00.000Z',
          },
        ]
      : []),
    ...rest,
  ];
  return {
    ...base,
    artist: {
      ...base.artist,
      displayName: ARTIST_NAME,
      bio: 'Slow ambient broadcasts recorded under the aurora. Live every Thursday.',
      fullBio:
        'Started as a pirate shortwave project in Rovaniemi and grew into a member-run channel.',
      avatarUrl: AVATAR_GIF,
      avatarPosterUrl: AVATAR_POSTER,
      tipJarUrl: TIP_JAR_URL,
      isMember: true,
      nameplateText: 'Resident',
      nameplateColor: '#A78BFA',
      followerCount: 1284,
      followingCount: 37,
      showPageHero: true,
    },
    releases,
    fanTiers: [
      {
        id: 'tier-story-1',
        name: 'Supporter',
        amountCents: 500,
        description: 'Keeps the stream on air through the winter.',
        perks: ['FAN_CHAT'],
      },
      {
        id: 'tier-story-2',
        name: 'Patron',
        amountCents: 1500,
        description: 'Early access to every release, plus a monthly mix.',
        perks: ['FAN_CHAT', 'FAN_NEWSLETTER', 'Monthly thank-you mix'],
      },
    ],
    backgroundMusicUrl: BACKGROUND_MUSIC_URL,
  };
}

/** Every artist-page feature on: tip jar, fan tier perks, member badge,
 * GIF avatar with poster, background music, likes, a pinned release,
 * nameplate and upcoming events. */
export const artistRichData: MockOverrides = {
  profile: (base) => richProfile(base),
  publicGallery: [
    {
      id: 'gallery-story-1',
      imageUrl: '/mock/northern-lights/cover-first-light.svg',
      title: 'First Light session',
    },
    {
      id: 'gallery-story-2',
      imageUrl: '/mock/northern-lights/cover-polar-static.svg',
      title: 'Polar Static artwork',
    },
  ],
  userLikes: { showLikes: true, items: LIKED_TRACKS },
  channelEvents: ARTIST_EVENTS,
};

/** No avatar image: the hero falls back to the artist's avatar theme. */
export const artistThemeFallbackData: MockOverrides = {
  ...artistRichData,
  profile: (base) => {
    const profile = richProfile(base);
    return {
      ...profile,
      artist: {
        ...profile.artist,
        avatarUrl: null,
        avatarPosterUrl: null,
        avatarTheme: { kind: 'gradient', colors: ['#F472B6', '#8B5CF6'] },
      },
    };
  },
};

/** The artist turned the profile hero off in Settings. */
export const artistHeroHiddenData: MockOverrides = {
  ...artistRichData,
  profile: (base) => {
    const profile = richProfile(base);
    return { ...profile, artist: { ...profile.artist, showPageHero: false } };
  },
};

export const artistLikesData: MockOverrides = {
  userLikes: { showLikes: true, items: LIKED_TRACKS },
};

export const artistLikesHiddenData: MockOverrides = {
  userLikes: { showLikes: false, items: LIKED_TRACKS },
};

/**
 * Story `beforeEach`: media `play()` resolves without loading anything, so
 * audio buttons change state with no real playback. Returns the restore.
 */
export function stubMediaPlayback() {
  const proto = HTMLMediaElement.prototype;
  const { play, pause } = proto;
  proto.play = () => Promise.resolve();
  proto.pause = () => undefined;
  return () => {
    proto.play = play;
    proto.pause = pause;
  };
}
