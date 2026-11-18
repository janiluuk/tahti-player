import { i18n } from '@tahti-player/i18n';

import type { FetchMeta } from './client';
import { mockVenues } from './mock';
import { mockFixture } from './mock-overrides';
import { failMeta, isForceMock } from './mode';
import { requestJson } from './request-json';

export type ArtistEventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
export type ArtistEventRole = 'PERFORMER' | 'HOST' | 'GUEST';
export type ArtistEventParticipantStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type ArtistEventVisibility = 'PUBLIC' | 'FANS';

export type ArtistEventVenue = {
  id: string;
  slug: string;
  name: string;
  city: string;
};

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
  timezone: string | null;
  venue: ArtistEventVenue | null;
  visibility: ArtistEventVisibility;
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
    timezone: raw.timezone ?? null,
    venue: raw.venue ?? null,
    visibility: raw.visibility === 'FANS' ? 'FANS' : 'PUBLIC',
    status: raw.status ?? 'PUBLISHED',
    publishedAt: raw.publishedAt ?? null,
    participants: Array.isArray(raw.participants) ? raw.participants : [],
  };
}

const mockBase = {
  ticketUrl: null,
  imageUrl: null,
  endAt: null,
  timezone: null,
  venue: null,
  visibility: 'PUBLIC' as ArtistEventVisibility,
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
    timezone: 'Europe/Helsinki',
    venue: {
      id: 'venue-1',
      slug: 'kuudes-linja',
      name: 'Kuudes Linja',
      city: 'Helsinki',
    },
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
    visibility: 'FANS',
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
      data: mockFixture('myEvents', [...mockEvents]).map(normalizeEvent),
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
  timezone?: string | null;
  venueId?: string | null;
  visibility?: ArtistEventVisibility;
  status?: 'DRAFT' | 'PUBLISHED';
  shareTo?: Array<'MASTODON' | 'BLUESKY'>;
};

function mockEventVenue(
  venueId: string | null | undefined,
): ArtistEventVenue | null {
  const venue = venueId ? mockVenues().find((v) => v.id === venueId) : null;
  return venue
    ? {
        id: venue.id,
        slug: venue.slug,
        name: venue.name,
        city: venue.city ?? '',
      }
    : null;
}

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
      timezone: input.timezone ?? null,
      venue: mockEventVenue(input.venueId),
      visibility: input.visibility ?? 'PUBLIC',
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
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotAddEvent'),
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
      return { ok: false, error: i18n.t('web:batch53.eventNotFound') };
    }
    const { venueId, ...fields } = input;
    Object.assign(row, {
      ...fields,
      ...(venueId !== undefined ? { venue: mockEventVenue(venueId) } : {}),
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
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotSaveEvent'),
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
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotDeleteEvent'),
    };
  }
}

export type ChannelEventsScope = 'upcoming' | 'past';

/** Channel calendar events (`GET /api/channels/:slug/events?scope=`). */
export async function fetchChannelEvents(
  slug: string,
  opts?: { scope?: ChannelEventsScope; limit?: number },
): Promise<{
  data: ArtistEvent[];
  meta: FetchMeta;
}> {
  const scope = opts?.scope ?? 'upcoming';
  const limit = opts?.limit;
  if (isForceMock()) {
    const now = new Date().toISOString();
    const base = mockEvents.filter((e) => e.status !== 'DRAFT');
    const fromFixture = mockFixture('channelEvents', base, slug).map(
      normalizeEvent,
    );
    const filtered = fromFixture.filter((e) =>
      scope === 'upcoming' ? e.startAt >= now : e.startAt < now,
    );
    const ordered =
      scope === 'upcoming'
        ? [...filtered].sort((a, b) => a.startAt.localeCompare(b.startAt))
        : [...filtered].sort((a, b) => b.startAt.localeCompare(a.startAt));
    const data =
      limit != null
        ? ordered.slice(0, Math.max(1, Math.min(50, limit)))
        : ordered;
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const params = new URLSearchParams({ scope });
    if (limit != null) {
      params.set('limit', String(limit));
    }
    const { data } = await requestJson<ArtistEvent[]>(
      `/api/channels/${encodeURIComponent(slug)}/events?${params}`,
    );
    return {
      data: Array.isArray(data) ? data.map(normalizeEvent) : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}
