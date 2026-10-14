import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../../api/types';
import { usePlayerStore } from '../../stores/playerStore';
import { dispatchMpd, watchMpdSubsystems } from './bridge';

const track = (name: string): TahtiPlayable => ({
  id: `local:${name}`,
  kind: 'sound',
  title: name,
  artist: 'Artist',
  streamUrl: `asset://${name}`,
  protocol: 'https',
  sourceProvider: 'local',
  durationSec: 60,
});

const titles = () =>
  usePlayerStore.getState().queue.map((item) => item.track.title);

function loadQueue(...names: string[]) {
  const [first, ...rest] = names.map(track);
  usePlayerStore.getState().play(first!, { enqueueRest: rest });
}

beforeEach(() => {
  usePlayerStore.getState().clearQueue();
});

describe('dispatchMpd', () => {
  it('reports the queue in the shape the MPD server reads', async () => {
    loadQueue('One', 'Two');
    const queue = (await dispatchMpd('Mpd.Queue.getQueue', {})) as {
      items: { track: { title: string; artists: { name: string }[] } }[];
      currentIndex: number;
    };
    expect(queue.currentIndex).toBe(0);
    expect(queue.items.map((item) => item.track.title)).toEqual(['One', 'Two']);
    expect(queue.items[0]!.track.artists[0]!.name).toBe('Artist');
    expect(queue.items[0]!.track).not.toHaveProperty('album.title', 'local');
  });

  it('maps the player status to playing, paused or stopped', async () => {
    expect(await dispatchMpd('Mpd.Playback.getState', {})).toMatchObject({
      status: 'stopped',
    });
    loadQueue('One');
    usePlayerStore.getState().setStatus('playing');
    expect(await dispatchMpd('Mpd.Playback.getState', {})).toMatchObject({
      status: 'playing',
    });
    await dispatchMpd('Mpd.Playback.toggle', {});
    expect(usePlayerStore.getState().status).toBe('paused');
    expect(await dispatchMpd('Mpd.Playback.getState', {})).toMatchObject({
      status: 'paused',
    });
  });

  it('plays the first queue item when nothing is current', async () => {
    loadQueue('One', 'Two');
    usePlayerStore.setState({ currentId: null, status: 'idle' });
    await dispatchMpd('Mpd.Playback.play', {});
    expect(usePlayerStore.getState().currentId).toBe(
      usePlayerStore.getState().queue[0]!.id,
    );
  });

  it('jumps to, removes, moves and clears queue items by position', async () => {
    loadQueue('One', 'Two', 'Three');
    await dispatchMpd('Mpd.Queue.goToIndex', { index: 2 });
    expect(
      (
        (await dispatchMpd('Mpd.Queue.getQueue', {})) as {
          currentIndex: number;
        }
      ).currentIndex,
    ).toBe(2);
    await dispatchMpd('Mpd.Queue.reorder', { fromIndex: 0, toIndex: 1 });
    expect(titles()).toEqual(['Two', 'One', 'Three']);
    await dispatchMpd('Mpd.Queue.removeByIndices', { indices: [0, 1] });
    expect(titles()).toEqual(['Three']);
    await dispatchMpd('Mpd.Queue.clearQueue', {});
    expect(titles()).toEqual([]);
  });

  it('refuses a position outside the queue', async () => {
    loadQueue('One');
    await expect(
      dispatchMpd('Mpd.Queue.goToIndex', { index: 4 }),
    ).rejects.toThrow('No queue item at position 4.');
  });

  it('sets volume, shuffle and repeat', async () => {
    await dispatchMpd('Mpd.Playback.setVolume', { volume: 1.4 });
    await dispatchMpd('Mpd.Playback.setShuffleEnabled', { enabled: true });
    await dispatchMpd('Mpd.Playback.setRepeatMode', { mode: 'one' });
    expect(await dispatchMpd('Mpd.Playback.getVolume', {})).toBe(1);
    expect(await dispatchMpd('Mpd.Playback.isShuffleEnabled', {})).toBe(true);
    expect(await dispatchMpd('Mpd.Playback.getRepeatMode', {})).toBe('one');
    await dispatchMpd('Mpd.Playback.setShuffleEnabled', { enabled: false });
    await dispatchMpd('Mpd.Playback.setRepeatMode', { mode: 'off' });
  });

  it('names an unknown method', async () => {
    await expect(dispatchMpd('Mpd.Nope.nope', {})).rejects.toThrow(
      'Unknown MPD bridge method Mpd.Nope.nope.',
    );
  });
});

describe('watchMpdSubsystems', () => {
  it('names the subsystems that changed', () => {
    const notify = vi.fn();
    const stop = watchMpdSubsystems(notify);
    loadQueue('One');
    expect(notify).toHaveBeenCalledWith('player');
    expect(notify).toHaveBeenCalledWith('playlist');
    notify.mockClear();
    usePlayerStore.getState().setVolume(0.3);
    expect(notify.mock.calls).toEqual([['mixer']]);
    notify.mockClear();
    usePlayerStore.getState().setRepeatMode('all');
    expect(notify.mock.calls).toEqual([['options']]);
    notify.mockClear();
    usePlayerStore.getState().setProgress(12, 60);
    expect(notify).not.toHaveBeenCalled();
    stop();
    usePlayerStore.getState().setRepeatMode('off');
    expect(notify).not.toHaveBeenCalled();
  });
});
