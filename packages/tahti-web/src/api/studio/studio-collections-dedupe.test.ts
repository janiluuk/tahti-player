import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchStudioCollections } from './studio-collections';

describe('fetchStudioCollections', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends one request for callers that ask at the same time', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(JSON.stringify([{ slug: 'a', name: 'A' }]), {
          status: 200,
        }),
    );

    const results = await Promise.all(
      Array.from({ length: 8 }, () => fetchStudioCollections()),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r.data[0]?.slug === 'a')).toBe(true);
    results[0]!.data[0]!.name = 'changed';
    expect(results[1]!.data[0]!.name).toBe('A');
  });

  it('asks again once the earlier request has settled', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('[]', { status: 200 }));

    await fetchStudioCollections();
    await fetchStudioCollections();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
