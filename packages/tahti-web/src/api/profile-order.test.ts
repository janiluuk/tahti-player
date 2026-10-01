import { afterEach, describe, expect, it, vi } from 'vitest';

import { reorderPublicTracks } from './profile-order';

describe('reorderPublicTracks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PUTs the ids in order', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);
    expect(await reorderPublicTracks(['b', 'a'])).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/tahti-api/api/me/sound/reorder',
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ ids: ['b', 'a'] }),
    });
  });
});
