import type { FetchMeta } from '../client';
import { DEMO_MP3 } from '../mock';
import { apiErrorMeta, isForceMock } from '../mode';
import type {
  FingerprintMatch,
  StudioRelease,
  StudioReleaseList,
} from '../studio-types';
import { requestJson } from './studio-request';

// ── Releases ────────────────────────────────────────────────────────────────

export async function fetchStudioReleases(): Promise<{
  data: StudioReleaseList;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: {
        page: 1,
        limit: 100,
        total: 3,
        releases: [
          {
            id: 'rel-mock-1',
            title: 'After Hours',
            type: 'ALBUM',
            state: 'PUBLISHED',
            releaseDate: '2026-06-01',
            smartLinkSlug: 'after-hours',
            smartLinkViewCount: 214,
            tracks: [
              {
                id: 't1',
                position: 1,
                title: 'Moonlight Drive',
                soundId: 'arch-mock-1',
                status: 'READY',
                sourceKey: 'releases/mock/t1.wav',
                fingerprintMatch: {
                  acoustidId: 'mock-acoustid-1',
                  score: 0.95,
                  title: 'Moonlight Drive',
                  artist: 'Northern Lights',
                },
              },
              {
                id: 't2',
                position: 2,
                title: 'Blue Hour',
                soundId: 'arch-mock-2',
                status: 'READY',
                sourceKey: 'releases/mock/t2.wav',
                fingerprintMatch: null,
              },
            ],
            _count: { tracks: 2 },
          },
          {
            id: 'rel-mock-2',
            title: 'Neon Tide',
            type: 'SINGLE',
            state: 'PUBLISHED',
            releaseDate: '2026-04-12',
            smartLinkSlug: 'neon-tide',
            smartLinkViewCount: 88,
            tracks: [
              {
                id: 't3',
                position: 1,
                title: 'Neon Tide',
                soundId: 'arch-mock-3',
              },
            ],
            _count: { tracks: 1 },
          },
          {
            id: 'rel-mock-3',
            title: 'Studio Sessions Vol. 1',
            type: 'EP',
            state: 'DRAFT',
            releaseDate: '2026-08-01',
            smartLinkSlug: 'studio-sessions-vol-1',
            smartLinkViewCount: 0,
            tracks: [
              {
                id: 't4',
                position: 1,
                title: 'Session One',
                soundId: 'arch-mock-4',
              },
            ],
            _count: { tracks: 1 },
          },
        ],
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioReleaseList>(
      '/api/me/releases?page=1&limit=100',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { page: 1, limit: 100, total: 0, releases: [] },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchStudioRelease(
  id: string,
  patch: {
    state?: string;
    description?: string;
    smartLinkTargets?: Record<string, string>;
  },
): Promise<{ ok: true; data: StudioRelease } | { ok: false; error: string }> {
  if (isForceMock()) {
    return {
      ok: true,
      data: {
        id,
        title: 'Mock EP',
        type: 'EP',
        state: patch.state ?? 'PUBLISHED',
        releaseDate: '2026-01-01',
        description: patch.description,
        smartLinkSlug: 'mock-ep',
        smartLinkTargets: patch.smartLinkTargets ?? null,
      },
    };
  }
  try {
    const { data } = await requestJson<StudioRelease>(
      `/api/me/releases/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Patch failed',
    };
  }
}

export async function patchStudioReleaseVisual(
  id: string,
  visualPreset: string,
): Promise<
  | { ok: true; data: Pick<StudioRelease, 'visualPreset'> }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, data: { visualPreset } };
  }
  try {
    const { data } = await requestJson<Pick<StudioRelease, 'visualPreset'>>(
      `/api/me/releases/${encodeURIComponent(id)}/visual`,
      {
        method: 'PATCH',
        body: JSON.stringify({ visualPreset }),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Visual settings update failed',
    };
  }
}

export async function addStudioReleaseTrack(
  releaseId: string,
  track: { title: string; soundId?: string; durationSec?: number | null },
): Promise<
  | { ok: true; data: NonNullable<StudioRelease['tracks']>[number] }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      data: {
        id: `release-track-${Date.now()}`,
        position: 1,
        title: track.title,
        soundId: track.soundId,
        durationSec: track.durationSec,
      },
    };
  }
  try {
    const { data } = await requestJson<
      NonNullable<StudioRelease['tracks']>[number]
    >(`/api/me/releases/${encodeURIComponent(releaseId)}/tracks`, {
      method: 'POST',
      body: JSON.stringify(track),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Track add failed',
    };
  }
}

export async function reorderStudioReleaseTracks(
  releaseId: string,
  trackIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/releases/${encodeURIComponent(releaseId)}/tracks/reorder`,
      {
        method: 'PUT',
        body: JSON.stringify({ trackIds }),
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Track order save failed',
    };
  }
}

export async function removeStudioReleaseTrack(
  releaseId: string,
  trackId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/releases/${encodeURIComponent(releaseId)}/tracks/${encodeURIComponent(trackId)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Track removal failed',
    };
  }
}

export async function createStudioRelease(input: {
  title: string;
  type?: string;
  releaseDate: string;
  description?: string;
}): Promise<{ ok: true; data: StudioRelease } | { ok: false; error: string }> {
  if (isForceMock()) {
    const id = `rel-mock-${Date.now()}`;
    const row: StudioRelease = {
      id,
      title: input.title,
      type: input.type ?? 'SINGLE',
      state: 'DRAFT',
      releaseDate: input.releaseDate,
      description: input.description ?? null,
      smartLinkSlug: `mock-${id.slice(-6)}`,
      _count: { tracks: 0 },
      tracks: [],
    };
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<StudioRelease>('/api/me/releases', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function uploadReleaseArtwork(
  releaseId: string,
  file: File,
): Promise<{ ok: true; artworkUrl: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, artworkUrl: URL.createObjectURL(file) };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>(`/api/me/releases/${encodeURIComponent(releaseId)}/artwork/prepare`, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'image/jpeg',
      }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'image/jpeg' },
    });
    if (!put.ok) {
      throw new Error(`Artwork PUT failed (${put.status})`);
    }
    const { data: done } = await requestJson<{ artworkUrl: string }>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/artwork/complete`,
      { method: 'POST', body: JSON.stringify({ uploadKey: prep.uploadKey }) },
    );
    return { ok: true, artworkUrl: done.artworkUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Artwork upload failed',
    };
  }
}

export async function removeReleaseArtwork(
  releaseId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/releases/${encodeURIComponent(releaseId)}/artwork`,
      {
        method: 'DELETE',
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Artwork removal failed',
    };
  }
}

export type FingerprintResult = {
  fingerprint: string | null;
  match: FingerprintMatch | null;
  persisted: boolean;
};

const MOCK_FINGERPRINT_MATCH: FingerprintMatch = {
  acoustidId: 'mock-acoustid-id',
  score: 0.87,
  title: 'Similar Sounding Track',
  artist: 'A Different Artist',
};

async function runTrackFingerprint(
  releaseId: string,
  trackId: string,
  path: 'fingerprint' | 'fingerprint/check',
  mockMatch: FingerprintMatch | null,
): Promise<
  { ok: true; data: FingerprintResult } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      data: {
        fingerprint: 'mock-fingerprint',
        match: mockMatch,
        persisted: path === 'fingerprint',
      },
    };
  }
  try {
    const { data } = await requestJson<FingerprintResult>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/tracks/${encodeURIComponent(trackId)}/${path}`,
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Fingerprinting failed',
    };
  }
}

/** Re-runs the fingerprint + match lookup and replaces whatever's stored. */
export async function refingerprintTrack(releaseId: string, trackId: string) {
  return runTrackFingerprint(
    releaseId,
    trackId,
    'fingerprint',
    MOCK_FINGERPRINT_MATCH,
  );
}

/** Same lookup, but never overwrites the stored fingerprint/match. */
export async function checkTrackFingerprint(
  releaseId: string,
  trackId: string,
) {
  return runTrackFingerprint(releaseId, trackId, 'fingerprint/check', null);
}

/** Matches packages/shared/src/dto/archive-stems.ts's StemSetSchema in the
 * tahti API repo — the render endpoint 400s on anything else. */
export type StemSet = 'TWO_STEM' | 'FOUR_STEM';

export const STEM_SET_LABELS: Record<StemSet, string> = {
  TWO_STEM: 'Vocals + instrumental',
  FOUR_STEM: 'Vocals, drums, bass, other',
};

export type StemJob = {
  stemSet: string;
  status: string;
  errorMessage?: string | null;
  files?: Array<{ label: string; url: string }>;
};

export async function fetchSoundStems(soundId: string): Promise<{
  data: StemJob[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          stemSet: 'TWO_STEM',
          status: 'READY',
          files: [
            { label: 'Vocals', url: DEMO_MP3 },
            { label: 'Instrumental', url: DEMO_MP3 },
          ],
        },
        {
          stemSet: 'FOUR_STEM',
          status: 'READY',
          files: [
            { label: 'Vocals', url: DEMO_MP3 },
            { label: 'Drums', url: DEMO_MP3 },
            { label: 'Bass', url: DEMO_MP3 },
            { label: 'Other', url: DEMO_MP3 },
          ],
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ jobs: StemJob[] }>(
      `/api/me/sound/${encodeURIComponent(soundId)}/stems`,
    );
    return { data: data.jobs ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function requestSoundStems(
  soundId: string,
  stemSet: StemSet = 'TWO_STEM',
): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, status: 'PENDING' };
  }
  try {
    const { data } = await requestJson<{ status: string }>(
      `/api/me/sound/${encodeURIComponent(soundId)}/stems/render`,
      { method: 'POST', body: JSON.stringify({ stemSet }) },
    );
    return { ok: true, status: data.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Stem request failed',
    };
  }
}
