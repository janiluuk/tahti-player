import type { ListeningPartyDto } from '../../../api/listening-parties';
import type { ListeningPartyClock } from '../../../hooks/useListeningPartyTimeline';
import { computeListeningPartyTimeline } from '../../../lib/listeningPartyTimeline';

export const PARTY_START = '2026-11-06T20:00:00.000Z';
const startMs = Date.parse(PARTY_START);

export function testParty(
  overrides: Partial<ListeningPartyDto> = {},
): ListeningPartyDto {
  return {
    id: 'lp1',
    state: 'SCHEDULED',
    startAt: PARTY_START,
    endAt: '2026-11-06T20:06:00.000Z',
    serverNow: '2026-11-06T19:00:00.000Z',
    hostNote: 'Headphones on.',
    channel: { slug: 'night-drive', name: 'Night Drive', avatarUrl: null },
    host: { username: 'aino', displayName: 'Aino Virta', avatarUrl: null },
    release: {
      id: 'rel1',
      title: 'Polar Static',
      type: 'ALBUM',
      artworkUrl: null,
      smartLinkSlug: 'polar-static',
      releaseDate: null,
      isPreRelease: false,
      description: null,
      commentary: 'Made in a cabin.\n\nThe generator hums on track 2.',
      credits: [
        { role: 'producer', name: 'Aino Virta', artistUsername: 'aino' },
        { role: 'mastering', name: 'Kaiku Mastering', artistUsername: null },
      ],
      pLine: '℗ 2026 Aino Virta',
      cLine: null,
      labelImprint: 'Polar Records',
    },
    tracks: [
      {
        id: 't1',
        position: 1,
        title: 'Cold Open',
        durationSec: 120,
        credits: [],
      },
      {
        id: 't2',
        position: 2,
        title: 'Aurora Drift',
        durationSec: 180,
        credits: [{ role: 'vocals', name: 'Liina', artistUsername: null }],
      },
      { id: 't3', position: 3, title: 'Thaw', durationSec: 60, credits: [] },
    ],
    nowPlaying: null,
    purchaseTiers: [
      {
        id: 'tier1',
        name: 'Digital album',
        description: 'FLAC and MP3',
        priceCents: 900,
        priceOptional: false,
        currency: 'EUR',
      },
    ],
    ...overrides,
  };
}

/** The clock `useListeningPartyTimeline` would give `party` at
 * `secondsFromStart`. */
export function testClock(
  party: ListeningPartyDto,
  secondsFromStart: number,
): ListeningPartyClock {
  const nowMs = startMs + secondsFromStart * 1000;
  return {
    ...computeListeningPartyTimeline({
      startAt: party.startAt,
      tracks: party.tracks,
      canceledAt: party.state === 'CANCELED' ? party.startAt : null,
      now: nowMs,
    }),
    nowMs,
    msUntilStart: Math.max(0, startMs - nowMs),
  };
}
