import { i18n } from '@tahti-player/i18n';

import {
  imageUploadTypeError,
  resolveImageUploadContentType,
} from '../lib/imageUploadContentType';
import { apiBase } from './http';
import { isForceMock, withMockFallback, type FetchMeta } from './mode';

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
    ) {
      return (body as { error: string }).error;
    }
  } catch {
    /* ignore non-JSON error bodies */
  }
  return fallback;
}

export type UserMediaFile = {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
};

let mockMedia: UserMediaFile[] = [];

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `${path} → ${response.status}`),
    );
  }
  return (await response.json()) as T;
}

export async function fetchUserMedia(): Promise<{
  data: UserMediaFile[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [...mockMedia], meta: { source: 'mock' } };
  }
  try {
    const data = await requestJson<{ files: UserMediaFile[] }>('/api/me/media');
    return { data: data.files ?? [], meta: { source: 'api' } };
  } catch (error) {
    return withMockFallback(
      error,
      () => [...mockMedia],
      () => [],
    );
  }
}

export async function uploadUserMediaFile(
  file: File,
): Promise<{ ok: true; data: UserMediaFile } | { ok: false; error: string }> {
  if (isForceMock()) {
    const contentType = resolveImageUploadContentType(file);
    if (!contentType) {
      return { ok: false, error: imageUploadTypeError(file) };
    }
    const data: UserMediaFile = {
      id: `media-${Date.now()}-${file.name}`,
      filename: file.name,
      contentType,
      sizeBytes: file.size,
      url: URL.createObjectURL(file),
      createdAt: new Date().toISOString(),
    };
    mockMedia = [data, ...mockMedia];
    return { ok: true, data };
  }
  const contentType = resolveImageUploadContentType(file);
  if (!contentType) {
    return { ok: false, error: imageUploadTypeError(file) };
  }
  try {
    const prepared = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>('/api/me/media/prepare', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType }),
    });
    const upload = await fetch(prepared.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    if (!upload.ok) {
      throw new Error(
        await readErrorMessage(upload, `Upload failed (${upload.status})`),
      );
    }
    const data = await requestJson<UserMediaFile>('/api/me/media/complete', {
      method: 'POST',
      body: JSON.stringify({
        uploadKey: prepared.uploadKey,
        filename: file.name,
        contentType,
        sizeBytes: file.size,
      }),
    });
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : i18n.t('web:batch53.mediaUploadFailed'),
    };
  }
}

export async function deleteUserMedia(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockMedia = mockMedia.filter((file) => file.id !== id);
    return { ok: true };
  }
  try {
    await requestJson<void>(`/api/me/media/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : i18n.t('web:batch53.mediaDeletionFailed'),
    };
  }
}

export type UnusedMedia = { count: number; totalBytes: number; ids: string[] };

/** Uploads nothing you own still points at (`GET /api/me/media/unused`). */
export async function fetchUnusedMedia(): Promise<
  { ok: true; data: UnusedMedia } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const unused = mockMedia.slice(1);
    return {
      ok: true,
      data: {
        count: unused.length,
        totalBytes: unused.reduce((sum, file) => sum + file.sizeBytes, 0),
        ids: unused.map((file) => file.id),
      },
    };
  }
  try {
    const data = await requestJson<UnusedMedia>('/api/me/media/unused');
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : i18n.t('web:batch53.couldNotCheckMediaUse'),
    };
  }
}

/** Delete every unused upload (`POST /api/me/media/purge-unused`). */
export async function purgeUnusedMedia(): Promise<
  | { ok: true; data: { deleted: number; freedBytes: number } }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    const unused = mockMedia.slice(1);
    mockMedia = mockMedia.slice(0, 1);
    return {
      ok: true,
      data: {
        deleted: unused.length,
        freedBytes: unused.reduce((sum, file) => sum + file.sizeBytes, 0),
      },
    };
  }
  try {
    const data = await requestJson<{ deleted: number; freedBytes: number }>(
      '/api/me/media/purge-unused',
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : i18n.t('web:batch53.couldNotPurgeMedia'),
    };
  }
}
