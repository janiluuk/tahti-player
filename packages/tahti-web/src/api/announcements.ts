import type { FetchMeta } from './client';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

export type AnnouncementClip = {
  id: string;
  title: string;
  durationSec: number | null;
  isEnabled: boolean;
  renderStatus: 'READY' | 'PROCESSING' | 'ERROR';
  isProfileBackground?: boolean;
  contentType: 'CLIP';
};

export type PinnedAnnouncement = {
  id: string;
  body: string;
  createdAt: string;
};

const mockClips: AnnouncementClip[] = [
  {
    id: 'announcement-demo',
    title: 'Station ident',
    durationSec: 8,
    isEnabled: true,
    renderStatus: 'READY',
    isProfileBackground: false,
    contentType: 'CLIP',
  },
];

const mockPinnedAnnouncements: PinnedAnnouncement[] = [];

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
    throw new Error(`${path} → ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export async function fetchPinnedAnnouncements(
  slug: string,
): Promise<PinnedAnnouncement[]> {
  if (isForceMock()) {
    return [...mockPinnedAnnouncements];
  }
  try {
    return await requestJson<PinnedAnnouncement[]>(
      `/api/chat/${encodeURIComponent(slug)}/announcements`,
    );
  } catch {
    return [];
  }
}

export async function postPinnedAnnouncement(
  body: string,
): Promise<
  { ok: true; announcement: PinnedAnnouncement } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const announcement = {
      id: `announcement-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
    };
    mockPinnedAnnouncements.unshift(announcement);
    mockPinnedAnnouncements.splice(3);
    return { ok: true, announcement };
  }
  try {
    const announcement = await requestJson<PinnedAnnouncement>(
      '/api/me/chat/announcements',
      {
        method: 'POST',
        body: JSON.stringify({ body }),
      },
    );
    return { ok: true, announcement };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not publish announcement',
    };
  }
}

export async function deletePinnedAnnouncement(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const index = mockPinnedAnnouncements.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockPinnedAnnouncements.splice(index, 1);
    }
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/chat/announcements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not delete announcement',
    };
  }
}

export async function fetchAnnouncementClips(): Promise<{
  data: AnnouncementClip[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...mockClips],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await requestJson<{ clips: AnnouncementClip[] }>(
      '/api/me/announcements',
    );
    return { data: data.clips, meta: { source: 'api' } };
  } catch (error) {
    if (allowMockFallback()) {
      return { data: [...mockClips], meta: failMeta(error) };
    }
    return { data: [], meta: apiErrorMeta(error) };
  }
}

export async function uploadAnnouncementClip(file: File): Promise<
  | {
      ok: true;
      clip: AnnouncementClip;
    }
  | { ok: false; error: string }
> {
  const title = file.name.replace(/\.[^.]+$/, '').trim() || 'Announcement';
  if (isForceMock()) {
    const clip: AnnouncementClip = {
      id: `announcement-${Date.now()}`,
      title,
      durationSec: null,
      isEnabled: true,
      renderStatus: 'READY',
      isProfileBackground: false,
      contentType: 'CLIP',
    };
    mockClips.unshift(clip);
    return { ok: true, clip };
  }
  try {
    const prepared = await requestJson<{ uploadId: string; uploadUrl: string }>(
      '/api/me/announcements/prepare',
      {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'audio/mpeg',
          fileSizeBytes: file.size,
          title,
        }),
      },
    );
    const uploadResponse = await fetch(prepared.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'audio/mpeg' },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error('Audio upload failed');
    }
    const clip = await requestJson<AnnouncementClip>(
      '/api/me/announcements/complete',
      {
        method: 'POST',
        body: JSON.stringify({
          uploadId: prepared.uploadId,
          title,
          contentType: 'CLIP',
        }),
      },
    );
    return { ok: true, clip };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not upload announcement',
    };
  }
}

export async function patchAnnouncementClip(
  id: string,
  patch: { isEnabled?: boolean; title?: string },
): Promise<
  { ok: true; clip: AnnouncementClip } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const clip = mockClips.find((item) => item.id === id);
    if (!clip) {
      return { ok: false, error: 'Announcement not found' };
    }
    Object.assign(clip, patch);
    return { ok: true, clip: { ...clip } };
  }
  try {
    const clip = await requestJson<AnnouncementClip>(
      `/api/me/announcements/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, clip };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not update announcement',
    };
  }
}

export async function deleteAnnouncementClip(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const index = mockClips.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockClips.splice(index, 1);
    }
    return { ok: true };
  }
  try {
    await requestJson<void>(`/api/me/announcements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not delete announcement',
    };
  }
}

export async function setProfileBackgroundClip(
  clipId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson('/api/me/channel/profile-background', {
      method: 'PATCH',
      body: JSON.stringify({ clipId }),
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : 'Could not update page music',
    };
  }
}

export async function fetchAnnouncementPreview(id: string): Promise<
  | {
      ok: true;
      url: string;
    }
  | { ok: false; error: string }
> {
  try {
    const source = await requestJson<{ url: string }>(
      `/api/me/announcements/${encodeURIComponent(id)}/editor/source`,
    );
    return { ok: true, url: source.url };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not load preview',
    };
  }
}
