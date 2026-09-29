import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchAdminAnnouncements,
  setAnnouncementsSystemEnabled,
  uploadAnnouncementClip,
} from './admin-announcements';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('admin announcements API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the clips and the global switch from their own routes', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) =>
        String(input).endsWith('/settings')
          ? json({ systemEnabled: false })
          : json({ clips: [{ id: 'a1', title: 'Hello' }] }),
      );

    const result = await fetchAdminAnnouncements();

    expect(result.meta.source).toBe('api');
    expect(result.data.systemEnabled).toBe(false);
    expect(result.data.clips.map((clip) => clip.id)).toEqual(['a1']);
    expect(fetchSpy.mock.calls.map(([url]) => String(url)).sort()).toEqual([
      '/tahti-api/api/admin/announcements',
      '/tahti-api/api/admin/announcements/settings',
    ]);
  });

  it('patches the settings route to switch announcements on or off', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json({ systemEnabled: true }));

    await expect(setAnnouncementsSystemEnabled(true)).resolves.toMatchObject({
      ok: true,
    });

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/admin/announcements/settings');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({ systemEnabled: true });
  });

  it('prepares, uploads and completes a clip with the upload id', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) => {
        const url = String(input);
        if (url.endsWith('/prepare')) {
          return json({
            uploadId: 'announcements/system/abc.mp3',
            uploadUrl: 'https://s3.example/put',
            expiresAt: '2026-09-29T00:00:00.000Z',
          });
        }
        if (url === 'https://s3.example/put') {
          return new Response(null, { status: 200 });
        }
        return json({ id: 'a2', title: 'Station ID' }, 201);
      });

    const file = new File(['x'], 'Station ID.mp3', { type: 'audio/mpeg' });
    await expect(uploadAnnouncementClip(file)).resolves.toMatchObject({
      ok: true,
      clip: { id: 'a2' },
    });

    const calls = fetchSpy.mock.calls.map(([url, init]) => ({
      url: String(url),
      body: init?.body instanceof File ? 'file' : init?.body,
    }));
    expect(calls[0]!.url).toBe('/tahti-api/api/admin/announcements/prepare');
    expect(JSON.parse(String(calls[0]!.body))).toEqual({
      filename: 'Station ID.mp3',
      contentType: 'audio/mpeg',
      fileSizeBytes: 1,
      title: 'Station ID',
    });
    expect(calls[1]).toEqual({ url: 'https://s3.example/put', body: 'file' });
    expect(calls[2]!.url).toBe('/tahti-api/api/admin/announcements/complete');
    expect(JSON.parse(String(calls[2]!.body))).toEqual({
      uploadId: 'announcements/system/abc.mp3',
      title: 'Station ID',
    });
  });
});
