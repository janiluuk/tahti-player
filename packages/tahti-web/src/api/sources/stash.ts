import type { FetchMeta } from '.././client';
import { DEMO_MP3 } from '.././mock';
import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { failMeta } from './shared';

export type StashShare = {
  id: string;
  granteeUsername: string | null;
  token: string;
  permission: 'READ' | 'DOWNLOAD';
  fileCount: number;
  expiresAt: string | null;
  createdAt: string;
};

export type StashFile = {
  id: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number | string;
  createdAt?: string;
  shareCount: number;
  shares: StashShare[];
};

export let mockStashShares: StashShare[] = [];
export const MILLISECONDS_PER_DAY = 86_400_000;

export async function fetchStashFiles(): Promise<{
  data: StashFile[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'stash-1',
          filename: 'stems-kick.wav',
          contentType: 'audio/wav',
          sizeBytes: 12_000_000,
          shareCount: mockStashShares.length,
          shares: [...mockStashShares],
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ files: StashFile[] }>(
      '/api/me/stash?page=1&limit=50',
    );
    return { data: data.files ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchStashDownload(id: string): Promise<{
  data: { url: string; filename?: string } | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { url: DEMO_MP3, filename: 'mock.mp3' },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ url: string; filename?: string }>(
      `/api/me/stash/${encodeURIComponent(id)}/download`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function uploadStashFile(
  file: File,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, id: `mock-stash-${Date.now()}` };
  }
  try {
    const { data: prep } = await requestJson<{
      objectKey: string;
      uploadUrl: string;
    }>('/api/me/stash/prepare', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!put.ok) {
      return { ok: false, error: `Upload PUT failed (${put.status})` };
    }
    const { data } = await requestJson<{ id: string }>('/api/me/stash', {
      method: 'POST',
      body: JSON.stringify({
        objectKey: prep.objectKey,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      }),
    });
    return { ok: true, id: data.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

export async function deleteStashFile(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson<void>(`/api/me/stash/${encodeURIComponent(id)}`, {
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

export async function createStashShare(
  id: string,
  input: {
    granteeUsername?: string;
    permission: 'READ' | 'DOWNLOAD';
    expiresInDays?: number;
  },
): Promise<{ ok: true; data: StashShare } | { ok: false; error: string }> {
  if (isForceMock()) {
    const now = new Date();
    const share: StashShare = {
      id: `mock-share-${Date.now()}`,
      granteeUsername: input.granteeUsername?.replace(/^@/, '') || null,
      token: `mock-token-${Date.now()}`,
      permission: input.permission,
      fileCount: 1,
      expiresAt: input.expiresInDays
        ? new Date(
            now.getTime() + input.expiresInDays * MILLISECONDS_PER_DAY,
          ).toISOString()
        : null,
      createdAt: now.toISOString(),
    };
    mockStashShares = [...mockStashShares, share];
    return { ok: true, data: share };
  }
  try {
    const { data } = await requestJson<{
      id: string;
      token: string;
      permission: 'READ' | 'DOWNLOAD';
      expiresAt: string | null;
    }>(`/api/me/stash/${encodeURIComponent(id)}/share`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return {
      ok: true,
      data: {
        ...data,
        granteeUsername: input.granteeUsername ?? null,
        fileCount: 1,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Share creation failed',
    };
  }
}

export async function revokeStashShare(
  shareId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockStashShares = mockStashShares.filter((share) => share.id !== shareId);
    return { ok: true };
  }
  try {
    await requestJson<void>(
      `/api/me/stash/shares/${encodeURIComponent(shareId)}`,
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
