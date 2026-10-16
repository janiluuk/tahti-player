// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchBroadcastPreflight, patchBroadcastPreflight } from './broadcast';
import { seedSeries } from './shows/mock';

describe('mock broadcast preflight with a series', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('plans the next episode of the picked series', async () => {
    const series = seedSeries()[0]!;
    const result = await patchBroadcastPreflight({
      title: 'Friday set',
      seriesId: series.id,
    });
    if ('error' in result) {
      throw new Error(result.error);
    }
    expect(result.data.plannedLiveShow).toEqual({
      seriesId: series.id,
      episodeNumber: series.nextEpisodeNumber,
    });
    expect(result.data.episodeNumber).toBe(series.nextEpisodeNumber);
    expect(result.data.title).toBe('Friday set');
    expect(result.data).not.toHaveProperty('seriesId');

    const reloaded = await fetchBroadcastPreflight();
    expect(reloaded.data?.plannedLiveShow?.seriesId).toBe(series.id);
  });

  it('names the episode after the series when no title is set', async () => {
    const series = seedSeries()[1]!;
    const result = await patchBroadcastPreflight({
      title: null,
      seriesId: series.id,
    });
    if ('error' in result) {
      throw new Error(result.error);
    }
    expect(result.data.title).toBe(
      `${series.title} — Episode ${series.nextEpisodeNumber}`,
    );
  });

  it('rejects a series that does not exist', async () => {
    const result = await patchBroadcastPreflight({ seriesId: 'missing' });
    expect(result).toEqual({ error: 'Show not found' });
  });
});
