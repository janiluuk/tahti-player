import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import type { TahtiNativeLibrary } from './nativeLibrary';
import { playCountThreshold, startLocalPlayCounting } from './playCounting';

const track = (id: string, durationSec = 200): TahtiPlayable => ({
  id,
  kind: 'sound',
  title: id,
  artist: 'Me',
  streamUrl: 'asset://x',
  protocol: 'https',
  durationSec,
});

const recordPlay = vi.fn(async () => undefined);
const recordSkip = vi.fn(async () => undefined);
let stop: () => void;

beforeEach(() => {
  recordPlay.mockClear();
  recordSkip.mockClear();
  globalThis.__TAHTI_NATIVE_LIBRARY__ = {
    catalog: { recordPlay, recordSkip },
  } as unknown as TahtiNativeLibrary;
  usePlayerStore.getState().clearQueue();
  stop = startLocalPlayCounting();
});
afterEach(() => {
  stop();
  globalThis.__TAHTI_NATIVE_LIBRARY__ = undefined;
});

const progress = (time: number, duration = 200) =>
  usePlayerStore.setState({ status: 'playing', currentTime: time, duration });

describe('playCountThreshold', () => {
  it('is 30 s, or half of a short track', () => {
    expect(playCountThreshold(200)).toBe(30);
    expect(playCountThreshold(40)).toBe(20);
    expect(playCountThreshold(0)).toBe(30);
  });
});

describe('local play counting', () => {
  it('counts a local track once, after the threshold', () => {
    usePlayerStore.getState().play(track('local:a'));
    progress(10);
    expect(recordPlay).not.toHaveBeenCalled();
    progress(31);
    progress(45);
    progress(90);
    expect(recordPlay).toHaveBeenCalledTimes(1);
    expect(recordPlay).toHaveBeenCalledWith('a');
  });

  it('does not count skipped tracks or cloud tracks', () => {
    usePlayerStore.getState().play(track('local:a'));
    progress(5);
    usePlayerStore.getState().play(track('sound:9'));
    progress(120);
    expect(recordPlay).not.toHaveBeenCalled();
  });

  it('counts a repeat play-through of the same track again', () => {
    usePlayerStore.getState().play(track('local:a'));
    progress(35);
    progress(0.5);
    progress(36);
    expect(recordPlay).toHaveBeenCalledTimes(2);
  });

  it('does not count while paused', () => {
    usePlayerStore.getState().play(track('local:a'));
    usePlayerStore.setState({
      status: 'paused',
      currentTime: 100,
      duration: 200,
    });
    expect(recordPlay).not.toHaveBeenCalled();
  });
});

describe('local skip counting', () => {
  it('counts a skip when a local track is left before its listen counted', () => {
    usePlayerStore.getState().play(track('local:a'));
    progress(5);
    usePlayerStore.getState().play(track('local:b'));
    expect(recordSkip).toHaveBeenCalledTimes(1);
    expect(recordSkip).toHaveBeenCalledWith('a');
    expect(recordPlay).not.toHaveBeenCalled();
  });

  it('does not count a skip once the listen counted', () => {
    usePlayerStore.getState().play(track('local:a'));
    progress(40);
    usePlayerStore.getState().play(track('local:b'));
    expect(recordPlay).toHaveBeenCalledWith('a');
    expect(recordSkip).not.toHaveBeenCalled();
  });

  it('does not count tracks that never started, cloud tracks or stopping', () => {
    usePlayerStore.getState().play(track('local:a'));
    usePlayerStore.getState().play(track('sound:9'));
    progress(5);
    usePlayerStore.getState().play(track('local:b'));
    progress(5);
    usePlayerStore.getState().clearQueue();
    expect(recordSkip).not.toHaveBeenCalled();
  });

  it('does not count a skip while the length is unknown', () => {
    usePlayerStore.getState().play(track('local:a'));
    progress(5, 0);
    usePlayerStore.getState().play(track('local:b'));
    expect(recordSkip).not.toHaveBeenCalled();
  });
});
