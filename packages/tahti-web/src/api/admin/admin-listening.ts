import type { FetchMeta } from '../client';
import { getJson } from '../http';
import { apiErrorMeta, isForceMock } from '../mode';

export type AdminListeningRange = '7' | '30' | 'all';

/** GET /api/admin/stats/listening (tahti-org `AdminListeningResponseSchema`):
 * platform listening from listen sessions, bots left out. */
export type AdminListening = {
  range: AdminListeningRange;
  listens: number;
  minutes: number;
  signedInListeners: number;
  surfaces: { name: string; count: number; share: number }[];
  topChannels: {
    slug: string;
    name: string;
    minutes: number;
    listens: number;
  }[];
};

/** Where on Tahti a listen happened (`ListenSource`). */
export const LISTEN_SURFACE_LABELS: Record<string, string> = {
  CHANNEL_PAGE: 'Channel pages',
  TAHTI_RADIO: 'Tahti Radio',
  ARTIST_PROFILE: 'Artist profiles',
  DISCOVER: 'Discover',
  LIBRARY: 'Library',
  EMBED: 'Embeds',
  OTHER: 'Other',
};

function mockListening(range: AdminListeningRange): AdminListening {
  return {
    range,
    listens: 1840,
    minutes: 52_310,
    signedInListeners: 312,
    surfaces: [
      { name: 'CHANNEL_PAGE', count: 920, share: 0.5 },
      { name: 'TAHTI_RADIO', count: 552, share: 0.3 },
      { name: 'DISCOVER', count: 184, share: 0.1 },
      { name: 'Other', count: 184, share: 0.1 },
    ],
    topChannels: [
      {
        slug: 'northern-lights',
        name: 'Northern Lights',
        minutes: 9_120,
        listens: 301,
      },
      {
        slug: 'aurora-drift',
        name: 'Aurora Drift',
        minutes: 6_480,
        listens: 220,
      },
    ],
  };
}

function emptyListening(range: AdminListeningRange): AdminListening {
  return {
    range,
    listens: 0,
    minutes: 0,
    signedInListeners: 0,
    surfaces: [],
    topChannels: [],
  };
}

export async function fetchAdminListening(
  range: AdminListeningRange,
): Promise<{ data: AdminListening; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockListening(range),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminListening>(
      `/api/admin/stats/listening?range=${range}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: emptyListening(range), meta: apiErrorMeta(err) };
  }
}
