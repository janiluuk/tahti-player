import {
  type StudioEpisode,
  type StudioShowBooking,
  type StudioShowSeries,
} from './types';

export const SERIES_KEY = 'tahti-studio-show-series-v1';
export const EPISODES_KEY = 'tahti-studio-episodes-v1';

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

export function seedSeries(): StudioShowSeries[] {
  const existing = readJson<StudioShowSeries[]>(SERIES_KEY, []);
  if (existing.length > 0) {
    return existing;
  }
  const seeded: StudioShowSeries[] = [
    {
      id: 'show-series-demo',
      title: 'Friday Frequency',
      description: 'Weekly deep electronic set — live on Tahti Radio.',
      coverUrl: null,
      showType: 'LIVE_SET',
      nextEpisodeNumber: 4,
      intervalHours: 2,
      scheduleNote: 'Fridays',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'show-series-cartography',
      title: 'Route 550 Live',
      description:
        'Weekly late-night dub session recorded riding the actual bus route — mixed live from a portable rig, broadcast the same night.',
      coverUrl: null,
      showType: 'LIVE_SET',
      nextEpisodeNumber: 3,
      intervalHours: 1,
      scheduleNote: 'Thursdays, after midnight',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'show-series-cypher',
      title: 'Kaiku Cypher Sessions',
      description:
        'Rotating slot for the six Kaiku Collective producers — one new beat and a closing freestyle every week.',
      coverUrl: null,
      showType: 'LIVE_SET',
      nextEpisodeNumber: 2,
      intervalHours: 1,
      scheduleNote: 'Sundays',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'show-series-studio-talk',
      title: 'Boathouse Talk',
      description:
        'Monthly interview show — a working artist joins for an unscripted conversation about process, gear, and the Finnish scene.',
      coverUrl: null,
      showType: 'TALK',
      nextEpisodeNumber: 2,
      intervalHours: 1,
      scheduleNote: 'First Tuesday of the month',
      createdAt: new Date().toISOString(),
    },
  ];
  writeJson(SERIES_KEY, seeded);
  return seeded;
}

export function seedEpisodes(): StudioEpisode[] {
  const existing = readJson<StudioEpisode[]>(EPISODES_KEY, []);
  if (existing.length > 0) {
    return existing;
  }
  const seeded: StudioEpisode[] = [
    {
      id: 'ep-demo-1',
      showId: 'show-series-demo',
      episodeNumber: 1,
      title: 'Friday Frequency — Episode 1',
      description: 'Weekly deep electronic set — live on Tahti Radio.',
      coverUrl: null,
      status: 'APPROVED',
      source: 'upload',
      soundId: 'arch-mock-1',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-demo-2',
      showId: 'show-series-demo',
      episodeNumber: 2,
      title: 'Friday Frequency — Episode 2',
      description: 'Weekly deep electronic set — live on Tahti Radio.',
      coverUrl: null,
      status: 'PENDING_APPROVAL',
      source: 'broadcast',
      soundId: 'arch-mock-1',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-demo-3',
      showId: 'show-series-demo',
      episodeNumber: 3,
      title: 'Friday Frequency — Episode 3',
      description: 'Weekly deep electronic set — live on Tahti Radio.',
      coverUrl: null,
      status: 'APPROVED',
      source: 'upload',
      soundId: 'arch-mock-2',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-cartography-1',
      showId: 'show-series-cartography',
      episodeNumber: 1,
      title: 'Route 550 Live — Episode 1',
      description:
        'First edition — Kamppi to Tapiola, recorded live on a Thursday night run.',
      coverUrl: null,
      status: 'APPROVED',
      source: 'broadcast',
      soundId: 'arch-mock-3',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-cartography-2',
      showId: 'show-series-cartography',
      episodeNumber: 2,
      title: 'Route 550 Live — Episode 2',
      description: 'Ring Rail loop special — full 68-minute circuit, unedited.',
      coverUrl: null,
      status: 'PENDING_APPROVAL',
      source: 'broadcast',
      soundId: null,
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-cypher-1',
      showId: 'show-series-cypher',
      episodeNumber: 1,
      title: 'Kaiku Cypher Sessions — Episode 1',
      description:
        'Season opener — all six producers, closing group freestyle.',
      coverUrl: null,
      status: 'APPROVED',
      source: 'upload',
      soundId: 'arch-mock-4',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-studio-talk-1',
      showId: 'show-series-studio-talk',
      episodeNumber: 1,
      title: 'Boathouse Talk — Episode 1: Saimaa Sessions',
      description:
        'First guest: the Saimaa Sessions trio on recording live over lake thaws and never repeating a set.',
      coverUrl: null,
      status: 'APPROVED',
      source: 'upload',
      soundId: 'arch-mock-5',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
  ];
  writeJson(EPISODES_KEY, seeded);
  return seeded;
}

export let mockBookings: StudioShowBooking[] = [
  {
    id: 'booking-mock-1',
    startAt: new Date(Date.now() + 26 * 3600_000).toISOString(),
    endAt: new Date(Date.now() + 28 * 3600_000).toISOString(),
    note: 'Friday Frequency',
    showType: 'LIVE_SET',
    channelSlug: 'demo',
    username: 'demo',
    displayName: 'Demo Artist',
    isMine: true,
  },
  {
    id: 'booking-mock-2',
    // Starts soon — exercises the "green room open now" banner in
    // RadioScheduleView without needing to fiddle the system clock.
    startAt: new Date(Date.now() + 8 * 60_000).toISOString(),
    endAt: new Date(Date.now() + 68 * 60_000).toISOString(),
    note: 'Route 550 Live',
    showType: 'LIVE_SET',
    channelSlug: 'midnight-cartography',
    username: 'midnight-cartography',
    displayName: 'Midnight Cartography',
    isMine: false,
  },
  {
    id: 'booking-mock-3',
    startAt: new Date(Date.now() + 74 * 3600_000).toISOString(),
    endAt: new Date(Date.now() + 75 * 3600_000).toISOString(),
    note: 'Kaiku Cypher Sessions',
    showType: 'LIVE_SET',
    channelSlug: 'kaiku-collective',
    username: 'kaiku-collective',
    displayName: 'Kaiku Collective',
    isMine: false,
  },
  {
    id: 'booking-mock-4',
    startAt: new Date(Date.now() + 122 * 3600_000).toISOString(),
    endAt: new Date(Date.now() + 123 * 3600_000).toISOString(),
    note: 'Boathouse Talk',
    showType: 'TALK',
    channelSlug: 'saimaa-sessions',
    username: 'saimaa-sessions',
    displayName: 'Saimaa Sessions',
    isMine: false,
  },
];

export function setMockBookings(next: StudioShowBooking[]): void {
  mockBookings = next;
}
