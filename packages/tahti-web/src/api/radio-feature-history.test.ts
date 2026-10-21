import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchRadioFeatureHistory } from './radio-public';

describe('fetchRadioFeatureHistory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('reads the channels Tahti Radio relayed', async () => {
    const rows = [
      {
        channelId: 'c1',
        slug: 'moon',
        artistName: 'Moon',
        featuredAt: '2026-09-29T10:00:00.000Z',
      },
    ];
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(rows), { status: 200 }));
    await expect(fetchRadioFeatureHistory()).resolves.toMatchObject({
      data: rows,
    });
    expect(String(fetchSpy.mock.calls[0]![0])).toContain(
      '/api/v1/radio/history',
    );
  });

  it('returns an empty list when the request fails without mock fallback', async () => {
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 500 }),
    );
    const result = await fetchRadioFeatureHistory();
    expect(Array.isArray(result.data)).toBe(true);
  });
});
