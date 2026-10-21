import { afterEach, describe, expect, it, vi } from 'vitest';

import { firstFramePng } from '../../lib/gifPoster';
import { removeProfileAvatar, uploadProfileAvatar } from './avatar';

vi.mock('../../lib/gifPoster', () => ({ firstFramePng: vi.fn() }));

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 });

/** Answers prepare / PUT / complete in order, numbering the upload keys. */
function mockUploadApi(complete: unknown) {
  let prepared = 0;
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith('/avatar/prepare')) {
      prepared += 1;
      return json({
        uploadKey: `avatars/sel/avatar-${prepared}`,
        uploadUrl: `https://minio.example/put-${prepared}`,
      });
    }
    if (url.startsWith('https://minio.example/')) {
      return new Response(null, { status: 200 });
    }
    return json(complete);
  });
}

const bodyOf = (call: unknown[]) =>
  JSON.parse((call[1] as RequestInit).body as string) as unknown;

describe('uploadProfileAvatar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(firstFramePng).mockReset();
  });

  it('uploads a GIF with a first-frame poster', async () => {
    const poster = new Blob(['png'], { type: 'image/png' });
    vi.mocked(firstFramePng).mockResolvedValue(poster);
    const fetchSpy = mockUploadApi({
      avatarUrl: 'https://cdn/a.gif',
      avatarPosterUrl: 'https://cdn/a.png',
    });
    const file = new File(['gif'], 'loop.gif', { type: 'image/gif' });

    await expect(uploadProfileAvatar(file)).resolves.toEqual({
      ok: true,
      avatarUrl: 'https://cdn/a.gif',
      avatarPosterUrl: 'https://cdn/a.png',
    });

    const calls = fetchSpy.mock.calls;
    expect(bodyOf(calls[0]!)).toEqual({
      filename: 'loop.gif',
      contentType: 'image/gif',
    });
    expect(calls[1]![1]!.body).toBe(file);
    expect(bodyOf(calls[2]!)).toEqual({
      filename: 'poster.png',
      contentType: 'image/png',
    });
    expect(calls[3]![1]!.body).toBe(poster);
    expect(String(calls[4]![0])).toBe(
      '/tahti-api/api/me/profile/avatar/complete',
    );
    expect(bodyOf(calls[4]!)).toEqual({
      uploadKey: 'avatars/sel/avatar-1',
      posterUploadKey: 'avatars/sel/avatar-2',
    });
  });

  it('uploads a still image without a poster', async () => {
    const fetchSpy = mockUploadApi({
      avatarUrl: 'https://cdn/a.jpg',
      avatarPosterUrl: null,
    });
    const file = new File(['jpg'], 'me.jpg', { type: 'image/jpeg' });

    await expect(uploadProfileAvatar(file)).resolves.toEqual({
      ok: true,
      avatarUrl: 'https://cdn/a.jpg',
      avatarPosterUrl: null,
    });
    expect(firstFramePng).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(bodyOf(fetchSpy.mock.calls[2]!)).toEqual({
      uploadKey: 'avatars/sel/avatar-1',
    });
  });

  it('refuses a GIF whose first frame cannot be read', async () => {
    vi.mocked(firstFramePng).mockRejectedValue(new Error('decode'));
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const file = new File(['gif'], 'loop.gif', { type: 'image/gif' });

    await expect(uploadProfileAvatar(file)).resolves.toEqual({
      ok: false,
      error: 'Could not read the first frame of that GIF',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refuses other image types', async () => {
    const file = new File(['svg'], 'logo.svg', { type: 'image/svg+xml' });
    await expect(uploadProfileAvatar(file)).resolves.toEqual({
      ok: false,
      error: 'Use JPEG, PNG, WebP, or GIF',
    });
  });
});

describe('removeProfileAvatar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clears the poster along with the picture', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({}));
    await expect(removeProfileAvatar()).resolves.toEqual({ ok: true });
    expect(bodyOf(fetchSpy.mock.calls[0]!)).toEqual({
      avatarUrl: '',
      avatarPosterUrl: null,
    });
  });
});
