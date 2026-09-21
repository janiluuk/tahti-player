import type { FetchMeta } from '../client';
import { DEMO_MP3 } from '../mock';
import { getMockUploadedSound, patchMockUploadedSound } from '../mock-uploads';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '../mode';
import type {
  EditorSource,
  StudioSound,
  StudioSoundPatch,
} from '../studio-types';
import { mockSoundStore } from './studio-mock';
import { requestJson } from './studio-request';

// ── Sounds ─────────────────────────────────────────────────────────────────

export async function fetchStudioSounds(): Promise<{
  data: StudioSound[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...mockSoundStore],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioSound[]>('/api/me/sound');
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
  if (isForceMock()) {
    const item = mockSoundStore.find((a) => a.id === id) ?? {
      ...mockSoundStore[0]!,
      id,
      title: `Mock ${id}`,
    };
    return { data: item, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<StudioSound>(
      `/api/me/sound/${encodeURIComponent(id)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      const item =
        mockSoundStore.find((a) => a.id === id) ?? mockSoundStore[0]!;
      return { data: { ...item, id }, meta: failMeta(err) };
    }
    throw err instanceof Error ? err : new Error('Track fetch failed');
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
  if (isForceMock()) {
    return {
      ok: true,
      url: getMockUploadedSound(id)?.objectUrl ?? DEMO_MP3,
      filename: getMockUploadedSound(id)?.filename ?? 'tahti-sound.mp3',
    };
  }
  try {
    const { data } = await requestJson<{ url: string; filename?: string }>(
      `/api/me/sound/${encodeURIComponent(id)}/download`,
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
  if (isForceMock()) {
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
      `/api/me/sound/${encodeURIComponent(id)}`,
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
/** Mock-mode mirror of the real `PATCH /api/me/sound/:id/access` effect
 * on `mockSoundStore`, so `fetchStudioSound`/`TrackEditDialog` see the
 * change immediately — `setSoundPurchaseAccess` (purchase-tiers.ts) calls
 * this in mock mode instead of duplicating the store lookup. */
export function setMockSoundPurchaseAccess(
  id: string,
  accessMode: 'FREE' | 'PURCHASE',
  purchaseTierId: string | null,
): void {
  const idx = mockSoundStore.findIndex((a) => a.id === id);
  if (idx >= 0) {
    mockSoundStore[idx] = {
      ...mockSoundStore[idx]!,
      accessMode,
      purchaseTierId,
    };
  }
}

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
  if (isForceMock()) {
    return {
      data: mockSoundShares[soundId] ?? [],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ shares: SoundShare[] }>(
      `/api/me/sound/${encodeURIComponent(soundId)}/shares`,
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
  if (isForceMock()) {
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
      `/api/me/sound/${encodeURIComponent(soundId)}/share`,
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
  if (isForceMock()) {
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
      `/api/me/sound/shares/${encodeURIComponent(shareId)}`,
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
    return { ok: true, url: URL.createObjectURL(file) };
  }
  try {
    const { data: prepared } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>(`/api/me/sound/${encodeURIComponent(soundId)}/banner/prepare`, {
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
      `/api/me/sound/${encodeURIComponent(soundId)}/banner/complete`,
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
  if (isForceMock()) {
    return { ok: true, url: sourceUrl };
  }
  try {
    const { data } = await requestJson<{ url: string }>(
      `/api/me/sound/${encodeURIComponent(soundId)}/banner/from-url`,
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
  if (isForceMock()) {
    const idx = mockSoundStore.findIndex((a) => a.id === id);
    if (idx >= 0) {
      mockSoundStore.splice(idx, 1);
    }
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/sound/${encodeURIComponent(id)}`, {
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
  if (isForceMock()) {
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
      `/api/me/sound/${encodeURIComponent(soundId)}/editor/source`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { url: DEMO_MP3, durationSec: 180, title: 'Fallback demo audio' },
      meta: apiErrorMeta(err),
    };
  }
}
