import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchArtistPlayables } from './client';

const profile = {
  artist: { username: 'aino', displayName: 'Aino' },
  channel: { slug: 'aino', state: 'OFFLINE' },
  releases: [],
  fanTiers: [],
  collections: [],
  links: {
    channel: null,
    subscribe: '',
    feeds: { sound: null },
    presskit: '',
  },
  tracks: [
    {
      id: 't1',
      title: 'Polar Static',
      playUrl: 'https://cdn.example/t1.mp3',
      peaks: [8, 240, 33],
    },
    {
      id: 't2',
      title: 'No waveform yet',
      playUrl: 'https://cdn.example/t2.mp3',
    },
  ],
};

describe('fetchArtistPlayables', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("carries each profile track's server waveform peaks", async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(profile), { status: 200 }),
    );
    const { data } = await fetchArtistPlayables('aino');
    expect(data.map((item) => [item.id, item.peaks])).toEqual([
      ['sound:t1', [8, 240, 33]],
      ['sound:t2', null],
    ]);
  });
});
