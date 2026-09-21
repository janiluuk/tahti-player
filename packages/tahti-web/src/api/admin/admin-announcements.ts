import type { FetchMeta } from '../client';
import { getJson, mutate, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── Announcements ───────────────────────────────────────────────────────────

export type AdminAnnouncementScheduleMode =
  'AFTER_EVERY' | 'EVERY_NTH' | 'RANDOM';

export type AdminAnnouncementClip = {
  id: string;
  title: string;
  durationSec: number | null;
  isEnabled: boolean;
  scheduleMode: AdminAnnouncementScheduleMode;
  everyNth: number | null;
  audioUrl?: string | null;
};

let mockAnnouncementClips: AdminAnnouncementClip[] | null = null;
let mockAnnouncementsSystemEnabled = true;

function announcementState(): AdminAnnouncementClip[] {
  if (!mockAnnouncementClips) {
    mockAnnouncementClips = [
      {
        id: 'ann-1',
        title: 'Welcome to Tahti',
        durationSec: 12,
        isEnabled: true,
        scheduleMode: 'AFTER_EVERY',
        everyNth: null,
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
      {
        id: 'ann-2',
        title: 'AGM reminder — October',
        durationSec: 8,
        isEnabled: false,
        scheduleMode: 'EVERY_NTH',
        everyNth: 6,
        audioUrl: null,
      },
    ];
  }
  return mockAnnouncementClips;
}

export async function fetchAdminAnnouncements(): Promise<{
  data: { clips: AdminAnnouncementClip[]; systemEnabled: boolean };
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: {
        clips: announcementState(),
        systemEnabled: mockAnnouncementsSystemEnabled,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{
      clips: AdminAnnouncementClip[];
      systemEnabled: boolean;
    }>('/api/admin/announcements');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { clips: [], systemEnabled: false },
      meta: failMeta(err),
    };
  }
}

export function setAnnouncementsSystemEnabled(enabled: boolean) {
  if (isForceMock()) {
    mockAnnouncementsSystemEnabled = enabled;
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/announcements/system-enabled', 'PATCH', {
    enabled,
  });
}

export async function patchAnnouncementClip(
  id: string,
  patch: Partial<
    Pick<AdminAnnouncementClip, 'isEnabled' | 'scheduleMode' | 'everyNth'>
  >,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const clip = announcementState().find((c) => c.id === id);
    if (clip) {
      Object.assign(clip, patch);
    }
    return { ok: true };
  }
  return mutate(
    `/api/admin/announcements/${encodeURIComponent(id)}`,
    'PATCH',
    patch,
  );
}

export function deleteAnnouncementClip(id: string) {
  if (isForceMock()) {
    mockAnnouncementClips = announcementState().filter((c) => c.id !== id);
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(`/api/admin/announcements/${encodeURIComponent(id)}`, 'DELETE');
}

export async function uploadAnnouncementClip(
  file: File,
): Promise<
  { ok: true; clip: AdminAnnouncementClip } | { ok: false; error: string }
> {
  const title = file.name.replace(/\.[^.]+$/, '');
  if (isForceMock()) {
    const clip: AdminAnnouncementClip = {
      id: `ann-${Date.now()}`,
      title,
      durationSec: null,
      isEnabled: true,
      scheduleMode: 'AFTER_EVERY',
      everyNth: null,
      audioUrl: null,
    };
    announcementState().unshift(clip);
    return { ok: true, clip };
  }
  try {
    const prep = await sendJson<{ objectKey: string; uploadUrl: string }>(
      '/api/admin/announcements/prepare',
      'POST',
      { filename: file.name, contentType: file.type, sizeBytes: file.size },
    );
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!put.ok) {
      return { ok: false, error: `Upload failed (${put.status})` };
    }
    const clip = await sendJson<AdminAnnouncementClip>(
      '/api/admin/announcements',
      'POST',
      { objectKey: prep.objectKey, title },
    );
    return { ok: true, clip };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}
