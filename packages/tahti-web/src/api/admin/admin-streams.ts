import type { FetchMeta } from '../client';
import { getJson, mutate } from '../http';
import { failMeta, isForceMock } from '../mode';

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
