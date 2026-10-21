import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { usePlayerStore } from '../stores/playerStore';
import {
  parsePlayerPrefs,
  startPlayerPrefsPersistence,
} from './playerPrefsPersistence';

const KEY = 'tahti-player-prefs-v1';

describe('parsePlayerPrefs', () => {
  it('keeps only valid fields', () => {
    expect(
      parsePlayerPrefs(
        JSON.stringify({
          volume: 2,
          muted: true,
          shuffle: 'yes',
          repeatMode: 'one',
        }),
      ),
    ).toEqual({ muted: true, repeatMode: 'one' });
  });

  it('ignores missing or malformed data', () => {
    expect(parsePlayerPrefs(null)).toEqual({});
    expect(parsePlayerPrefs('{not json')).toEqual({});
    expect(parsePlayerPrefs('42')).toEqual({});
  });
});

describe('startPlayerPrefsPersistence', () => {
  let stop: (() => void) | undefined;
  const initial = usePlayerStore.getState();

  beforeEach(() => {
    localStorage.clear();
    usePlayerStore.setState({
      volume: 0.85,
      muted: false,
      shuffle: false,
      repeatMode: 'off',
    });
  });

  afterEach(() => {
    stop?.();
    usePlayerStore.setState(initial, true);
  });

  it('restores saved prefs on start', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        volume: 0.4,
        muted: true,
        shuffle: true,
        repeatMode: 'all',
      }),
    );
    stop = startPlayerPrefsPersistence();
    const state = usePlayerStore.getState();
    expect(state.volume).toBe(0.4);
    expect(state.muted).toBe(true);
    expect(state.shuffle).toBe(true);
    expect(state.repeatMode).toBe('all');
  });

  it('saves changes and ignores unrelated updates', () => {
    stop = startPlayerPrefsPersistence();
    usePlayerStore.getState().setProgress(10, 100);
    expect(localStorage.getItem(KEY)).toBeNull();
    usePlayerStore.getState().setVolume(0.3);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({
      volume: 0.3,
      muted: false,
      shuffle: false,
      repeatMode: 'off',
    });
  });
});
