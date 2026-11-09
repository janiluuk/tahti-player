import type { FetchMeta } from './client';
import { mockFixture } from './mock-overrides';
import { failMeta, isForceMock } from './mode';
import { requestJson } from './request-json';

export type ArtistEventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
export type ArtistEventRole = 'PERFORMER' | 'HOST' | 'GUEST';
export type ArtistEventParticipantStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export type ArtistEventParticipant = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  channelSlug: string | null;
  role: ArtistEventRole;
  status: ArtistEventParticipantStatus;
};

export type ArtistEvent = {
  id: string;
  title: string;
  description: string;
  place: string;
  location: string;
  eventUrl: string | null;
  ticketUrl: string | null;
  imageUrl: string | null;
  startAt: string;
  endAt: string | null;
  status: ArtistEventStatus;
  publishedAt: string | null;
  participants: ArtistEventParticipant[];
};

export function normalizeEvent(
  raw: Partial<ArtistEvent> &
    Pick<ArtistEvent, 'id' | 'title' | 'place' | 'location' | 'startAt'>,
): ArtistEvent {
  return {
    ...raw,
    description: raw.description ?? '',
    eventUrl: raw.eventUrl ?? null,
    ticketUrl: raw.ticketUrl ?? null,
    imageUrl: raw.imageUrl ?? null,
    endAt: raw.endAt ?? null,
    status: raw.status ?? 'PUBLISHED',
    publishedAt: raw.publishedAt ?? null,
    participants: Array.isArray(raw.participants) ? raw.participants : [],
  };
}

const mockBase = {
  ticketUrl: null,
  imageUrl: null,
  endAt: null,
  status: 'PUBLISHED' as const,
  publishedAt: '2026-08-01T10:00:00.000Z',
  participants: [] as ArtistEventParticipant[],
};

export const mockEvents: ArtistEvent[] = [
  {
    ...mockBase,
    id: 'evt-mock-1',
    title: 'Album release show',
    description:
      'Live debut of the full "Polar Static" record, played start to finish with the modular rig that built it. Doors 18:00, set starts 19:30. Limited-run cassette on sale at the door.',
    place: 'Northern Lights Hall',
    location: 'Helsinki, Finland',
    eventUrl: null,
    startAt: '2026-09-05T18:00:00.000Z',
  },
  {
    ...mockBase,
    id: 'evt-mock-2',
    title: 'Late-night broadcast + open studio',
    description:
      'A rare in-person edition of the Thursday show — recorded live in front of an audience, includes a Q&A on the tape-warp bass chain between sets. BYO headphones for the silent-disco closer.',
    place: 'Kuudes Linja',
    location: 'Helsinki, Finland',
    eventUrl: 'https://kuudeslinja.fi/events/midnight-cartography',
    ticketUrl: 'https://tickets.example/kuudes-linja',
    startAt: '2026-09-19T21:00:00.000Z',
    endAt: '2026-09-20T02:00:00.000Z',
    participants: [
      {
        username: 'northern-signals',
        displayName: 'Northern Signals',
        avatarUrl: null,
        channelSlug: 'northern-signals',
        role: 'PERFORMER',
        status: 'ACCEPTED',
      },
      {
        username: 'yaniho',
        displayName: 'Yaniho',
        avatarUrl: null,
        channelSlug: null,
        role: 'GUEST',
        status: 'PENDING',
      },
    ],
  },
  {
    ...mockBase,
    id: 'evt-mock-3',
    title: 'Boathouse Sessions — audience recording',
    description:
      'Quarterly in-person edition of the boathouse improv sessions. Bring a chair; seating is on the dock. Set list is fully improvised and never repeated — this one will be pressed for Vol. 2.',
    place: 'Saimaa Boathouse Studio',
    location: 'Lappeenranta, Finland',
    eventUrl: null,
    startAt: '2026-08-22T17:00:00.000Z',
  },
  {
    ...mockBase,
    id: 'evt-mock-4',
    title: 'Loop Diary release cypher',
    description:
      'All six Kaiku Collective producers on one bill, each playing the beat they contributed to Loop Diary before joining a closing group freestyle. All ages until 22:00, 18+ after.',
    place: 'Vanha Kutomo',
    location: 'Turku, Finland',
    eventUrl: 'https://vanhakutomo.fi/kaiku-loop-diary',
    startAt: '2026-10-03T19:00:00.000Z',
  },
  {
    ...mockBase,
    id: 'evt-mock-5',
    title: 'All-night analog stream',
    description:
      'Monthly all-night synth broadcast for the arcade crowd — six hours, no laptops, tape-to-tape only. Streamed live on the channel with an in-person watch party at the venue bar.',
    place: 'Pelikonepelastus Arcade Bar',
    location: 'Tampere, Finland',
    eventUrl: null,
    startAt: '2026-08-29T20:00:00.000Z',
    status: 'CANCELLED',
  },
  {
    ...mockBase,
    id: 'evt-mock-6',
    title: 'Forest Cover — outdoor listening session',
    description:
      'An acoustic set recorded and played back the same evening, outdoors near the recording location. Weather-dependent; bring a blanket. Free entry, donations to the local trail fund.',
    place: 'Nuuksio National Park — Haukkalampi',
    location: 'Espoo, Finland',
    eventUrl: null,
    startAt: '2026-09-12T16:30:00.000Z',
  },
  {
    ...mockBase,
    id: 'evt-mock-7',
    title: 'Winter residency showcase',
    description:
      "End-of-residency showcase featuring three of this season's Northern Lights guest artists, closing with a joint ambient set built during the residency's final week.",
    place: 'Rovaniemi Cultural House Korundi',
    location: 'Rovaniemi, Finland',
    eventUrl: 'https://korundi.fi/tahti-residency-2026',
    startAt: '2026-11-14T19:00:00.000Z',
    status: 'DRAFT',
    publishedAt: null,
  },
];

export async function fetchMyEvents(): Promise<{
  data: ArtistEvent[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFixture('myEvents', [...mockEvents]),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ArtistEvent[]>('/api/me/events');
    return {
      data: Array.isArray(data) ? data.map(normalizeEvent) : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type CreateArtistEventInput = {
  title: string;
  description: string;
  place: string;
  location: string;
  eventUrl?: string;
  ticketUrl?: string;
  imageUrl?: string;
  startAt: string;
  endAt?: string | null;
  status?: 'DRAFT' | 'PUBLISHED';
  shareTo?: Array<'MASTODON' | 'BLUESKY'>;
};

export async function createEvent(
  input: CreateArtistEventInput,
): Promise<{ ok: true; data: ArtistEvent } | { ok: false; error: string }> {
  if (isForceMock()) {
    const status = input.status ?? 'PUBLISHED';
    const row: ArtistEvent = {
      id: `evt-mock-${Date.now()}`,
      title: input.title,
      description: input.description,
      place: input.place,
      location: input.location,
      eventUrl: input.eventUrl ?? null,
      ticketUrl: input.ticketUrl ?? null,
      imageUrl: input.imageUrl ?? null,
      startAt: input.startAt,
      endAt: input.endAt ?? null,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : null,
      participants: [],
    };
    mockEvents.push(row);
    mockEvents.sort((a, b) => a.startAt.localeCompare(b.startAt));
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<ArtistEvent>('/api/me/events', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { ok: true, data: normalizeEvent(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not add event',
    };
  }
}

/** `PATCH /api/me/events/:id`. An empty `eventUrl` or `description` clears it.
 * Unlike `createEvent`, followers are not notified again. */
export async function updateEvent(
  id: string,
  input: Partial<CreateArtistEventInput>,
): Promise<{ ok: true; data: ArtistEvent } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row = mockEvents.find((e) => e.id === id);
    if (!row) {
      return { ok: false, error: 'Event not found' };
    }
    Object.assign(row, {
      ...input,
      ...(input.eventUrl !== undefined
        ? { eventUrl: input.eventUrl || null }
        : {}),
      ...(input.ticketUrl !== undefined
        ? { ticketUrl: input.ticketUrl || null }
        : {}),
      ...(input.imageUrl !== undefined
        ? { imageUrl: input.imageUrl || null }
        : {}),
    });
    mockEvents.sort((a, b) => a.startAt.localeCompare(b.startAt));
    return { ok: true, data: { ...row } };
  }
  try {
    const { data } = await requestJson<ArtistEvent>(
      `/api/me/events/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return { ok: true, data: normalizeEvent(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save event',
    };
  }
}

export async function deleteEvent(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const idx = mockEvents.findIndex((e) => e.id === id);
    if (idx >= 0) {
      mockEvents.splice(idx, 1);
    }
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/events/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not delete event',
    };
  }
}

/** Upcoming events on an artist's channel (`GET /api/channels/:slug/events`). */
export async function fetchChannelEvents(slug: string): Promise<{
  data: ArtistEvent[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const now = new Date().toISOString();
    return {
      data: mockFixture(
        'channelEvents',
        mockEvents.filter((e) => e.startAt >= now && e.status !== 'DRAFT'),
        slug,
      ),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ArtistEvent[]>(
      `/api/channels/${encodeURIComponent(slug)}/events`,
    );
    return {
      data: Array.isArray(data) ? data.map(normalizeEvent) : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}
