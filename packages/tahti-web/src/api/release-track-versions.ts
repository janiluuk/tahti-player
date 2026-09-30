import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';
import { requestJson } from './request-json';

export type ReleaseTrackVersion = {
  id: string;
  versionNumber: number;
  versionLabel: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR' | string;
  isActive: boolean;
  durationSec: number | null;
  createdAt: string;
};

const base = (releaseId: string, trackId: string) =>
  `/api/me/releases/${encodeURIComponent(releaseId)}/tracks/${encodeURIComponent(trackId)}/versions`;

const mockVersions = new Map<string, ReleaseTrackVersion[]>();

function mockFor(trackId: string): ReleaseTrackVersion[] {
  const existing = mockVersions.get(trackId);
  if (existing) {
    return existing;
  }
  const initial: ReleaseTrackVersion[] = [
    {
      id: `${trackId}-v1`,
      versionNumber: 1,
      versionLabel: 'Original',
      status: 'READY',
      isActive: true,
      durationSec: 214,
      createdAt: '2026-09-01T12:00:00.000Z',
    },
  ];
  mockVersions.set(trackId, initial);
  return initial;
}

/** Every audio version of a release track; the API creates version 1 from
 * the track's current file the first time this is asked. */
export async function fetchReleaseTrackVersions(
  releaseId: string,
  trackId: string,
): Promise<{ data: ReleaseTrackVersion[] | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockFor(trackId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ReleaseTrackVersion[]>(base(releaseId, trackId));
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

/** Make a ready version the one the release plays and distributes. */
export async function activateReleaseTrackVersion(
  releaseId: string,
  trackId: string,
  versionId: string,
): Promise<
  { ok: true; data: ReleaseTrackVersion[] } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const next = mockFor(trackId).map((version) => ({
      ...version,
      isActive: version.id === versionId,
    }));
    mockVersions.set(trackId, next);
    return { ok: true, data: next };
  }
  try {
    const { data } = await requestJson<ReleaseTrackVersion[]>(
      `${base(releaseId, trackId)}/${encodeURIComponent(versionId)}/activate`,
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not switch versions',
    };
  }
}
