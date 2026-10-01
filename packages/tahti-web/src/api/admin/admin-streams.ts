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
    `/api/admin/channels/${encodeURIComponent(slug)}/restart`,
    'POST',
  );
}

export function skipStreamTrack(slug: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(`/api/admin/channels/${encodeURIComponent(slug)}/skip`, 'POST');
}

export function pauseStream(slug: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/channels/${encodeURIComponent(slug)}/pause`,
    'POST',
  );
}

export function resumeStream(slug: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/channels/${encodeURIComponent(slug)}/resume`,
    'POST',
  );
}

export function forceStreamOffline(slug: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/channels/${encodeURIComponent(slug)}/force-offline`,
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
      library: [
        {
          releaseTrackId: `${key}-rt-1`,
          releaseId: `${key}-release`,
          releaseTitle: 'Revontulet',
          trackTitle: 'Pohjoinen',
          durationSec: 280,
          soundId: null,
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
      library: mockChannelProgrammes.get(key)?.library,
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

/** Board: add one of the channel owner's release tracks to its rotation. */
export async function addAdminReleaseTrackToRotation(
  slug: string,
  releaseTrackId: string,
): Promise<{ ok: true; data: ProgrammeView } | { ok: false; error: string }> {
  const key = slug.trim().toLowerCase();
  if (isForceMock()) {
    const existing = mockChannelProgrammes.get(key);
    if (!existing) {
      return { ok: false, error: 'Open the rotation first.' };
    }
    const track = existing.library?.find(
      (row) => row.releaseTrackId === releaseTrackId,
    );
    const soundId = `${key}-release-${releaseTrackId}`;
    const saved: ProgrammeView = {
      ...existing,
      items: [
        ...existing.items,
        {
          id: soundId,
          title: track?.trackTitle ?? 'Release track',
          status: 'READY',
          durationSec: track?.durationSec ?? null,
          isFallback: true,
          fallbackOrder: existing.items.length,
        },
      ],
      library: existing.library?.map((row) =>
        row.releaseTrackId === releaseTrackId ? { ...row, soundId } : row,
      ),
    };
    mockChannelProgrammes.set(key, saved);
    return { ok: true, data: saved };
  }
  try {
    const data = await sendJson<ProgrammeView>(
      `/api/admin/channels/${encodeURIComponent(key)}/programme/library`,
      'POST',
      { releaseTrackId },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not add to the rotation',
    };
  }
}

export type AdminChannelSound = {
  id: string;
  title: string;
  artistName: string | null;
  description: string | null;
  genre: string | null;
  isPublic: boolean;
  releasedAt: string | null;
};

export type AdminChannelSoundPatch = {
  title?: string;
  artistName?: string | null;
  description?: string;
  genre?: string | null;
  isPublic?: boolean;
};

const mockChannelSounds = new Map<string, AdminChannelSound[]>();

function mockSoundsFor(key: string): AdminChannelSound[] {
  let rows = mockChannelSounds.get(key);
  if (!rows) {
    rows = [
      {
        id: `${key}-sound-1`,
        title: 'Aamu',
        artistName: null,
        description: 'Morning set',
        genre: 'Ambient',
        isPublic: true,
        releasedAt: '2026-09-01T00:00:00.000Z',
      },
      {
        id: `${key}-sound-2`,
        title: 'Ilta',
        artistName: null,
        description: null,
        genre: null,
        isPublic: false,
        releasedAt: '2026-09-10T00:00:00.000Z',
      },
    ];
    mockChannelSounds.set(key, rows);
  }
  return rows;
}

export async function fetchAdminChannelSounds(
  slug: string,
): Promise<
  { ok: true; data: AdminChannelSound[] } | { ok: false; error: string }
> {
  const key = slug.trim().toLowerCase();
  if (!key) {
    return { ok: false, error: 'Enter a channel slug.' };
  }
  if (isForceMock()) {
    return { ok: true, data: mockSoundsFor(key).map((row) => ({ ...row })) };
  }
  try {
    const data = await getJson<AdminChannelSound[]>(
      `/api/admin/channels/${encodeURIComponent(key)}/sound`,
    );
    return { ok: true, data: Array.isArray(data) ? data : [] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load the tracks',
    };
  }
}

export async function patchAdminChannelSound(
  slug: string,
  soundId: string,
  patch: AdminChannelSoundPatch,
): Promise<
  { ok: true; data: AdminChannelSound } | { ok: false; error: string }
> {
  const key = slug.trim().toLowerCase();
  if (isForceMock()) {
    const rows = mockSoundsFor(key);
    const index = rows.findIndex((row) => row.id === soundId);
    if (index < 0) {
      return { ok: false, error: 'Sound item not found' };
    }
    const updated: AdminChannelSound = {
      ...rows[index]!,
      ...patch,
      description:
        patch.description !== undefined
          ? patch.description || null
          : rows[index]!.description,
    };
    rows[index] = updated;
    return { ok: true, data: { ...updated } };
  }
  try {
    const data = await sendJson<AdminChannelSound>(
      `/api/admin/channels/${encodeURIComponent(key)}/sound/${encodeURIComponent(soundId)}`,
      'PATCH',
      patch,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save the track',
    };
  }
}
