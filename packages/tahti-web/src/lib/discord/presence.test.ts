import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../../api/types';
import { usePlayerStore } from '../../stores/playerStore';
import {
  currentPresence,
  initDesktopDiscord,
  useDesktopDiscordStore,
} from './presence';

const track = (name: string, coverUrl?: string): TahtiPlayable => ({
  id: `local:${name}`,
  kind: 'sound',
  title: name,
  artist: 'Artist',
  streamUrl: `asset://${name}`,
  protocol: 'https',
  sourceProvider: 'local',
  durationSec: 200,
  coverUrl,
});

const NOW = 1_000_000_000;

beforeEach(() => {
  usePlayerStore.getState().clearQueue();
  usePlayerStore.setState({ isLive: false });
});

describe('currentPresence', () => {
  it('shows nothing when nothing is playing', () => {
    expect(currentPresence(NOW)).toBeNull();
  });

  it('shows the track with start and end times while it plays', () => {
    usePlayerStore.getState().play(track('One', 'https://cdn.test/one.jpg'));
    usePlayerStore.setState({
      status: 'playing',
      currentTime: 50,
      duration: 200,
      isLive: false,
    });
    expect(currentPresence(NOW)).toEqual({
      title: 'One',
      artist: 'Artist',
      album: null,
      artworkUrl: 'https://cdn.test/one.jpg',
      startTimestamp: NOW / 1000 - 50,
      endTimestamp: NOW / 1000 + 150,
    });
  });

  it('drops the times while paused and the end time for live streams', () => {
    usePlayerStore.getState().play(track('One'));
    usePlayerStore.setState({ status: 'paused', currentTime: 50 });
    expect(currentPresence(NOW)).toMatchObject({
      startTimestamp: null,
      endTimestamp: null,
    });
    usePlayerStore.setState({ status: 'playing', isLive: true, duration: 0 });
    expect(currentPresence(NOW)).toMatchObject({ endTimestamp: null });
  });

  it('leaves out artwork Discord cannot fetch', () => {
    usePlayerStore.getState().play(track('One', 'asset://local/one.jpg'));
    usePlayerStore.setState({ status: 'playing' });
    expect(currentPresence(NOW)?.artworkUrl).toBeNull();
  });
});

describe('initDesktopDiscord', () => {
  it('sets the activity on a track change and clears it when the queue empties', async () => {
    const setActivity = vi.fn(async () => false);
    const clearActivity = vi.fn(async () => {});
    globalThis.__TAHTI_NATIVE_DISCORD__ = {
      start: async () => {},
      stop: async () => {},
      setActivity,
      clearActivity,
    };
    useDesktopDiscordStore.setState({ enabled: true });
    vi.useFakeTimers();
    try {
      await initDesktopDiscord();
      usePlayerStore.getState().play(track('One'));
      usePlayerStore.setState({ status: 'playing' });
      expect(setActivity).toHaveBeenLastCalledWith(
        expect.objectContaining({ title: 'One' }),
      );
      usePlayerStore.getState().clearQueue();
      expect(clearActivity).toHaveBeenCalled();
      useDesktopDiscordStore.setState({ enabled: false });
      setActivity.mockClear();
      usePlayerStore.getState().play(track('Two'));
      usePlayerStore.setState({ status: 'playing' });
      expect(setActivity).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
      globalThis.__TAHTI_NATIVE_DISCORD__ = undefined;
    }
  });
});
