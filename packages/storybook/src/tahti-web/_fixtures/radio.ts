import type {
  PublicRadioShow,
  PublicRadioShowEpisode,
  RadioShowNowPlayingTrack,
  RadioShowUpcomingTrack,
} from '@tahti-web/api/shows';

const cover = (seed: string) => `https://picsum.photos/seed/${seed}/300`;

export const RADIO_SHOW_UPCOMING: PublicRadioShowEpisode[] = [
  {
    id: 'ep-up-1',
    startAt: '2027-01-15T19:00:00.000Z',
    endAt: '2027-01-15T21:00:00.000Z',
    note: 'Deep cuts from the winter archive',
    showType: 'LIVE_SET',
    title: 'Polar Night Sessions #12',
    description: 'Two hours of slow-burning ambient techno, live from Oulu.',
    coverUrl: cover('polar-night-12'),
    recording: null,
  },
  {
    id: 'ep-up-2',
    startAt: '2027-01-22T17:00:00.000Z',
    endAt: '2027-01-22T18:00:00.000Z',
    note: 'With guests from Kaiku Collective',
    showType: 'TALK',
    title: null,
    description: null,
    coverUrl: null,
    recording: null,
  },
];

export const RADIO_SHOW_PAST: PublicRadioShowEpisode[] = [
  {
    id: 'ep-past-1',
    startAt: '2026-09-25T19:00:00.000Z',
    endAt: '2026-09-25T21:00:00.000Z',
    note: null,
    showType: 'LIVE_SET',
    title: 'Polar Night Sessions #11',
    description: 'Field recordings from Lapland layered over modular drones.',
    coverUrl: cover('polar-night-11'),
    recording: {
      soundId: 'mock-rp-1',
      title: 'Polar Night Sessions #11',
      channelItemUrl: '/channel/northern-lights#archive-item-mock-rp-1',
    },
  },
  {
    id: 'ep-past-2',
    startAt: '2026-09-18T17:00:00.000Z',
    endAt: '2026-09-18T18:00:00.000Z',
    note: 'Studio chat about the new EP',
    showType: 'TALK',
    title: null,
    description: null,
    coverUrl: null,
    recording: {
      soundId: 'mock-rp-2',
      title: 'EP launch talk',
      channelItemUrl: '/channel/northern-lights#archive-item-mock-rp-2',
    },
  },
];

export const RADIO_SHOW: PublicRadioShow = {
  artist: {
    displayName: 'Northern Lights',
    username: 'northern-lights',
    avatarUrl: cover('northern-lights-avatar'),
    channelSlug: 'northern-lights',
    bio: 'Ambient techno and modular sets from the far north.',
    coverUrl: cover('northern-lights-cover'),
  },
  upcomingEpisodes: RADIO_SHOW_UPCOMING,
  pastEpisodes: RADIO_SHOW_PAST,
  nextShowAt: RADIO_SHOW_UPCOMING[0]!.startAt,
  lastShowAt: RADIO_SHOW_PAST[0]!.startAt,
};

export const RADIO_SHOW_NOW_PLAYING: RadioShowNowPlayingTrack = {
  title: 'Aurora Drift',
  artistName: 'Northern Lights',
  artistUsername: 'northern-lights',
  artworkUrl: cover('aurora-drift'),
  durationSec: 312,
  startedAt: '2026-10-03T18:00:00.000Z',
};

export const RADIO_SHOW_UP_NEXT: RadioShowUpcomingTrack[] = [
  {
    id: 'up-1',
    title: 'Route 550',
    artistName: 'Midnight Cartography',
    artistUsername: 'midnight-cartography',
    artworkUrl: cover('route-550'),
  },
  {
    id: 'up-2',
    title: 'Kaiku',
    artistName: 'Kaiku Collective',
    artistUsername: 'kaiku-collective',
    artworkUrl: null,
  },
];
