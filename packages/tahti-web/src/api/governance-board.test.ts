import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchCurrentBoard } from './governance-board';

describe('fetchCurrentBoard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the board from the governance API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchCurrentBoard()).resolves.toEqual({
      data: [],
      meta: { source: 'api' },
    });
    expect(String(fetchMock.mock.calls[0]![0])).toContain(
      '/api/v1/governance/board',
    );
  });

  it('returns an empty board with the reason when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Members only' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const result = await fetchCurrentBoard();
    expect(result.data).toEqual([]);
    expect(result.meta.reason).toBeTruthy();
  });
});
