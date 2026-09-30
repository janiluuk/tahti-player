import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPressKitMeta, patchPressKitBio } from './press-kit';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe('press kit', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the bio from the profile and points at the ZIP', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json({ username: 'night drive', bio: 'Live sets.' }));
    await expect(fetchPressKitMeta()).resolves.toMatchObject({
      data: {
        hasZip: true,
        bioShort: 'Live sets.',
        downloadPath: '/tahti-api/api/v1/u/night%20drive/press-kit.zip',
      },
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe('/tahti-api/api/me/profile');
  });

  it('saves the bio on the profile', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json({ username: 'nd', bio: 'New bio' }));
    await expect(patchPressKitBio('New bio')).resolves.toMatchObject({
      ok: true,
      data: { bioShort: 'New bio' },
    });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/me/profile');
    expect(init!.method).toBe('PATCH');
    expect(JSON.parse(init!.body as string)).toEqual({ bio: 'New bio' });
  });

  it('passes on a failed save', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ error: 'String must contain at most 5000 character(s)' }, 400),
    );
    await expect(patchPressKitBio('x')).resolves.toEqual({
      ok: false,
      error: 'String must contain at most 5000 character(s)',
    });
  });
});
