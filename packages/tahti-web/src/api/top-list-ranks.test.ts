import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchTopListRanks } from './top-list-ranks';

describe('fetchTopListRanks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('looks up the ranks of distinct ids in one request', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ranks: { a: 3 } }), { status: 200 }),
      );
    await expect(fetchTopListRanks(['a', 'b', 'a', ''])).resolves.toEqual({
      a: 3,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/top-lists/ranks?ids=a,b',
    );
  });

  it('skips the request with no ids and is empty on failure', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 500 }));
    await expect(fetchTopListRanks([])).resolves.toEqual({});
    expect(fetchSpy).not.toHaveBeenCalled();
    await expect(fetchTopListRanks(['a'])).resolves.toEqual({});
  });
});
