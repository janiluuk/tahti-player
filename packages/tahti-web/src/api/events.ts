import type { FetchMeta } from './client';
import { isForceMock } from './mode';

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

function failMeta(err: unknown): FetchMeta {
  return {
    source: 'mock',
    reason: err instanceof Error ? err.message : 'fetch failed',
  };
}

export type ArtistEvent = {
  id: string;
  title: string;
  description: string;
  place: string;
  location: string;
  eventUrl: string | null;
  startAt: string;
};

const mockEvents: ArtistEvent[] = [
  {
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
    id: 'evt-mock-2',
    title: 'Late-night broadcast + open studio',
    description:
      'A rare in-person edition of the Thursday show — recorded live in front of an audience, includes a Q&A on the tape-warp bass chain between sets. BYO headphones for the silent-disco closer.',
    place: 'Kuudes Linja',
    location: 'Helsinki, Finland',
    eventUrl: 'https://kuudeslinja.fi/events/midnight-cartography',
    startAt: '2026-09-19T21:00:00.000Z',
  },
  {
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
    id: 'evt-mock-5',
    title: 'All-night analog stream',
    description:
      'Monthly all-night synth broadcast for the arcade crowd — six hours, no laptops, tape-to-tape only. Streamed live on the channel with an in-person watch party at the venue bar.',
    place: 'Pelikonepelastus Arcade Bar',
    location: 'Tampere, Finland',
    eventUrl: null,
    startAt: '2026-08-29T20:00:00.000Z',
  },
  {
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
    id: 'evt-mock-7',
    title: 'Winter residency showcase',
    description:
      "End-of-residency showcase featuring three of this season's Northern Lights guest artists, closing with a joint ambient set built during the residency's final week.",
    place: 'Rovaniemi Cultural House Korundi',
    location: 'Rovaniemi, Finland',
    eventUrl: 'https://korundi.fi/tahti-residency-2026',
    startAt: '2026-11-14T19:00:00.000Z',
  },
];

export async function fetchMyEvents(): Promise<{
  data: ArtistEvent[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...mockEvents],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ArtistEvent[]>('/api/me/events');
    return { data, meta: { source: 'api' } };
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
  startAt: string;
};

export async function createEvent(
  input: CreateArtistEventInput,
): Promise<{ ok: true; data: ArtistEvent } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row: ArtistEvent = {
      id: `evt-mock-${Date.now()}`,
      title: input.title,
      description: input.description,
      place: input.place,
      location: input.location,
      eventUrl: input.eventUrl ?? null,
      startAt: input.startAt,
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
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not add event',
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
