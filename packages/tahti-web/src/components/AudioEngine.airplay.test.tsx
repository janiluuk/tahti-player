import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { AudioEngine } from './AudioEngine';

const hlsInstances = vi.hoisted(() => [] as unknown[]);

vi.mock('hls.js', () => {
  class FakeHls {
    static isSupported = () => true;
    static Events = { ERROR: 'error', MANIFEST_PARSED: 'manifestParsed' };
    constructor() {
      hlsInstances.push(this);
    }
    on() {}
    loadSource() {}
    attachMedia() {}
    destroy() {}
  }
  return { default: FakeHls };
});

const track: TahtiPlayable = {
  id: 'sound:a',
  kind: 'sound',
  title: 'A',
  artist: 'Artist',
  streamUrl: 'https://cdn.example/a.mp3',
  protocol: 'https',
  durationSec: 60,
};

const hlsRadio: TahtiPlayable = {
  id: 'radio:tahti',
  kind: 'radio',
  title: 'Tahti Radio',
  artist: 'Tahti',
  streamUrl: 'https://stream.example/live/index.m3u8',
  protocol: 'hls',
};

const createMediaElementSource = vi.fn(() => ({ connect: vi.fn() }));

class FakeAudioContext {
  state = 'running';
  destination = {};
  createMediaElementSource = createMediaElementSource;
  createAnalyser = () => ({
    connect: vi.fn(),
    fftSize: 0,
    smoothingTimeConstant: 0,
  });
  resume = () => Promise.resolve();
}

function renderAndPlay(playable: TahtiPlayable) {
  const { container } = render(<AudioEngine />);
  const audio = container.querySelector('audio') as HTMLAudioElement;
  act(() => usePlayerStore.getState().play(playable));
  act(() => {
    audio.dispatchEvent(new Event('play'));
  });
  return audio;
}

beforeEach(() => {
  createMediaElementSource.mockClear();
  hlsInstances.length = 0;
  vi.stubGlobal('AudioContext', FakeAudioContext);
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
});

describe('AudioEngine in an AirPlay-capable browser', () => {
  beforeEach(() => {
    vi.stubGlobal('WebKitPlaybackTargetAvailabilityEvent', class {});
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation(
      (type: string) =>
        type === 'application/vnd.apple.mpegurl' ? 'maybe' : '',
    );
  });

  it('never captures the element into Web Audio, so AirPlay keeps its sound', () => {
    const audio = renderAndPlay(track);
    expect(createMediaElementSource).not.toHaveBeenCalled();
    expect(usePlayerStore.getState().analyser).toBeNull();
    expect(audio.getAttribute('crossorigin')).toBeNull();
  });

  it('plays HLS radio natively instead of through a MediaSource', () => {
    const audio = renderAndPlay(hlsRadio);
    expect(audio.getAttribute('src')).toBe(hlsRadio.streamUrl);
    expect(hlsInstances).toHaveLength(0);
  });
});

describe('AudioEngine elsewhere', () => {
  it('keeps using hls.js for HLS', async () => {
    renderAndPlay(hlsRadio);
    await vi.waitFor(() => expect(hlsInstances).toHaveLength(1));
  });

  it('still builds the analyser graph for visualizers', () => {
    const audio = renderAndPlay(track);
    expect(createMediaElementSource).toHaveBeenCalledWith(audio);
    expect(usePlayerStore.getState().analyser).not.toBeNull();
    expect(audio.getAttribute('crossorigin')).toBe('anonymous');
  });
});
