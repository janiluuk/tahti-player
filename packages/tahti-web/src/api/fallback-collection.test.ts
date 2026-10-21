import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchFallbackCollections,
  setFallbackCollection,
} from './fallback-collection';

describe('fallback collection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the owner's collections", async () => {
    const rows = [
      { id: 'c1', slug: 'a', name: 'A', trackCount: 3, active: true },
    ];
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(rows), { status: 200 }));
    await expect(
      fetchFallbackCollections('night-drive'),
    ).resolves.toMatchObject({
      data: rows,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/channels/night-drive/fallback-collections',
    );
  });

  it('switches the rotation source, or clears it', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    await expect(setFallbackCollection('night-drive', 'c1')).resolves.toEqual({
      ok: true,
    });
    await setFallbackCollection('night-drive', null);
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/channels/night-drive/fallback-collection',
    );
    expect(fetchSpy.mock.calls[0]![1]!.method).toBe('PATCH');
    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toEqual({
      collectionId: 'c1',
    });
    expect(JSON.parse(fetchSpy.mock.calls[1]![1]!.body as string)).toEqual({
      collectionId: null,
    });
  });
});
