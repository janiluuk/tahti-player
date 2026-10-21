// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchBroadcastPreflight,
  patchBroadcastPreflight,
  postEndBroadcast,
  postGoLive,
} from './broadcast';
import { seedSeries } from './shows/mock';
import { createShowSeries, fetchEpisodesForShow } from './shows/series';

describe('mock broadcast preflight with a series', () => {
  beforeEach(async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    localStorage.clear();
    await postEndBroadcast();
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

  it('creates a live episode on go live and parks it when the show ends', async () => {
    const series = seedSeries()[2]!;
    const before = (await fetchEpisodesForShow(series.id)).data.length;
    await patchBroadcastPreflight({
      title: 'Cypher night',
      seriesId: series.id,
    });

    expect(await postGoLive()).toEqual({ ok: true });
    const live = (await fetchEpisodesForShow(series.id)).data;
    expect(live).toHaveLength(before + 1);
    expect(live[0]).toMatchObject({
      title: 'Cypher night',
      status: 'LIVE',
      source: 'broadcast',
      episodeNumber: series.nextEpisodeNumber,
    });

    await postGoLive();
    expect((await fetchEpisodesForShow(series.id)).data).toHaveLength(
      before + 1,
    );

    expect(await postEndBroadcast()).toEqual({ ok: true });
    const ended = (await fetchEpisodesForShow(series.id)).data;
    expect(ended[0]!.status).toBe('PENDING_APPROVAL');
    const preflight = (await fetchBroadcastPreflight()).data;
    expect(preflight?.plannedLiveShow).toBeNull();
  });

  it('does not create an episode for a one-off broadcast', async () => {
    const series = seedSeries()[3]!;
    const before = (await fetchEpisodesForShow(series.id)).data.length;
    await postGoLive();
    expect((await fetchEpisodesForShow(series.id)).data).toHaveLength(before);
    await postEndBroadcast();
  });

  it('can preselect a series right after it is created', async () => {
    const created = await createShowSeries({
      title: 'Fresh weekly show',
      mode: 'SERIES',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const result = await patchBroadcastPreflight({ seriesId: created.data.id });
    if ('error' in result) {
      throw new Error(result.error);
    }
    expect(result.data.plannedLiveShow?.seriesId).toBe(created.data.id);
  });
});
