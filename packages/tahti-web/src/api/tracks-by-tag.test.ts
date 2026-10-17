import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchTracksByTag } from './listen';

const track = {
  id: 's1',
  title: 'Midnight Drone',
  artistName: 'Aino',
  channelSlug: 'aino',
  durationSec: 300,
  coverUrl: null,
};

describe('fetchTracksByTag', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('asks the search route for tracks with the trimmed tag', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ tracks: [track], artists: [], collections: [] }),
          { status: 200 },
        ),
      );

    const result = await fetchTracksByTag('  late night ');

    const url = String(fetchSpy.mock.calls[0]?.[0]);
    expect(url).toContain('/api/v1/search?tag=late%20night&type=tracks');
    expect(url).not.toContain('q=');
    expect(result).toEqual({ ok: true, tracks: [track] });
  });

  it('reports an error instead of mocking when the API rejects the tag filter', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Required' }), { status: 400 }),
    );

    const result = await fetchTracksByTag('drone');

    expect(result.ok).toBe(false);
  });

  it('skips the request for a blank tag', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await fetchTracksByTag('  ')).toEqual({ ok: true, tracks: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns mock latest/search tracks that match the tag offline', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const byGenre = await fetchTracksByTag('Ambient');
    expect(byGenre.ok).toBe(true);
    if (!byGenre.ok) {
      return;
    }
    expect(byGenre.tracks.length).toBeGreaterThan(0);
    expect(
      byGenre.tracks.every((row) => row.channelSlug === 'northern-lights'),
    ).toBe(true);

    const byTitle = await fetchTracksByTag('aurora');
    expect(byTitle.ok).toBe(true);
    if (!byTitle.ok) {
      return;
    }
    expect(byTitle.tracks.some((row) => /aurora/i.test(row.title))).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
