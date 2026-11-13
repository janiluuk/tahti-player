import { i18n } from '@tahti-player/i18n';

import type { FetchMeta } from './client';
import { getJson } from './http';
import { DEMO_MP3 } from './mock';
import { failMeta, isForceMock } from './mode';
import { requestJson } from './request-json';

export const RELEASE_TRACK_STEM_ROLES = [
  'vocals',
  'drums',
  'bass',
  'other',
] as const;

export type ReleaseTrackStemRole = (typeof RELEASE_TRACK_STEM_ROLES)[number];

export const RELEASE_TRACK_STEM_ROLE_LABELS: Record<
  ReleaseTrackStemRole,
  string
> = {
  vocals: 'Vocals',
  drums: 'Drums',
  bass: 'Bass',
  other: 'Other',
};

export type ReleaseTrackStem = {
  id: string;
  role: ReleaseTrackStemRole;
  status: string;
  durationSec: number | null;
  audioUrl: string | null;
  playUrl?: string | null;
  createdAt: string;
};

export type PublicReleaseTrackStem = {
  id: string;
  role: ReleaseTrackStemRole | string;
  durationSec?: number | null;
  audioUrl?: string | null;
  playUrl?: string | null;
};

const base = (releaseId: string, trackId: string) =>
  `/api/me/releases/${encodeURIComponent(releaseId)}/tracks/${encodeURIComponent(trackId)}/stems`;

const mockStems = new Map<string, ReleaseTrackStem[]>();

function mockKey(releaseId: string, trackId: string): string {
  return `${releaseId}:${trackId}`;
}

export function mockReleaseTrackStems(
  releaseId: string,
  trackId: string,
): ReleaseTrackStem[] {
  return mockStems.get(mockKey(releaseId, trackId)) ?? [];
}

export function resetMockReleaseTrackStems(): void {
  mockStems.clear();
}

export function seedMockReleaseTrackStem(
  releaseId: string,
  trackId: string,
  stem: ReleaseTrackStem,
): void {
  const current = mockReleaseTrackStems(releaseId, trackId).filter(
    (row) => row.role !== stem.role,
  );
  mockStems.set(mockKey(releaseId, trackId), [...current, stem]);
}

export const RELEASE_TRACK_STEM_TYPES = [
  'audio/wav',
  'audio/flac',
  'audio/mpeg',
  'audio/aac',
  'audio/x-aiff',
];

export async function fetchReleaseTrackStems(
  releaseId: string,
  trackId: string,
): Promise<{ data: ReleaseTrackStem[] | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockReleaseTrackStems(releaseId, trackId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ReleaseTrackStem[]>(base(releaseId, trackId));
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function uploadReleaseTrackStem(
  releaseId: string,
  trackId: string,
  role: ReleaseTrackStemRole,
  file: File,
): Promise<
  { ok: true; data: ReleaseTrackStem } | { ok: false; error: string }
> {
  const contentType = file.type || 'audio/mpeg';
  if (!RELEASE_TRACK_STEM_TYPES.includes(contentType)) {
    return { ok: false, error: i18n.t('web:batch53.useAudioFormats') };
  }
  if (isForceMock()) {
    const key = mockKey(releaseId, trackId);
    const current = mockReleaseTrackStems(releaseId, trackId).filter(
      (stem) => stem.role !== role,
    );
    const created: ReleaseTrackStem = {
      id: `${trackId}-stem-${role}`,
      role,
      status: 'READY',
      durationSec: null,
      audioUrl: DEMO_MP3,
      playUrl: DEMO_MP3,
      createdAt: new Date().toISOString(),
    };
    mockStems.set(key, [...current, created]);
    return { ok: true, data: created };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadId: string;
      uploadUrl: string;
      role: ReleaseTrackStemRole;
    }>(`${base(releaseId, trackId)}/prepare`, {
      method: 'POST',
      body: JSON.stringify({
        role,
        filename: file.name,
        contentType,
      }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    if (!put.ok) {
      throw new Error(`Upload failed (${put.status})`);
    }
    const { data } = await requestJson<ReleaseTrackStem>(
      `${base(releaseId, trackId)}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ role, uploadId: prep.uploadId }),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch55.couldNotUploadStem'),
    };
  }
}

export async function deleteReleaseTrackStem(
  releaseId: string,
  trackId: string,
  stemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const key = mockKey(releaseId, trackId);
    mockStems.set(
      key,
      mockReleaseTrackStems(releaseId, trackId).filter(
        (stem) => stem.id !== stemId,
      ),
    );
    return { ok: true };
  }
  try {
    await requestJson(
      `${base(releaseId, trackId)}/${encodeURIComponent(stemId)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch55.couldNotRemoveStem'),
    };
  }
}
