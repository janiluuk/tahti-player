import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { AudioEngine } from './AudioEngine';

const postListenEvent = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  postListenEvent,
}));

vi.mock('hls.js', () => {
  class FakeHls {
    static isSupported = () => true;
    static Events = { ERROR: 'error', MANIFEST_PARSED: 'manifestParsed' };
    on() {}
    loadSource() {}
    attachMedia() {}
    destroy() {}
  }
  return { default: FakeHls };
});

const trackA: TahtiPlayable = {
  id: 'sound:a',
  kind: 'sound',
  title: 'A',
  artist: 'Artist A',
  coverUrl: 'https://cdn.example/a.jpg',
  streamUrl: 'https://cdn.example/a.mp3',
  protocol: 'https',
  durationSec: 120,
};

const trackB: TahtiPlayable = {
  id: 'sound:b',
  kind: 'sound',
  title: 'B',
  artist: 'Artist B',
  streamUrl: 'https://cdn.example/b.mp3',
  protocol: 'https',
  durationSec: 90,
};

class FakeMediaMetadata {
  title: string;
  artist: string;
  artwork: MediaImage[];
  constructor(init: MediaMetadataInit) {
    this.title = init.title ?? '';
    this.artist = init.artist ?? '';
    this.artwork = [...(init.artwork ?? [])];
  }
}

let metadataWrites: (FakeMediaMetadata | null)[];
const setPositionState = vi.fn();
let now = 0;

function installMediaSession() {
  let metadata: FakeMediaMetadata | null = null;
  const session = {
    playbackState: 'none',
    setActionHandler: vi.fn(),
    setPositionState,
    get metadata() {
      return metadata;
    },
    set metadata(value: FakeMediaMetadata | null) {
      metadataWrites.push(value);
      metadata = value;
    },
  };
  Object.defineProperty(navigator, 'mediaSession', {
    configurable: true,
    value: session,
  });
}

function setAudioClock(audio: HTMLAudioElement, time: number, duration = 120) {
  Object.defineProperty(audio, 'currentTime', {
    configurable: true,
    get: () => time,
    set: () => undefined,
  });
  Object.defineProperty(audio, 'duration', {
    configurable: true,
    get: () => duration,
  });
}

function tick(audio: HTMLAudioElement, time: number, advanceMs = 1000) {
  now += advanceMs;
  setAudioClock(audio, time);
  act(() => {
    audio.dispatchEvent(new Event('timeupdate'));
  });
}

function renderEngine() {
  const { container } = render(<AudioEngine />);
  return container.querySelector('audio') as HTMLAudioElement;
}

beforeEach(() => {
  metadataWrites = [];
  setPositionState.mockClear();
  postListenEvent.mockClear();
  now = 10_000;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('MediaMetadata', FakeMediaMetadata);
  installMediaSession();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() =>
    Promise.resolve(),
  );
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(
    () => undefined,
  );
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(
    () => undefined,
  );
  usePlayerStore.getState().clearQueue();
  usePlayerStore.setState({
    restoredPending: null,
    status: 'idle',
    analyser: null,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'mediaSession');
});

describe('AudioEngine MediaSession integration', () => {
  it('assigns metadata once per track, not on progress ticks', () => {
    const audio = renderEngine();
    act(() => usePlayerStore.getState().play(trackA));
    const writesAfterPlay = metadataWrites.length;
    expect(metadataWrites.at(-1)).toMatchObject({
      title: 'A',
      artist: 'Artist A',
      artwork: [{ src: 'https://cdn.example/a.jpg' }],
    });

    for (let t = 1; t <= 30; t++) {
      tick(audio, t);
    }
    act(() => usePlayerStore.getState().setStatus('paused'));
    act(() => usePlayerStore.getState().setStatus('playing'));
    act(() => usePlayerStore.getState().setVolume(0.5));

    expect(usePlayerStore.getState().currentTime).toBe(30);
    expect(metadataWrites).toHaveLength(writesAfterPlay);
  });

  it('does not reassign metadata when the current item is rebuilt with the same fields', () => {
    renderEngine();
    act(() => usePlayerStore.getState().play(trackA));
    const writesAfterPlay = metadataWrites.length;

    act(() =>
      usePlayerStore
        .getState()
        .setQueueSources({ 'sound:a': 'https://cdn.example/a-resolved.mp3' }),
    );
    act(() => usePlayerStore.getState().enqueue(trackB));

    expect(metadataWrites).toHaveLength(writesAfterPlay);
  });

  it('assigns new metadata exactly once on a real track change', () => {
    const audio = renderEngine();
    act(() => usePlayerStore.getState().play(trackA));
    tick(audio, 5);
    const writesBefore = metadataWrites.length;

    act(() => usePlayerStore.getState().play(trackB));

    expect(metadataWrites).toHaveLength(writesBefore + 1);
    expect(metadataWrites.at(-1)).toMatchObject({
      title: 'B',
      artist: 'Artist B',
    });

    act(() => usePlayerStore.getState().clearQueue());
    expect(metadataWrites.at(-1)).toBeNull();
  });

  it('updates position state on the existing progress throttle', () => {
    const audio = renderEngine();
    act(() => usePlayerStore.getState().play(trackA));

    tick(audio, 1);
    tick(audio, 1.25, 250);
    tick(audio, 1.5, 250);
    tick(audio, 2.5);

    expect(setPositionState).toHaveBeenCalledTimes(2);
    expect(setPositionState).toHaveBeenLastCalledWith({
      duration: 120,
      position: 2.5,
      playbackRate: 1,
    });
    expect(usePlayerStore.getState().currentTime).toBe(2.5);
  });

  it('updates position state right after a seek', () => {
    const audio = renderEngine();
    act(() => usePlayerStore.getState().play(trackA));

    setAudioClock(audio, 60);
    act(() => {
      audio.dispatchEvent(new Event('seeked'));
    });

    expect(setPositionState).toHaveBeenLastCalledWith({
      duration: 120,
      position: 60,
      playbackRate: 1,
    });
  });

  it('skips position state for streams without a finite duration', () => {
    const audio = renderEngine();
    act(() => usePlayerStore.getState().play(trackA));

    now += 1000;
    setAudioClock(audio, 10, Number.POSITIVE_INFINITY);
    act(() => {
      audio.dispatchEvent(new Event('timeupdate'));
    });

    expect(setPositionState).not.toHaveBeenCalled();
    expect(usePlayerStore.getState().currentTime).toBe(10);
  });

  it('still reports the listen event once past the threshold', () => {
    const audio = renderEngine();
    act(() => usePlayerStore.getState().play(trackA));

    for (let t = 1; t <= 20; t++) {
      tick(audio, t);
    }

    expect(postListenEvent).toHaveBeenCalledTimes(1);
    expect(postListenEvent).toHaveBeenCalledWith('a');
  });
});
