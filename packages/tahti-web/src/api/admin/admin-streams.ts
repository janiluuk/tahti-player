import type { FetchMeta } from '../client';
import { getJson, mutate, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';
import type {
  ProgrammeItem,
  ProgrammeItemPatch,
  ProgrammeView,
} from '../studio-extras/schedule';

// ── Stream manager ──────────────────────────────────────────────────────────

export type AdminLiveStreamRow = {
  slug: string;
  artistName: string;
  username: string;
  thumbnailUrl?: string | null;
  avatarUrl?: string | null;
  elapsedSec: number;
  goneLiveAt: string | null;
  hlsUrl: string | null;
  isRotation: boolean;
};

function mockLiveStreams(): AdminLiveStreamRow[] {
  return [
    {
      slug: 'northern-lights',
      artistName: 'Northern Lights',
      username: 'northern-lights',
      elapsedSec: 5400,
      goneLiveAt: '2026-08-16T20:00:00.000Z',
      hlsUrl: 'https://stream.tahti.live/northern-lights/stream.m3u8',
      isRotation: false,
    },
    {
      slug: 'dj-moonlight',
      artistName: 'DJ Moonlight',
      username: 'dj-moonlight',
      elapsedSec: 1860,
      goneLiveAt: '2026-08-17T00:39:00.000Z',
      hlsUrl: 'https://stream.tahti.live/dj-moonlight/stream.m3u8',
      isRotation: false,
    },
  ];
}

export async function fetchAdminStreams(): Promise<{
  data: AdminLiveStreamRow[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockLiveStreams(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ streams: AdminLiveStreamRow[] }>(
      '/api/admin/streams',
    );
    return { data: data.streams, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function restartStream(slug: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/streams/${encodeURIComponent(slug)}/restart`,
    'POST',
  );
}

export function skipStreamTrack(slug: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(`/api/admin/streams/${encodeURIComponent(slug)}/skip`, 'POST');
}

export function pauseStream(slug: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(`/api/admin/streams/${encodeURIComponent(slug)}/pause`, 'POST');
}

export function resumeStream(slug: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/streams/${encodeURIComponent(slug)}/resume`,
    'POST',
  );
}

export function forceStreamOffline(slug: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/streams/${encodeURIComponent(slug)}/force-offline`,
    'POST',
  );
}

export type AdminProgrammeSettings = Pick<
  ProgrammeView,
  | 'fallbackMode'
  | 'fallbackEnabled'
  | 'fallbackAutoEnroll'
  | 'announcementsEnabled'
>;

export function programmePatchFromItems(
  items: ProgrammeItem[],
): ProgrammeItemPatch[] {
  let order = 0;
  return items.map((item) =>
    item.isFallback
      ? { soundId: item.id, isFallback: true, fallbackOrder: order++ }
      : { soundId: item.id, isFallback: false },
  );
}

const mockChannelProgrammes = new Map<string, ProgrammeView>();

export async function fetchAdminChannelProgramme(
  slug: string,
): Promise<{ ok: true; data: ProgrammeView } | { ok: false; error: string }> {
  const key = slug.trim().toLowerCase();
  if (!key) {
    return { ok: false, error: 'Enter a channel slug.' };
  }
  if (isForceMock()) {
    const existing = mockChannelProgrammes.get(key) ?? {
      fallbackMode: 'ordered',
      fallbackEnabled: true,
      fallbackAutoEnroll: false,
      announcementsEnabled: true,
      items: [
        {
          id: `${key}-1`,
          title: 'Aamu',
          status: 'READY',
          durationSec: 240,
          isFallback: true,
          fallbackOrder: 0,
        },
        {
          id: `${key}-2`,
          title: 'Ilta',
          status: 'READY',
          durationSec: 300,
          isFallback: true,
          fallbackOrder: 1,
        },
        {
          id: `${key}-3`,
          title: 'Yö',
          status: 'READY',
          durationSec: 360,
          isFallback: false,
          fallbackOrder: null,
        },
      ],
    };
    mockChannelProgrammes.set(key, existing);
    return { ok: true, data: { ...existing, items: [...existing.items] } };
  }
  try {
    const data = await getJson<ProgrammeView>(
      `/api/admin/channels/${encodeURIComponent(key)}/programme`,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load the rotation',
    };
  }
}

export async function saveAdminChannelProgramme(
  slug: string,
  settings: AdminProgrammeSettings,
  items: ProgrammeItem[],
): Promise<{ ok: true; data: ProgrammeView } | { ok: false; error: string }> {
  const key = slug.trim().toLowerCase();
  const patch = { ...settings, items: programmePatchFromItems(items) };
  if (isForceMock()) {
    const saved: ProgrammeView = {
      ...settings,
      items: items.map((item, index) => ({
        ...item,
        fallbackOrder: item.isFallback ? index : null,
      })),
    };
    mockChannelProgrammes.set(key, saved);
    return { ok: true, data: saved };
  }
  try {
    const data = await sendJson<ProgrammeView>(
      `/api/admin/channels/${encodeURIComponent(key)}/programme`,
      'PATCH',
      patch,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save the rotation',
    };
  }
}
