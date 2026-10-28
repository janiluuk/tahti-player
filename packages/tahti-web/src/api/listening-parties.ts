/**
 * Listening parties: a release played once, start to finish, at a scheduled
 * time, with the host channel's chat and the artist's purchase tiers.
 * Contract: `GET /api/v1/listening-parties/:id` and friends (tahti-org).
 */

import type { FetchMeta } from './client';
import { apiBase } from './http';
import {
  cancelMockListeningParty,
  createMockListeningParty,
  listMockChannelListeningParties,
  listMockMyListeningParties,
  mockListeningParty,
  mockListeningPartyStreamUrl,
  updateMockListeningParty,
} from './listening-parties-mock';
import { mockFixture } from './mock-overrides';
import { apiErrorMeta, isForceMock } from './mode';
import { requestJson, RequestJsonError } from './request-json';

export type ListeningPartyState = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELED';

export type ListeningPartyCredit = {
  role: string;
  name: string;
  artistUsername?: string | null;
};

export type ListeningPartyTrack = {
  id: string;
  position: number;
  title: string;
  durationSec: number;
  credits: ListeningPartyCredit[];
};

export type ListeningPartyNowPlaying = {
  trackId: string;
  position: number;
  offsetSec: number;
};

export type ListeningPartyPurchaseTier = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  priceOptional: boolean;
  currency: string;
};

export type ListeningPartyDto = {
  id: string;
  state: ListeningPartyState;
  startAt: string;
  endAt: string;
  /** The server's clock when the response was built; the page ticks the
   * timeline from it so every listener agrees on "now". */
  serverNow: string;
  hostNote: string | null;
  channel: { slug: string; name: string; avatarUrl: string | null };
  host: { username: string; displayName: string; avatarUrl: string | null };
  release: {
    id: string;
    title: string;
    type: string;
    artworkUrl: string | null;
    /** Null until the release is PUBLISHED. */
    smartLinkSlug: string | null;
    releaseDate: string | null;
    isPreRelease: boolean;
    description: string | null;
    /** Liner notes (Markdown). */
    commentary: string | null;
    credits: ListeningPartyCredit[];
    pLine: string | null;
    cLine: string | null;
    labelImprint: string | null;
  };
  tracks: ListeningPartyTrack[];
  nowPlaying: ListeningPartyNowPlaying | null;
  /** Empty while the host's store is off or cannot take payments. */
  purchaseTiers: ListeningPartyPurchaseTier[];
};

export type ListeningPartySummaryDto = {
  id: string;
  state: ListeningPartyState;
  startAt: string;
  endAt: string;
  release: { id: string; title: string; artworkUrl: string | null };
  channel: { slug: string; name: string };
};

export type CreateListeningPartyBody = {
  releaseId: string;
  startAt: string;
  /** Markdown, up to 2000 characters. Blank stores none. */
  hostNote?: string | null;
};

/** Omitted fields stay as they are; a blank or null `hostNote` clears it. */
export type UpdateListeningPartyBody = {
  startAt?: string;
  hostNote?: string | null;
};

export const LISTENING_PARTY_HOST_NOTE_MAX = 2000;

export type ListeningPartyMutationResult =
  | { ok: true; data: ListeningPartyDto }
  | { ok: false; error: string; status?: number };

const mockMeta: FetchMeta = { source: 'mock', reason: 'VITE_FORCE_MOCK' };

function mutationError(
  err: unknown,
  fallback: string,
): { ok: false; error: string; status?: number } {
  return {
    ok: false,
    error: err instanceof Error ? err.message : fallback,
    ...(err instanceof RequestJsonError ? { status: err.status } : {}),
  };
}

/** `GET /api/v1/listening-parties/:id`. `data` is null for a 404 or a
 * failed load; `meta.reason` tells the two apart (`notFound`). */
export async function fetchListeningParty(id: string): Promise<{
  data: ListeningPartyDto | null;
  meta: FetchMeta;
  notFound: boolean;
}> {
  if (isForceMock()) {
    const data = mockFixture('listeningParty', mockListeningParty(id), id);
    return { data, meta: mockMeta, notFound: data === null };
  }
  try {
    const { data } = await requestJson<ListeningPartyDto>(
      `/api/v1/listening-parties/${encodeURIComponent(id)}`,
    );
    return { data, meta: { source: 'api' }, notFound: false };
  } catch (err) {
    return {
      data: null,
      meta: apiErrorMeta(err),
      notFound: err instanceof RequestJsonError && err.status === 404,
    };
  }
}

/** Where the player loads a party track. The API answers with a 302 to a
 * signed URL that lives about as long as the track, and only while the
 * track is playable in the party (403 otherwise), so the URL is built
 * fresh for each track as it starts. */
export function listeningPartyTrackStreamUrl(
  partyId: string,
  trackId: string,
): string {
  if (isForceMock()) {
    return mockListeningPartyStreamUrl(trackId);
  }
  return `${apiBase()}/api/v1/listening-parties/${encodeURIComponent(partyId)}/tracks/${encodeURIComponent(trackId)}/stream`;
}

/** Upcoming and live parties on a channel, soonest first. */
export async function fetchChannelListeningParties(slug: string): Promise<{
  data: ListeningPartySummaryDto[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFixture(
        'channelListeningParties',
        listMockChannelListeningParties(slug),
        slug,
      ),
      meta: mockMeta,
    };
  }
  try {
    const { data } = await requestJson<{ items: ListeningPartySummaryDto[] }>(
      `/api/channels/${encodeURIComponent(slug)}/listening-parties`,
    );
    return {
      data: Array.isArray(data.items) ? data.items : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

/** The signed-in artist's parties in every state, newest start first. */
export async function fetchMyListeningParties(): Promise<{
  data: ListeningPartySummaryDto[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFixture('myListeningParties', listMockMyListeningParties()),
      meta: mockMeta,
    };
  }
  try {
    const { data } = await requestJson<{ items: ListeningPartySummaryDto[] }>(
      '/api/me/listening-parties',
    );
    return {
      data: Array.isArray(data.items) ? data.items : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function createListeningParty(
  body: CreateListeningPartyBody,
): Promise<ListeningPartyMutationResult> {
  if (isForceMock()) {
    return createMockListeningParty(body);
  }
  try {
    const { data } = await requestJson<ListeningPartyDto>(
      '/api/me/listening-parties',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return { ok: true, data };
  } catch (err) {
    return mutationError(err, 'Could not schedule the listening party');
  }
}

/** Reschedule or edit the host note; the API refuses once the party is
 * live, ended or canceled (409). */
export async function updateListeningParty(
  id: string,
  body: UpdateListeningPartyBody,
): Promise<ListeningPartyMutationResult> {
  if (isForceMock()) {
    return updateMockListeningParty(id, body);
  }
  try {
    const { data } = await requestJson<ListeningPartyDto>(
      `/api/me/listening-parties/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
    return { ok: true, data };
  } catch (err) {
    return mutationError(err, 'Could not save the listening party');
  }
}

export async function cancelListeningParty(
  id: string,
): Promise<ListeningPartyMutationResult> {
  if (isForceMock()) {
    return cancelMockListeningParty(id);
  }
  try {
    const { data } = await requestJson<ListeningPartyDto>(
      `/api/me/listening-parties/${encodeURIComponent(id)}/cancel`,
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (err) {
    return mutationError(err, 'Could not cancel the listening party');
  }
}
