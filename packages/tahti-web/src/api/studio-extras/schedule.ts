import type { FetchMeta } from '.././client';
import { failMeta, isForceMock } from '.././mode';
import { requestJson } from '.././request-json';

export type ChannelSchedule = {
  nextBroadcastAt: string | null;
  nextBroadcastNote: string | null;
  nextBroadcastShowType?: 'LIVE_SET' | 'TALK' | null;
  nextBroadcastShowId?: string | null;
  nextBroadcastMode?: 'SINGLE' | 'SERIES' | null;
  nextBroadcastDescription?: string | null;
  nextBroadcastCoverUrl?: string | null;
  nextBroadcastDurationHours?: 1 | 2 | null;
};

export type UpcomingBroadcast = {
  id: string;
  startAt: string;
  title: string;
  episodeNumber: number | null;
  showType: 'LIVE_SET' | 'TALK';
  visibility: 'PUBLIC' | 'FAN_ONLY';
  venue: string | null;
  location: string | null;
};

export type ProgrammeItem = {
  id: string;
  title: string;
  status: string;
  contentType?: string | null;
  durationSec: number | null;
  isFallback: boolean;
  fallbackOrder: number | null;
  /** Set for EMBED_ONLY items (hearthis.at, Mixcloud, Spotify, Bandcamp) —
   * Tahti holds no audio file for these, only a provider widget, so they
   * cannot play unattended in a 24/7 rotation and should never be offered
   * as rotation candidates. */
  embedProvider?: 'HEARTHIS' | 'MIXCLOUD' | 'SPOTIFY' | 'BANDCAMP' | null;
};

export type ProgrammeView = {
  fallbackMode: 'shuffle' | 'ordered';
  fallbackEnabled: boolean;
  fallbackAutoEnroll: boolean;
  announcementsEnabled: boolean;
  items: ProgrammeItem[];
};

export let mockSchedule: ChannelSchedule = {
  nextBroadcastAt: new Date(Date.now() + 3 * 24 * 3600_000).toISOString(),
  nextBroadcastNote: 'Mock Friday set',
  nextBroadcastShowType: 'LIVE_SET',
  nextBroadcastMode: 'SERIES',
  nextBroadcastDescription: 'A two-hour northern lights session.',
  nextBroadcastCoverUrl: null,
  nextBroadcastDurationHours: 2,
};

export let mockProgramme: ProgrammeView = {
  fallbackMode: 'shuffle',
  fallbackEnabled: true,
  fallbackAutoEnroll: true,
  announcementsEnabled: true,
  items: [
    {
      id: 'arch-mock-1',
      title: 'Northern Lights — Live Set',
      status: 'READY',
      durationSec: 3720,
      isFallback: true,
      fallbackOrder: 0,
    },
  ],
};

export async function fetchChannelSchedule(): Promise<{
  data: ChannelSchedule;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockSchedule },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ChannelSchedule>(
      '/api/me/channel/schedule',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { nextBroadcastAt: null, nextBroadcastNote: null },
      meta: failMeta(err),
    };
  }
}

export async function patchChannelSchedule(
  patch: Partial<ChannelSchedule>,
): Promise<{ ok: true; data: ChannelSchedule } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockSchedule = { ...mockSchedule, ...patch };
    return { ok: true, data: { ...mockSchedule } };
  }
  try {
    const { data } = await requestJson<ChannelSchedule>(
      '/api/me/channel/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function fetchUpcomingBroadcasts(): Promise<{
  data: UpcomingBroadcast[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const first = mockSchedule.nextBroadcastAt;
    return {
      data: first
        ? [
            {
              id: 'scheduled-mock-1',
              startAt: first,
              title: mockSchedule.nextBroadcastNote ?? 'Next live session',
              episodeNumber: 4,
              showType: 'LIVE_SET',
              visibility: 'PUBLIC',
              venue: null,
              location: 'Helsinki',
            },
            {
              id: 'scheduled-mock-2',
              startAt: new Date(
                new Date(first).getTime() + 7 * 24 * 3600_000,
              ).toISOString(),
              title: 'Northern Signals #5',
              episodeNumber: 5,
              showType: 'LIVE_SET',
              visibility: 'PUBLIC',
              venue: null,
              location: null,
            },
          ]
        : [],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      scheduledShows?: UpcomingBroadcast[];
    }>('/api/me/channel/show-series');
    return {
      data: [...(data.scheduledShows ?? [])].sort(
        (left, right) =>
          new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
      ),
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchProgramme(): Promise<{
  data: ProgrammeView;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockProgramme, items: [...mockProgramme.items] },
      meta: { source: 'mock' },
    };
  }
  try {
    const { data } = await requestJson<ProgrammeView>(
      '/api/me/channel/programme',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: {
        fallbackMode: 'shuffle',
        fallbackEnabled: false,
        fallbackAutoEnroll: false,
        announcementsEnabled: false,
        items: [],
      },
      meta: failMeta(err),
    };
  }
}

export type ProgrammeItemPatch = {
  soundId: string;
  isFallback: boolean;
  fallbackOrder?: number;
};

export async function patchProgramme(
  patch: Partial<
    Pick<
      ProgrammeView,
      | 'fallbackMode'
      | 'fallbackEnabled'
      | 'fallbackAutoEnroll'
      | 'announcementsEnabled'
    >
  > & { items?: ProgrammeItemPatch[] },
): Promise<{ ok: true; data: ProgrammeView } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockProgramme = {
      ...mockProgramme,
      ...patch,
      items: patch.items
        ? patch.items.map((i, idx) => ({
            id: i.soundId,
            title: `Rotation ${idx + 1}`,
            status: 'READY',
            durationSec: null,
            isFallback: i.isFallback,
            fallbackOrder: i.fallbackOrder ?? idx,
          }))
        : mockProgramme.items,
    };
    return {
      ok: true,
      data: { ...mockProgramme, items: [...mockProgramme.items] },
    };
  }
  try {
    const { data } = await requestJson<ProgrammeView>(
      '/api/me/channel/programme',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

/** Apply a playlist's archive tracks as the channel 24/7 rotation. */
export async function applyPlaylistToProgramme(
  soundIds: string[],
  opts?: {
    enable?: boolean;
    mode?: 'shuffle' | 'ordered';
    autoEnroll?: boolean;
    announcementsEnabled?: boolean;
  },
): Promise<{ ok: true; data: ProgrammeView } | { ok: false; error: string }> {
  const ids = soundIds.filter(Boolean);
  if (ids.length === 0) {
    return { ok: false, error: 'Playlist has no archive tracks to rotate' };
  }
  return patchProgramme({
    fallbackEnabled: opts?.enable ?? true,
    fallbackMode: opts?.mode ?? 'ordered',
    ...(opts?.autoEnroll !== undefined
      ? { fallbackAutoEnroll: opts.autoEnroll }
      : {}),
    ...(opts?.announcementsEnabled !== undefined
      ? { announcementsEnabled: opts.announcementsEnabled }
      : {}),
    items: ids.map((soundId, fallbackOrder) => ({
      soundId,
      isFallback: true,
      fallbackOrder,
    })),
  });
}

// ── Stats ───────────────────────────────────────────────────────────────────
