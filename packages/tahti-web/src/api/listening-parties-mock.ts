/**
 * Offline listening-party store (`VITE_FORCE_MOCK=1`, Storybook).
 *
 * Seeds one party per state on the `northern-lights` channel. Start times
 * are relative to when the store is seeded, so the LIVE party is mid-album
 * whenever a page or story loads; Storybook re-seeds on every story.
 */

import { safeCreditName } from '../lib/displayName';
import { computeListeningPartyTimeline } from '../lib/listeningPartyTimeline';
import type {
  CreateListeningPartyBody,
  ListeningPartyCredit,
  ListeningPartyDto,
  ListeningPartyMutationResult,
  ListeningPartySummaryDto,
  UpdateListeningPartyBody,
} from './listening-parties';
import { onMockOverridesReset } from './mock-overrides';
import { getMockSessionUser } from './mock-session';
import { ensureMockPurchaseTiers } from './purchase-tiers';
import { fetchStudioReleases } from './studio/studio-releases';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const MIN_LEAD_MS = 5 * MINUTE;
const MAX_LEAD_MS = 365 * DAY;
const DEFAULT_TRACK_SEC = 210;

export const MOCK_LISTENING_PARTY_IDS = {
  scheduled: 'lp-mock-scheduled',
  live: 'lp-mock-live',
  ended: 'lp-mock-ended',
  canceled: 'lp-mock-canceled',
} as const;

type MockRelease = ListeningPartyDto['release'] & {
  tracks: ListeningPartyDto['tracks'];
};

type MockHost = {
  channel: ListeningPartyDto['channel'];
  host: ListeningPartyDto['host'];
};

type MockPartyRecord = {
  id: string;
  release: MockRelease;
  hostKey: string;
  startAt: string;
  hostNote: string | null;
  canceledAt: string | null;
};

const credit = (
  role: string,
  name: string,
  artistUsername: string | null = null,
): ListeningPartyCredit => ({ role, name, artistUsername });

const HOSTS: Record<string, MockHost> = {
  'northern-lights': {
    channel: {
      slug: 'northern-lights',
      name: 'Northern Lights',
      avatarUrl: null,
    },
    host: {
      username: 'northern-lights',
      displayName: 'Northern Lights',
      avatarUrl: null,
    },
  },
};

function hostFor(username: string): MockHost {
  return (
    HOSTS[username] ?? {
      channel: { slug: username, name: username, avatarUrl: null },
      host: { username, displayName: username, avatarUrl: null },
    }
  );
}

const POLAR_STATIC: MockRelease = {
  id: 'rel-mock-polar-static',
  title: 'Polar Static',
  type: 'ALBUM',
  artworkUrl: null,
  smartLinkSlug: 'polar-static',
  releaseDate: null,
  isPreRelease: true,
  description: 'Eight pieces built on one modular rig over a winter.',
  commentary:
    'We recorded **Polar Static** in a cabin north of Rovaniemi, one track a week, ' +
    'the rig never switched off.\n\n' +
    'Every piece starts from the same patch. What changes is the weather: ' +
    'listen for the tape hiss that creeps in on "Aurora Drift", that is the ' +
    'generator outside.\n\n' +
    '- Side A was tracked live, no overdubs.\n' +
    '- Side B was rebuilt from the A-side stems.',
  credits: [
    credit('producer', 'Northern Lights', 'northern-lights'),
    credit('mastering', 'Kaiku Mastering'),
    credit('artwork', 'Liina Kallio'),
  ],
  pLine: '℗ 2026 Northern Lights',
  cLine: '© 2026 Northern Lights',
  labelImprint: 'Polar Records',
  tracks: [
    ['Cold Open', 192],
    ['Aurora Drift', 247],
    ['Static Bloom', 205],
    ['Ice Road', 311],
    ['Magnetosphere', 268],
    ['Low Sun', 184],
    ['Polar Static', 356],
    ['Thaw', 229],
  ].map(([title, durationSec], index) => ({
    id: `lp-track-ps-${index + 1}`,
    position: index + 1,
    title: title as string,
    durationSec: durationSec as number,
    credits:
      index === 1
        ? [credit('synths', 'Northern Lights', 'northern-lights')]
        : index === 6
          ? [credit('vocals', 'Aino Virta'), credit('writer', 'Aino Virta')]
          : [],
  })),
};

const FOREST_COVER: MockRelease = {
  id: 'rel-mock-forest-cover',
  title: 'Forest Cover',
  type: 'EP',
  artworkUrl: null,
  smartLinkSlug: 'forest-cover',
  releaseDate: '2026-09-12T00:00:00.000Z',
  isPreRelease: false,
  description: 'An acoustic EP recorded outdoors.',
  commentary:
    'Four takes from Haukkalampi, recorded the same evening they were written.',
  credits: [credit('recording', 'Northern Lights', 'northern-lights')],
  pLine: '℗ 2026 Northern Lights',
  cLine: null,
  labelImprint: null,
  tracks: [
    ['Haukkalampi', 201],
    ['Birch Light', 176],
    ['Trail Fund', 233],
    ['Blanket Weather', 264],
  ].map(([title, durationSec], index) => ({
    id: `lp-track-fc-${index + 1}`,
    position: index + 1,
    title: title as string,
    durationSec: durationSec as number,
    credits: [],
  })),
};

const MOCK_TIERS = [
  {
    id: 'lp-mock-tier-digital',
    name: 'Polar Static · digital album',
    description: 'FLAC and MP3, delivered on release day.',
    priceCents: 900,
    priceOptional: false,
    active: true,
    position: 0,
  },
  {
    id: 'lp-mock-tier-support',
    name: 'Support the record',
    description: 'Pay what you want; every euro goes to the vinyl run.',
    priceCents: 500,
    priceOptional: true,
    active: true,
    position: 1,
  },
];

function seed(now: number = Date.now()): MockPartyRecord[] {
  const iso = (ms: number) => new Date(ms).toISOString();
  return [
    {
      id: MOCK_LISTENING_PARTY_IDS.scheduled,
      release: POLAR_STATIC,
      hostKey: 'northern-lights',
      startAt: iso(now + 2 * DAY + 3 * 60 * MINUTE),
      hostNote:
        'Grab headphones. I will be in the chat the whole way through, telling the story of each track as it plays.',
      canceledAt: null,
    },
    {
      id: MOCK_LISTENING_PARTY_IDS.live,
      release: POLAR_STATIC,
      hostKey: 'northern-lights',
      // Into the second track, so a fresh page load joins late.
      startAt: iso(now - 4 * MINUTE),
      hostNote: 'Thanks for coming. Ask me anything about the cabin.',
      canceledAt: null,
    },
    {
      id: MOCK_LISTENING_PARTY_IDS.ended,
      release: FOREST_COVER,
      hostKey: 'northern-lights',
      startAt: iso(now - 7 * DAY),
      hostNote: null,
      canceledAt: null,
    },
    {
      id: MOCK_LISTENING_PARTY_IDS.canceled,
      release: POLAR_STATIC,
      hostKey: 'northern-lights',
      startAt: iso(now + 5 * DAY),
      hostNote: null,
      canceledAt: iso(now - DAY),
    },
  ];
}

let records: MockPartyRecord[] = seed();

onMockOverridesReset(() => {
  records = seed();
});

function timelineOf(record: MockPartyRecord, now: number) {
  return computeListeningPartyTimeline({
    startAt: record.startAt,
    tracks: record.release.tracks,
    canceledAt: record.canceledAt,
    now,
  });
}

function toDto(
  record: MockPartyRecord,
  now: number = Date.now(),
): ListeningPartyDto {
  const { tracks, ...release } = record.release;
  const timeline = timelineOf(record, now);
  const host = hostFor(record.hostKey);
  return {
    id: record.id,
    state: timeline.state,
    startAt: record.startAt,
    endAt: timeline.endAt.toISOString(),
    serverNow: new Date(now).toISOString(),
    hostNote: record.hostNote,
    channel: host.channel,
    host: host.host,
    release,
    tracks,
    nowPlaying: timeline.nowPlaying,
    purchaseTiers: ensureMockPurchaseTiers(host.host.username, MOCK_TIERS).map(
      (tier) => ({
        id: tier.id,
        name: tier.name,
        description: tier.description,
        priceCents: tier.priceCents,
        priceOptional: tier.priceOptional,
        currency: 'EUR',
      }),
    ),
  };
}

function toSummary(
  record: MockPartyRecord,
  now: number = Date.now(),
): ListeningPartySummaryDto {
  const timeline = timelineOf(record, now);
  const host = hostFor(record.hostKey);
  return {
    id: record.id,
    state: timeline.state,
    startAt: record.startAt,
    endAt: timeline.endAt.toISOString(),
    release: {
      id: record.release.id,
      title: record.release.title,
      artworkUrl: record.release.artworkUrl,
    },
    channel: { slug: host.channel.slug, name: host.channel.name },
  };
}

export function mockListeningParty(id: string): ListeningPartyDto | null {
  const record = records.find((row) => row.id === id);
  return record ? toDto(record) : null;
}

const SAMPLE_COUNT = 8;

/** A public sample MP3 per track, so the mock player has real audio. */
export function mockListeningPartyStreamUrl(trackId: string): string {
  const match = /(\d+)$/.exec(trackId);
  const n = match ? ((Number(match[1]) - 1) % SAMPLE_COUNT) + 1 : 1;
  return `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
}

export function listMockChannelListeningParties(
  slug: string,
): ListeningPartySummaryDto[] {
  const now = Date.now();
  return records
    .filter((record) => hostFor(record.hostKey).channel.slug === slug)
    .map((record) => toSummary(record, now))
    .filter((row) => row.state === 'SCHEDULED' || row.state === 'LIVE')
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 10);
}

function myUsername(): string | null {
  return getMockSessionUser()?.username ?? null;
}

export function listMockMyListeningParties(): ListeningPartySummaryDto[] {
  const me = myUsername();
  const now = Date.now();
  return records
    .filter((record) => record.hostKey === me)
    .map((record) => toSummary(record, now))
    .sort((a, b) => b.startAt.localeCompare(a.startAt));
}

function startAtError(startAt: string, now: number): string | null {
  const ms = new Date(startAt).getTime();
  if (!Number.isFinite(ms)) {
    return 'Pick a start time';
  }
  if (ms < now + MIN_LEAD_MS) {
    return 'Start at least 5 minutes from now';
  }
  if (ms > now + MAX_LEAD_MS) {
    return 'Start within the next year';
  }
  return null;
}

function overlaps(
  candidate: MockPartyRecord,
  now: number,
): MockPartyRecord | undefined {
  const start = new Date(candidate.startAt).getTime();
  const end = timelineOf(candidate, now).endAt.getTime();
  return records.find((other) => {
    if (
      other.id === candidate.id ||
      other.hostKey !== candidate.hostKey ||
      other.canceledAt
    ) {
      return false;
    }
    const otherStart = new Date(other.startAt).getTime();
    const otherEnd = timelineOf(other, now).endAt.getTime();
    return start < otherEnd && otherStart < end;
  });
}

const OVERLAP_ERROR =
  'Another listening party on your channel overlaps that time';

export async function createMockListeningParty(
  body: CreateListeningPartyBody,
): Promise<ListeningPartyMutationResult> {
  const user = getMockSessionUser();
  if (!user) {
    return { ok: false, error: 'Sign in to schedule', status: 401 };
  }
  const now = Date.now();
  const timeError = startAtError(body.startAt, now);
  if (timeError) {
    return { ok: false, error: timeError, status: 400 };
  }
  const known = [POLAR_STATIC, FOREST_COVER].find(
    (release) => release.id === body.releaseId,
  );
  let release: MockRelease | null = known ?? null;
  if (!release) {
    const { data } = await fetchStudioReleases();
    const studio = data.releases.find((row) => row.id === body.releaseId);
    if (studio) {
      release = {
        id: studio.id,
        title: studio.title,
        type: studio.type,
        artworkUrl: studio.artworkUrl ?? null,
        smartLinkSlug: studio.smartLinkSlug,
        releaseDate: studio.releaseDate
          ? new Date(studio.releaseDate).toISOString()
          : null,
        isPreRelease: studio.state !== 'PUBLISHED',
        description: studio.description ?? null,
        commentary: null,
        credits: [],
        pLine: null,
        cLine: null,
        labelImprint: null,
        tracks: (studio.tracks ?? []).map((track) => ({
          id: `lp-track-${track.id}`,
          position: track.position,
          title: track.title,
          durationSec: track.durationSec ?? DEFAULT_TRACK_SEC,
          credits: (track.credits ?? []).map((row) => ({
            role: row.role,
            name: row.name,
            artistUsername: row.artistUsername ?? null,
          })),
        })),
      };
    }
  }
  if (!release) {
    return { ok: false, error: 'Release not found', status: 404 };
  }
  if (release.tracks.length === 0) {
    return {
      ok: false,
      error: 'Add tracks to the release before scheduling a party',
      status: 400,
    };
  }
  if (!HOSTS[user.username]) {
    const name =
      safeCreditName(user.displayName, user.username) ?? user.username;
    HOSTS[user.username] = {
      channel: {
        slug: user.channel?.slug ?? user.username,
        name,
        avatarUrl: null,
      },
      host: { username: user.username, displayName: name, avatarUrl: null },
    };
  }
  const record: MockPartyRecord = {
    id: `lp-mock-${now.toString(36)}`,
    release,
    hostKey: user.username,
    startAt: new Date(body.startAt).toISOString(),
    hostNote: body.hostNote?.trim() || null,
    canceledAt: null,
  };
  if (overlaps(record, now)) {
    return { ok: false, error: OVERLAP_ERROR, status: 409 };
  }
  records.push(record);
  return { ok: true, data: toDto(record, now) };
}

function ownRecord(
  id: string,
):
  | { ok: true; record: MockPartyRecord }
  | { ok: false; error: string; status: number } {
  const record = records.find((row) => row.id === id);
  if (!record) {
    return { ok: false, error: 'Listening party not found', status: 404 };
  }
  if (record.hostKey !== myUsername()) {
    return { ok: false, error: 'Not your listening party', status: 403 };
  }
  return { ok: true, record };
}

export async function updateMockListeningParty(
  id: string,
  body: UpdateListeningPartyBody,
): Promise<ListeningPartyMutationResult> {
  const found = ownRecord(id);
  if (!found.ok) {
    return found;
  }
  const { record } = found;
  const now = Date.now();
  if (timelineOf(record, now).state !== 'SCHEDULED') {
    return {
      ok: false,
      error: 'Only a party that has not started can be changed',
      status: 409,
    };
  }
  if (body.startAt !== undefined) {
    const timeError = startAtError(body.startAt, now);
    if (timeError) {
      return { ok: false, error: timeError, status: 400 };
    }
    const next = { ...record, startAt: new Date(body.startAt).toISOString() };
    if (overlaps(next, now)) {
      return { ok: false, error: OVERLAP_ERROR, status: 409 };
    }
    record.startAt = next.startAt;
  }
  if (body.hostNote !== undefined) {
    record.hostNote = body.hostNote?.trim() || null;
  }
  return { ok: true, data: toDto(record, now) };
}

export async function cancelMockListeningParty(
  id: string,
): Promise<ListeningPartyMutationResult> {
  const found = ownRecord(id);
  if (!found.ok) {
    return found;
  }
  const { record } = found;
  const now = Date.now();
  if (timelineOf(record, now).state === 'ENDED') {
    return {
      ok: false,
      error: 'This listening party has already ended',
      status: 409,
    };
  }
  record.canceledAt ??= new Date(now).toISOString();
  return { ok: true, data: toDto(record, now) };
}
