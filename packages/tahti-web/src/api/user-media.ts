import {
  imageUploadTypeError,
  resolveImageUploadContentType,
} from '../lib/imageUploadContentType';
import type { FetchMeta } from './client';
import { apiBase } from './http';

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
  if (import.meta.env.VITE_FORCE_MOCK === '1') {
    return { data: [...mockMedia], meta: { source: 'mock' } };
  }
  try {
    const data = await requestJson<{ files: UserMediaFile[] }>('/api/me/media');
    return { data: data.files ?? [], meta: { source: 'api' } };
  } catch (error) {
    return {
      data: [],
      meta: {
        source: 'mock',
        reason: error instanceof Error ? error.message : 'Media unavailable',
      },
    };
  }
}

export async function uploadUserMediaFile(
  file: File,
): Promise<{ ok: true; data: UserMediaFile } | { ok: false; error: string }> {
  if (import.meta.env.VITE_FORCE_MOCK === '1') {
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
      error: error instanceof Error ? error.message : 'Media upload failed',
    };
  }
}

export async function deleteUserMedia(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (import.meta.env.VITE_FORCE_MOCK === '1') {
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
      error: error instanceof Error ? error.message : 'Media deletion failed',
    };
  }
}
