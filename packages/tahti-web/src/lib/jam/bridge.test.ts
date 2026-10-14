import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../../api/types';
import { usePlayerStore } from '../../stores/playerStore';
import { dispatchJam, watchJamState } from './bridge';

vi.mock('../../api/listen', () => ({
  fetchSearch: vi.fn(async () => ({
    data: {
      tracks: [
        {
          id: 't1',
          title: 'Found',
          artistName: 'Someone',
          channelSlug: 'someone',
          durationSec: 90,
          coverUrl: 'https://cdn.test/found.jpg',
        },
      ],
      artists: [],
      collections: [],
    },
    meta: { source: 'api' },
  })),
}));

vi.mock('../../api/client', () => ({
  fetchTrackDetail: vi.fn(async (id: string) => ({
    data: id === 'missing' ? null : { id },
    meta: { source: 'api' },
  })),
}));

vi.mock('../../views/track-detail/helpers', () => ({
  playableFromDetail: (id: string): TahtiPlayable => ({
    id,
    kind: 'sound',
    title: `Track ${id}`,
    artist: 'Someone',
    streamUrl: `https://cdn.test/${id}.mp3`,
    protocol: 'https',
  }),
}));

const local = (name: string): TahtiPlayable => ({
  id: `local:${name}`,
  kind: 'sound',
  title: name,
  artist: 'Artist',
  streamUrl: `asset://localhost/home/me/Music/${name}.flac`,
  protocol: 'https',
  sourceProvider: 'local',
  coverUrl: `asset://localhost/covers/${name}.jpg`,
  durationSec: 60,
});

const titles = () =>
  usePlayerStore.getState().queue.map((item) => item.track.title);

beforeEach(() => {
  usePlayerStore.getState().clearQueue();
  usePlayerStore.setState({ isLive: false, shuffle: false, repeatMode: 'off' });
});

describe('dispatchJam', () => {
  it('gives phones the queue without file paths, stream URLs or local artwork', async () => {
    usePlayerStore
      .getState()
      .play(local('One'), { enqueueRest: [local('Two')] });
    const queue = (await dispatchJam('Jam.Queue.getQueue', {})) as {
      items: { track: Record<string, unknown> }[];
      currentIndex: number;
    };
    expect(queue.currentIndex).toBe(0);
    expect(queue.items.map((item) => item.track.title)).toEqual(['One', 'Two']);
    const sent = JSON.stringify(queue);
    expect(sent).not.toContain('/home/me/Music');
    expect(sent).not.toContain('asset://');
    expect(queue.items[0]!.track).not.toHaveProperty('album.title', 'local');
  });

  it('reports playback and settings', async () => {
    usePlayerStore.getState().play(local('One'));
    usePlayerStore.setState({
      status: 'paused',
      currentTime: 12,
      duration: 60,
    });
    expect(await dispatchJam('Jam.Playback.getState', {})).toMatchObject({
      status: 'paused',
      seek: 12,
      duration: 60,
    });
    await dispatchJam('Jam.Playback.setShuffleEnabled', { enabled: true });
    await dispatchJam('Jam.Playback.setRepeatMode', { mode: 'all' });
    expect(await dispatchJam('Jam.Settings.get', {})).toEqual({
      shuffle: true,
      repeat: 'all',
    });
  });

  it('toggles, plays queue items and removes them', async () => {
    usePlayerStore
      .getState()
      .play(local('One'), { enqueueRest: [local('Two'), local('Three')] });
    usePlayerStore.setState({ status: 'playing' });
    await dispatchJam('Jam.Playback.toggle', {});
    expect(usePlayerStore.getState().status).toBe('paused');
    const second = usePlayerStore.getState().queue[1]!.id;
    await dispatchJam('Jam.Queue.playItem', { id: second });
    expect(usePlayerStore.getState().currentId).toBe(second);
    await dispatchJam('Jam.Queue.removeByIds', { ids: [second] });
    expect(titles()).toEqual(['One', 'Three']);
  });

  it('says what was wrong with a bad request', async () => {
    await expect(
      dispatchJam('Jam.Playback.setRepeatMode', { mode: 'twice' }),
    ).rejects.toThrow('mode must be off, all or one.');
    await expect(
      dispatchJam('Jam.Queue.playItem', { id: 'nope' }),
    ).rejects.toThrow('No queue item has the id nope.');
    await expect(dispatchJam('Jam.Nope', {})).rejects.toThrow(
      'Unknown Tahti Jam method Jam.Nope.',
    );
  });

  it('searches Tahti tracks and adds a result, starting playback on an empty queue', async () => {
    const result = (await dispatchJam('Jam.search', { query: 'found' })) as {
      tracks: { title: string; source: { provider: string; id: string } }[];
    };
    expect(result.tracks).toEqual([
      expect.objectContaining({
        title: 'Found',
        source: { provider: 'tahti', id: 't1' },
      }),
    ]);
    await dispatchJam('Jam.Queue.addToQueue', { tracks: result.tracks });
    expect(titles()).toEqual(['Track t1']);
    expect(usePlayerStore.getState().currentId).not.toBeNull();
  });

  it('refuses tracks that did not come from Tahti search', async () => {
    await expect(
      dispatchJam('Jam.Queue.addToQueue', {
        tracks: [
          { title: 'x', source: { provider: 'local', id: '/etc/passwd' } },
        ],
      }),
    ).rejects.toThrow('Only Tahti tracks from /api/search can be added.');
    await expect(
      dispatchJam('Jam.Queue.addToQueue', {
        tracks: [{ title: 'x', source: { provider: 'tahti', id: 'missing' } }],
      }),
    ).rejects.toThrow("Track missing isn't available.");
  });
});

describe('watchJamState', () => {
  it('sends each kind of state when it changes, and progress at most once a second', () => {
    const send = vi.fn();
    const stop = watchJamState(send);
    usePlayerStore.getState().play(local('One'));
    const kinds = () => send.mock.calls.map(([kind]) => kind);
    expect(kinds()).toContain('queue');
    expect(kinds()).toContain('playback');
    send.mockClear();
    usePlayerStore.getState().setProgress(0.4, 60);
    usePlayerStore.getState().setProgress(0.8, 60);
    expect(kinds().filter((kind) => kind === 'playback')).toHaveLength(1);
    send.mockClear();
    usePlayerStore.getState().setProgress(1.5, 60);
    expect(kinds()).toEqual(['playback']);
    send.mockClear();
    usePlayerStore.getState().setRepeatMode('one');
    expect(kinds()).toEqual(['settings']);
    stop();
  });
});
