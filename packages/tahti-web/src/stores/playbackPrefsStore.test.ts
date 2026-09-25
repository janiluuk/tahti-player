import { beforeEach, describe, expect, it } from 'vitest';

import {
  clampSkipSeconds,
  DEFAULT_SKIP_SECONDS,
  SKIP_SECONDS_MAX,
  SKIP_SECONDS_MIN,
  usePlaybackPrefsStore,
} from './playbackPrefsStore';
import { usePlayerStore } from './playerStore';

describe('clampSkipSeconds', () => {
  it('rounds and clamps into range', () => {
    expect(clampSkipSeconds(12.4)).toBe(12);
    expect(clampSkipSeconds(0)).toBe(SKIP_SECONDS_MIN);
    expect(clampSkipSeconds(999)).toBe(SKIP_SECONDS_MAX);
  });

  it('falls back to the default for non-numbers', () => {
    expect(clampSkipSeconds(Number.NaN)).toBe(DEFAULT_SKIP_SECONDS);
  });
});

describe('usePlaybackPrefsStore', () => {
  beforeEach(() => {
    usePlaybackPrefsStore.setState({ skipSeconds: DEFAULT_SKIP_SECONDS });
  });

  it('stores a clamped skip duration', () => {
    usePlaybackPrefsStore.getState().setSkipSeconds(120);
    expect(usePlaybackPrefsStore.getState().skipSeconds).toBe(SKIP_SECONDS_MAX);
  });
});

describe('playerStore.seekBy', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      isLive: false,
      currentTime: 30,
      duration: 100,
      seekTarget: null,
    });
  });

  it('seeks relative to the current position', () => {
    usePlayerStore.getState().seekBy(10);
    expect(usePlayerStore.getState().seekTarget).toBe(40);
  });

  it('clamps to the start and end of the track', () => {
    usePlayerStore.getState().seekBy(-60);
    expect(usePlayerStore.getState().seekTarget).toBe(0);
    usePlayerStore.getState().seekBy(500);
    expect(usePlayerStore.getState().seekTarget).toBe(100);
  });

  it('does nothing on live streams', () => {
    usePlayerStore.setState({ isLive: true });
    usePlayerStore.getState().seekBy(10);
    expect(usePlayerStore.getState().seekTarget).toBeNull();
  });
});
