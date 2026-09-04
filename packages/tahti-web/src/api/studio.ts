import { addMockArchiveVersion } from './archive-versions';
import type { FetchMeta } from './client';
import { DEMO_MP3 } from './mock';
import { getMockSessionUser } from './mock-session';
import {
  getMockUploadedSound,
  patchMockUploadedSound,
  registerMockUploadedSound,
} from './mock-uploads';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';
import type {
  EditList,
  EditorDraft,
  EditorProjectDetail,
  EditorProjectRow,
  EditorSource,
  EditorTimeline,
  FingerprintMatch,
  StudioCollection,
  StudioRelease,
  StudioReleaseList,
  StudioSound,
  StudioSoundPatch,
} from './studio-types';
import { createDefaultEditList } from './studio-types';

const forceMock = isForceMock;

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

// ── Mock fixtures ───────────────────────────────────────────────────────────

const mockSoundStore: StudioSound[] = [
  {
    id: 'arch-mock-1',
    title: 'Northern Lights — Live Set',
    status: 'READY',
    durationSec: 3720,
    description: 'Mock archive item for studio POC.',
    genre: 'ambient',
    contentType: 'DJ_SET',
    isPublic: true,
    visibility: 'PUBLIC',
    releaseDate: '2026-07-15',
    downloadsEnabled: true,
    commentsEnabled: true,
    pinnedAt: '2026-07-15T12:00:00.000Z',
    createdAt: new Date().toISOString(),
    peaks: Array.from({ length: 96 }, (_, i) =>
      Math.round(60 + 120 * Math.abs(Math.sin(i * 0.37))),
    ),
    tracklist: [
      {
        id: 'mix-track-1',
        title: 'Aurora Drift',
        artist: 'Northern Lights',
        startSec: 0,
      },
      {
        id: 'mix-track-2',
        title: 'Midnight Broadcast',
        artist: 'Northern Lights',
        startSec: 900,
      },
      {
        id: 'mix-track-3',
        title: 'Kaamos Bloom',
        artist: 'Northern Lights',
        startSec: 1800,
      },
    ],
    tracklistOverlay: { enabled: true, preset: 'cards' },
  },
  {
    id: 'arch-mock-2',
    title: 'Studio sketch A',
    status: 'READY',
    durationSec: 214,
    genre: 'electronic',
    contentType: 'TRACK',
    isPublic: false,
    visibility: 'PRIVATE',
    releaseDate: null,
    downloadsEnabled: false,
    commentsEnabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'arch-mock-3',
    title: 'Imported from hearthis.at',
    status: 'READY',
    durationSec: 2640,
    genre: 'house',
    contentType: 'DJ_SET',
    isPublic: true,
    visibility: 'PUBLIC',
    releaseDate: null,
    downloadsEnabled: false,
    commentsEnabled: true,
    createdAt: new Date().toISOString(),
    embedProvider: 'HEARTHIS',
    embedUri: '1234567',
  },
];

let mockProjects: EditorProjectRow[] = [
  {
    id: 'proj-mock-1',
    title: 'Northern Lights — edit',
    soundId: 'arch-mock-1',
    updatedAt: new Date().toISOString(),
  },
];
const mockProjectTimelines = new Map<string, EditorTimeline>();

const mockDrafts = new Map<string, EditorDraft>();

function mockPeaks(durationSec: number) {
  const n = 256;
  const level = Array.from({ length: n }, (_, i) => {
    const t = i / n;
    return (
      0.15 +
      0.7 * Math.abs(Math.sin(t * Math.PI * 8)) * (0.4 + 0.6 * Math.random())
    );
  });
  return { sampleRate: 44100, durationSec, levels: [level] };
}

// ── Sounds ─────────────────────────────────────────────────────────────────

export async function fetchStudioSounds(): Promise<{
  data: StudioSound[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [...mockSoundStore],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioSound[]>('/api/me/archive');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [...mockSoundStore], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchStudioSound(id: string): Promise<{
  data: StudioSound;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const item = mockSoundStore.find((a) => a.id === id) ?? {
      ...mockSoundStore[0]!,
      id,
      title: `Mock ${id}`,
    };
    return { data: item, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<StudioSound>(
      `/api/me/archive/${encodeURIComponent(id)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      const item =
        mockSoundStore.find((a) => a.id === id) ?? mockSoundStore[0]!;
      return { data: { ...item, id }, meta: failMeta(err) };
    }
    throw err instanceof Error ? err : new Error('Sound fetch failed');
  }
}

export async function fetchStudioSoundDownload(id: string): Promise<
  | {
      ok: true;
      url: string;
      filename?: string;
    }
  | { ok: false; error: string }
> {
  if (forceMock()) {
    return {
      ok: true,
      url: getMockUploadedSound(id)?.objectUrl ?? DEMO_MP3,
      filename: getMockUploadedSound(id)?.filename ?? 'tahti-sound.mp3',
    };
  }
  try {
    const { data } = await requestJson<{ url: string; filename?: string }>(
      `/api/me/archive/${encodeURIComponent(id)}/download`,
    );
    return { ok: true, ...data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : 'Download is not available',
    };
  }
}

export async function patchStudioSound(
  id: string,
  patch: StudioSoundPatch,
): Promise<{ ok: true; data: StudioSound } | { ok: false; error: string }> {
  if (forceMock()) {
    const idx = mockSoundStore.findIndex((a) => a.id === id);
    const { pinned, ...rest } = patch;
    patchMockUploadedSound(id, {
      ...(patch.title ? { title: patch.title } : {}),
      ...(patch.downloadsEnabled !== undefined
        ? { downloadsEnabled: patch.downloadsEnabled }
        : {}),
      ...(patch.visibility ? { visibility: patch.visibility } : {}),
      ...(patch.isPublic === true ? { visibility: 'PUBLIC' as const } : {}),
    });
    if (idx >= 0) {
      const next: StudioSound = {
        ...mockSoundStore[idx]!,
        ...rest,
        title: patch.title ?? mockSoundStore[idx]!.title,
      };
      if (pinned !== undefined) {
        next.pinnedAt = pinned ? new Date().toISOString() : null;
      }
      mockSoundStore[idx] = next;
      return { ok: true, data: mockSoundStore[idx]! };
    }
    return {
      ok: true,
      data: {
        id,
        title: patch.title ?? 'Untitled',
        status: 'READY',
        ...rest,
        ...(pinned !== undefined
          ? { pinnedAt: pinned ? new Date().toISOString() : null }
          : {}),
      },
    };
  }
  try {
    const { data } = await requestJson<StudioSound>(
      `/api/me/archive/${encodeURIComponent(id)}`,
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

/** A keyed access link for a PRIVATE/STASH sound — same shape and
 * contract as StashShare (api/sources.ts), for the same reason: mints a
 * token a specific link (`/t/$id?key=<token>`) can present to bypass the
 * normal visibility check for that one sound. The backend must treat any
 * request carrying a valid key as a private-share access: never fan it
 * out as a public play/comment/reaction event, only record it in the
 * audit log (who/when/via which share). This client only mints, sends,
 * and revokes the token — it cannot itself enforce that server-side
 * behavior. */
export type SoundShare = {
  id: string;
  granteeUsername: string | null;
  token: string;
  permission: 'READ' | 'DOWNLOAD';
  expiresAt: string | null;
  createdAt: string;
};

let mockSoundShares: Record<string, SoundShare[]> = {};

export async function fetchSoundShares(soundId: string): Promise<{
  data: SoundShare[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockSoundShares[soundId] ?? [],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ shares: SoundShare[] }>(
      `/api/me/archive/${encodeURIComponent(soundId)}/shares`,
    );
    return { data: data.shares ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createSoundShare(
  soundId: string,
  input: {
    granteeUsername?: string;
    permission: 'READ' | 'DOWNLOAD';
    expiresInDays?: number;
  },
): Promise<{ ok: true; data: SoundShare } | { ok: false; error: string }> {
  if (forceMock()) {
    const now = new Date();
    const share: SoundShare = {
      id: `mock-sound-share-${Date.now()}`,
      granteeUsername: input.granteeUsername?.replace(/^@/, '') || null,
      token: `mock-key-${Date.now()}`,
      permission: input.permission,
      expiresAt: input.expiresInDays
        ? new Date(
            now.getTime() + input.expiresInDays * 86_400_000,
          ).toISOString()
        : null,
      createdAt: now.toISOString(),
    };
    mockSoundShares = {
      ...mockSoundShares,
      [soundId]: [...(mockSoundShares[soundId] ?? []), share],
    };
    return { ok: true, data: share };
  }
  try {
    const { data } = await requestJson<SoundShare>(
      `/api/me/archive/${encodeURIComponent(soundId)}/share`,
      { method: 'POST', body: JSON.stringify(input) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Share creation failed',
    };
  }
}

export async function revokeSoundShare(
  soundId: string,
  shareId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockSoundShares = {
      ...mockSoundShares,
      [soundId]: (mockSoundShares[soundId] ?? []).filter(
        (share) => share.id !== shareId,
      ),
    };
    return { ok: true };
  }
  try {
    await requestJson<void>(
      `/api/me/archive/shares/${encodeURIComponent(shareId)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Revoke failed',
    };
  }
}

export type RadioSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type RadioSubmission = {
  id: string;
  status: RadioSubmissionStatus;
  rejectionNote: string | null;
  createdAt: string;
  sound: { id: string; title: string };
};

export type MetaStreamPreference = { metaStreamOptOut: boolean };

/** Own recent Tahti Radio submissions, newest first -- used to show
 * per-track status ("Pending review" / "In rotation" / rejection note)
 * without a dedicated per-track lookup endpoint. */
export async function fetchMyRadioSubmissions(): Promise<{
  data: RadioSubmission[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<{ items: RadioSubmission[] }>(
      '/api/me/radio-submissions',
    );
    return { data: data.items, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

/** Submit one READY track for Tahti Radio board review -- not immediate
 * inclusion, see RadioSubmissionStatus. */
export async function submitTrackToRadioRotation(
  soundId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return submitTracksToRadioRotation([soundId]);
}

export async function submitTracksToRadioRotation(
  soundIds: string[],
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true };
  }
  try {
    await requestJson('/api/me/radio-submissions', {
      method: 'POST',
      body: JSON.stringify({ soundIds, note: note?.trim() || undefined }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Submission failed',
    };
  }
}

export async function fetchMetaStreamPreference(): Promise<{
  data: MetaStreamPreference;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: { metaStreamOptOut: false },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<MetaStreamPreference>(
      '/api/me/channel/meta-stream',
    );
    return { data, meta: { source: 'api' } };
  } catch (error) {
    return { data: { metaStreamOptOut: false }, meta: failMeta(error) };
  }
}

export async function patchMetaStreamPreference(optOut: boolean): Promise<
  | {
      ok: true;
      data: MetaStreamPreference;
    }
  | { ok: false; error: string }
> {
  if (forceMock()) {
    return { ok: true, data: { metaStreamOptOut: optOut } };
  }
  try {
    const { data } = await requestJson<MetaStreamPreference>(
      '/api/me/channel/meta-stream',
      {
        method: 'PATCH',
        body: JSON.stringify({ optOut }),
      },
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not update Tahti Radio preference',
    };
  }
}

export async function uploadSoundBanner(
  soundId: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, url: URL.createObjectURL(file) };
  }
  try {
    const { data: prepared } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>(`/api/me/archive/${encodeURIComponent(soundId)}/banner/prepare`, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'image/jpeg',
      }),
    });
    const upload = await fetch(prepared.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'image/jpeg' },
    });
    if (!upload.ok) {
      throw new Error(`Artwork upload failed (${upload.status})`);
    }
    const { data: completed } = await requestJson<{ url: string }>(
      `/api/me/archive/${encodeURIComponent(soundId)}/banner/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prepared.uploadKey }),
      },
    );
    return { ok: true, url: completed.url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Artwork upload failed',
    };
  }
}

export async function importSoundBanner(
  soundId: string,
  sourceUrl: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, url: sourceUrl };
  }
  try {
    const { data } = await requestJson<{ url: string }>(
      `/api/me/archive/${encodeURIComponent(soundId)}/banner/from-url`,
      {
        method: 'POST',
        body: JSON.stringify({ sourceUrl }),
      },
    );
    return { ok: true, url: data.url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Artwork import failed',
    };
  }
}

export async function deleteStudioSound(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    const idx = mockSoundStore.findIndex((a) => a.id === id);
    if (idx >= 0) {
      mockSoundStore.splice(idx, 1);
    }
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/archive/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

export async function fetchEditorSource(soundId: string): Promise<{
  data: EditorSource;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const item = mockSoundStore.find((a) => a.id === soundId);
    return {
      data: {
        url: DEMO_MP3,
        durationSec: item?.durationSec ?? 180,
        title: item?.title ?? 'Mock source',
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<EditorSource>(
      `/api/me/archive/${encodeURIComponent(soundId)}/editor/source`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { url: DEMO_MP3, durationSec: 180, title: 'Fallback demo audio' },
      meta: apiErrorMeta(err),
    };
  }
}

// ── Releases ────────────────────────────────────────────────────────────────

export async function fetchStudioReleases(): Promise<{
  data: StudioReleaseList;
  meta: FetchMeta;
}> {
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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
      `/api/me/archive/${encodeURIComponent(soundId)}/stems`,
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
  if (forceMock()) {
    return { ok: true, status: 'PENDING' };
  }
  try {
    const { data } = await requestJson<{ status: string }>(
      `/api/me/archive/${encodeURIComponent(soundId)}/stems/render`,
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

// ── Collections ─────────────────────────────────────────────────────────────

export async function fetchStudioCollections(): Promise<{
  data: StudioCollection[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [
        {
          id: 'mock-collection-favorites-mix',
          slug: 'favorites-mix',
          name: 'Favorites mix',
          description: 'Tracks saved for later listening.',
          style: 'PLAYLIST',
          isPublic: true,
          itemCount: 2,
        },
        {
          id: 'mock-collection-midnight-archive',
          slug: 'midnight-archive',
          name: 'Midnight Archive',
          description: 'A full-length collection of late-night sessions.',
          style: 'ALBUM',
          isPublic: true,
          itemCount: 2,
        },
        {
          id: 'mock-collection-short-signals',
          slug: 'short-signals',
          name: 'Short Signals',
          description: 'Four connected pieces from the same session.',
          style: 'EP',
          isPublic: true,
          itemCount: 2,
        },
        {
          id: 'mock-collection-northern-lights-set',
          slug: 'northern-lights-set',
          name: 'Northern Lights DJ set',
          description: 'A continuous club mix arranged for radio.',
          style: 'DJ_SET_SERIES',
          isPublic: false,
          itemCount: 2,
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioCollection[]>(
      '/api/me/collections?expand=items',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchStudioCollection(slug: string): Promise<{
  data: StudioCollection;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: {
        id: `mock-collection-${slug}`,
        slug,
        name: slug,
        style:
          slug === 'short-signals'
            ? 'EP'
            : slug === 'midnight-archive'
              ? 'ALBUM'
              : 'PLAYLIST',
        isPublic: true,
        items: mockSoundStore.map((a, i) => ({
          id: `ci-${a.id}`,
          position: i,
          soundId: a.id,
          sound: { id: a.id, title: a.title, durationSec: a.durationSec },
        })),
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioCollection>(
      `/api/me/collections/${encodeURIComponent(slug)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { slug, name: slug, items: [] },
      meta: apiErrorMeta(err),
    };
  }
}

export async function addStudioCollectionItem(
  slug: string,
  item:
    | string
    | { soundId: string; releaseId?: never }
    | { releaseId: string; soundId?: never },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const body =
    typeof item === 'string'
      ? { soundId: item }
      : item.soundId
        ? { soundId: item.soundId }
        : { releaseId: item.releaseId };
  if (forceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/collections/${encodeURIComponent(slug)}/items`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Add failed',
    };
  }
}

export async function reorderStudioCollectionItems(
  slug: string,
  itemIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/collections/${encodeURIComponent(slug)}/reorder`,
      {
        method: 'PUT',
        body: JSON.stringify({ itemIds }),
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Reorder failed',
    };
  }
}

export async function removeStudioCollectionItem(
  slug: string,
  itemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/collections/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Remove failed',
    };
  }
}

export async function createStudioCollection(input: {
  name: string;
  style?: string;
  description?: string;
  isPublic?: boolean;
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  releaseDate?: string | null;
  genres?: string[];
  collaborative?: boolean;
}): Promise<
  { ok: true; data: StudioCollection } | { ok: false; error: string }
> {
  if (forceMock()) {
    const slug =
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || `mix-${Date.now()}`;
    return {
      ok: true,
      data: {
        id: `mock-collection-${slug}`,
        slug,
        name: input.name,
        description: input.description ?? null,
        style: input.style ?? 'PLAYLIST',
        isPublic: input.isPublic ?? true,
        visibility:
          input.visibility ?? (input.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
        releaseDate: input.releaseDate ?? null,
        genres: input.genres ?? [],
        collaborative: Boolean(input.collaborative && (input.isPublic ?? true)),
        items: [],
        itemCount: 0,
      },
    };
  }
  try {
    const { data } = await requestJson<StudioCollection>(
      '/api/me/collections',
      {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          style: input.style ?? 'PLAYLIST',
          description: input.description,
          isPublic: input.isPublic ?? true,
          visibility:
            input.visibility ??
            (input.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
          releaseDate: input.releaseDate,
          genres: input.genres,
          collaborative: Boolean(
            input.collaborative && (input.isPublic ?? true),
          ),
        }),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function patchStudioCollection(
  slug: string,
  patch: {
    name?: string;
    description?: string | null;
    style?: string;
    isPublic?: boolean;
    visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
    releaseDate?: string | null;
    genres?: string[];
    collaborative?: boolean;
    coverUrl?: string | null;
    backdropUrl?: string | null;
  },
): Promise<
  { ok: true; data: StudioCollection } | { ok: false; error: string }
> {
  if (forceMock()) {
    return {
      ok: true,
      data: {
        slug,
        name: patch.name ?? slug,
        description: patch.description ?? null,
        style: patch.style ?? 'ALBUM',
        isPublic: patch.isPublic ?? true,
        visibility:
          patch.visibility ?? (patch.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
        releaseDate: patch.releaseDate ?? null,
        genres: patch.genres ?? [],
        collaborative: Boolean(patch.collaborative && (patch.isPublic ?? true)),
        coverUrl: patch.coverUrl ?? null,
        backdropUrl: patch.backdropUrl ?? null,
        items: [],
      },
    };
  }
  try {
    const { data } = await requestJson<StudioCollection>(
      `/api/me/collections/${encodeURIComponent(slug)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function uploadCollectionCover(
  slug: string,
  file: File,
): Promise<{ ok: true; coverUrl: string } | { ok: false; error: string }> {
  if (forceMock()) {
    const url = URL.createObjectURL(file);
    return { ok: true, coverUrl: url };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>(`/api/me/collections/${encodeURIComponent(slug)}/cover/prepare`, {
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
      throw new Error(`Cover PUT failed (${put.status})`);
    }
    const { data: done } = await requestJson<{ url?: string | null }>(
      `/api/me/collections/${encodeURIComponent(slug)}/cover/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prep.uploadKey }),
      },
    );
    return { ok: true, coverUrl: done.url ?? '' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Cover upload failed',
    };
  }
}

export type CollectionGalleryMode =
  | 'NONE'
  | 'STATIC_SLIDESHOW'
  | 'TWISTED_WAVE_GLSL'
  | 'ZOOM_BLUR_GLSL'
  | 'RGB_SHIFT_GLSL'
  | 'POSTER_WALL_GLSL'
  | 'SHATTER_CAROUSEL_GLSL';

export type CollectionGallery = {
  galleryMode: CollectionGalleryMode;
  slideshowImages: string[];
  videoBackgroundUrl: string | null;
};

const DEFAULT_COLLECTION_GALLERY: CollectionGallery = {
  galleryMode: 'NONE',
  slideshowImages: [],
  videoBackgroundUrl: null,
};

export async function fetchCollectionGallery(
  slug: string,
): Promise<{ data: CollectionGallery }> {
  if (forceMock()) {
    return { data: DEFAULT_COLLECTION_GALLERY };
  }
  try {
    const { data } = await requestJson<CollectionGallery>(
      `/api/me/collections/${encodeURIComponent(slug)}/gallery`,
    );
    return { data };
  } catch {
    return { data: DEFAULT_COLLECTION_GALLERY };
  }
}

/** Backdrop can be a single still image (`slideshowImages` with one entry,
 * mode NONE) or an actual slideshow (multiple entries, mode
 * STATIC_SLIDESHOW) — same shape the channel-wide gallery uses
 * (see api/channel-gallery.ts), just scoped to one collection. */
export async function patchCollectionGallery(
  slug: string,
  patch: Partial<CollectionGallery>,
): Promise<
  { ok: true; data: CollectionGallery } | { ok: false; error: string }
> {
  if (forceMock()) {
    return {
      ok: true,
      data: {
        galleryMode: patch.galleryMode ?? 'NONE',
        slideshowImages: patch.slideshowImages ?? [],
        videoBackgroundUrl: patch.videoBackgroundUrl ?? null,
      },
    };
  }
  try {
    const { data } = await requestJson<CollectionGallery>(
      `/api/me/collections/${encodeURIComponent(slug)}/gallery`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not save backdrop images',
    };
  }
}

// ── Upload ──────────────────────────────────────────────────────────────────

export async function uploadSoundFile(input: {
  file: File;
  title?: string;
}): Promise<
  { ok: true; itemId: string; meta: FetchMeta } | { ok: false; error: string }
> {
  if (forceMock()) {
    const id = `arch-mock-${Date.now()}`;
    const channelSlug = getMockSessionUser()?.username ?? 'demo';
    const filename = input.file.name || 'upload.wav';
    mockSoundStore.unshift({
      id,
      title: input.title || filename,
      status: 'READY',
      durationSec: 180,
      isPublic: false,
      createdAt: new Date().toISOString(),
    });
    await registerMockUploadedSound({
      id,
      title: input.title || filename,
      filename,
      objectUrl: URL.createObjectURL(input.file),
      channelSlug,
      downloadsEnabled: false,
      visibility: 'PRIVATE',
      mimeType: input.file.type || 'audio/wav',
    });
    return {
      ok: true,
      itemId: id,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadId: string;
      uploadUrl: string;
    }>('/api/uploads/prepare', {
      method: 'POST',
      body: JSON.stringify({
        filename: input.file.name,
        contentType: input.file.type || 'audio/mpeg',
        fileSizeBytes: input.file.size,
        ...(input.title ? { title: input.title } : {}),
      }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: input.file,
      headers: { 'Content-Type': input.file.type || 'audio/mpeg' },
    });
    if (!put.ok) {
      throw new Error(`Upload PUT failed (${put.status})`);
    }
    const etag =
      put.headers.get('etag') ?? put.headers.get('ETag') ?? '"mock-etag"';
    const { data: done } = await requestJson<{ itemId: string }>(
      '/api/uploads/complete',
      {
        method: 'POST',
        body: JSON.stringify({
          uploadId: prep.uploadId,
          etag: etag.replace(/"/g, ''),
          ...(input.title ? { title: input.title } : {}),
        }),
      },
    );
    return { ok: true, itemId: done.itemId, meta: { source: 'api' } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

// ── Editor projects ─────────────────────────────────────────────────────────

export async function fetchEditorProjects(): Promise<{
  data: EditorProjectRow[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [...mockProjects],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<EditorProjectRow[]>(
      '/api/me/editor/projects',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [...mockProjects], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function createEditorProject(input: {
  title?: string;
  soundId?: string;
}): Promise<
  { ok: true; data: EditorProjectRow } | { ok: false; error: string }
> {
  if (forceMock()) {
    const row: EditorProjectRow = {
      id: `proj-mock-${Date.now()}`,
      title: input.title ?? 'Untitled session',
      soundId: input.soundId ?? null,
      updatedAt: new Date().toISOString(),
    };
    mockProjects = [row, ...mockProjects];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<EditorProjectRow>(
      '/api/me/editor/projects',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function fetchEditorProject(id: string): Promise<{
  data: EditorProjectDetail;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const row = mockProjects.find((p) => p.id === id) ?? {
      id,
      title: 'Mock project',
      soundId: 'arch-mock-1',
      updatedAt: new Date().toISOString(),
    };
    return {
      data: {
        ...row,
        timeline: mockProjectTimelines.get(id) ?? {
          version: 1,
          durationSec: 180,
          tracks: [],
        },
        sources: row.soundId
          ? [{ id: row.soundId, title: 'Mock source', url: DEMO_MP3 }]
          : [],
      },
      meta: { source: 'mock' },
    };
  }
  try {
    const { data } = await requestJson<EditorProjectDetail>(
      `/api/me/editor/projects/${encodeURIComponent(id)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { id, title: 'Unavailable', updatedAt: new Date().toISOString() },
      meta: apiErrorMeta(err),
    };
  }
}

export async function updateEditorProject(
  id: string,
  timeline: EditorTimeline,
): Promise<
  { ok: true; data: EditorProjectDetail } | { ok: false; error: string }
> {
  if (forceMock()) {
    const project = mockProjects.find((item) => item.id === id);
    if (!project) {
      return { ok: false, error: 'Project not found' };
    }
    mockProjectTimelines.set(id, timeline);
    const next = { ...project, updatedAt: new Date().toISOString(), timeline };
    mockProjects = mockProjects.map((item) => (item.id === id ? next : item));
    return { ok: true, data: next };
  }
  try {
    const { data } = await requestJson<EditorProjectDetail>(
      `/api/me/editor/projects/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify({ timeline }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function deleteEditorProject(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockProjects = mockProjects.filter((item) => item.id !== id);
    mockProjectTimelines.delete(id);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/editor/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

// ── Sound pro editor draft / render ───────────────────────────────────────

export async function fetchEditorDraft(soundId: string): Promise<{
  data: EditorDraft;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const existing = mockDrafts.get(soundId);
    if (existing) {
      return {
        data: existing,
        meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      };
    }
    const item = mockSoundStore.find((a) => a.id === soundId);
    const duration = item?.durationSec ?? 180;
    const draft: EditorDraft = {
      editList: createDefaultEditList(duration),
      updatedAt: new Date().toISOString(),
      editorPeaks: mockPeaks(duration),
    };
    mockDrafts.set(soundId, draft);
    return { data: draft, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<EditorDraft>(
      `/api/me/archive/${encodeURIComponent(soundId)}/editor/draft`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    const draft: EditorDraft = {
      editList: createDefaultEditList(180),
      updatedAt: null,
      editorPeaks: mockPeaks(180),
    };
    return { data: draft, meta: apiErrorMeta(err) };
  }
}

export async function saveEditorDraft(
  soundId: string,
  editList: EditList,
  expectedUpdatedAt?: string | null,
): Promise<{ ok: true; updatedAt: string } | { ok: false; error: string }> {
  if (forceMock()) {
    const updatedAt = new Date().toISOString();
    mockDrafts.set(soundId, {
      editList,
      updatedAt,
      editorPeaks: mockPeaks(editList.sourceDuration),
    });
    return { ok: true, updatedAt };
  }
  try {
    const { data } = await requestJson<{ ok: true; updatedAt: string }>(
      `/api/me/archive/${encodeURIComponent(soundId)}/editor/draft`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          editList,
          ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}),
        }),
      },
    );
    return { ok: true, updatedAt: data.updatedAt };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function renderEditorDraft(
  soundId: string,
  editList: EditList,
  versionLabel: string,
  /** false = "save as new revision" -- rendered and added to Revision
   * history, but the currently-live version keeps playing until someone
   * activates it there. true = "overwrite" -- goes live immediately. */
  activate = true,
): Promise<
  { ok: true; versionId: string; status: string } | { ok: false; error: string }
> {
  if (forceMock()) {
    const row = addMockArchiveVersion(soundId, {
      versionLabel,
      activate,
    });
    return { ok: true, versionId: row.id, status: 'READY' };
  }
  try {
    const { data } = await requestJson<{
      ok: true;
      versionId: string;
      versionNumber: number;
      status: string;
    }>(`/api/me/archive/${encodeURIComponent(soundId)}/editor/render`, {
      method: 'POST',
      body: JSON.stringify({
        editList,
        versionLabel,
        activate,
        format: 'flac',
      }),
    });
    return { ok: true, versionId: data.versionId, status: data.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Render failed',
    };
  }
}
