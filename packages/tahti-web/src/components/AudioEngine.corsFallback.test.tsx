// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { AudioEngine, clearStreamsWithoutCors } from './AudioEngine';

const capturedElements = vi.hoisted(() => [] as HTMLMediaElement[]);

class FakeAudioContext {
  state = 'running';
  destination = {};
  createMediaElementSource = (element: HTMLMediaElement) => {
    capturedElements.push(element);
    return { connect: vi.fn(), disconnect: vi.fn() };
  };
  createGain = () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: { value: 1 },
  });
  createAnalyser = () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 0,
    smoothingTimeConstant: 0,
  });
  resume = () => Promise.resolve();
}

const NO_CORS_STATION: TahtiPlayable = {
  id: 'radio:no-cors',
  kind: 'radio',
  title: 'No CORS FM',
  artist: 'Internet radio',
  streamUrl: 'https://redirect.example/no-cors.aac',
  protocol: 'https',
};

const CORS_TRACK: TahtiPlayable = {
  id: 'sound:cors',
  kind: 'sound',
  title: 'Track',
  artist: 'Artist',
  streamUrl: 'https://cdn.example/track.mp3',
  protocol: 'https',
  durationSec: 60,
};

function mount() {
  const { container } = render(<AudioEngine />);
  const audio = () => container.querySelector('audio') as HTMLAudioElement;
  const fire = (name: string) =>
    act(() => void audio().dispatchEvent(new Event(name)));
  const playItem = (playable: TahtiPlayable) => {
    act(() => usePlayerStore.getState().play(playable));
    fire('play');
  };
  return { audio, fire, playItem };
}

beforeEach(() => {
  capturedElements.length = 0;
  clearStreamsWithoutCors();
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockReturnValue();
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockReturnValue();
  usePlayerStore.getState().clearQueue();
  usePlayerStore.setState({ restoredPending: null, status: 'idle' });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  usePlayerStore.getState().clearQueue();
});

describe('AudioEngine when a stream has no CORS headers', () => {
  it('plays it on a fresh element the Web Audio graph never captured', () => {
    const { audio, fire, playItem } = mount();
    playItem(NO_CORS_STATION);
    const first = audio();
    expect(capturedElements).toEqual([first]);

    fire('error');

    const replacement = audio();
    expect(replacement).not.toBe(first);
    expect(replacement.crossOrigin).toBeNull();
    expect(replacement.getAttribute('src')).toBe(NO_CORS_STATION.streamUrl);
    expect(usePlayerStore.getState().status).toBe('loading');

    fire('play');
    expect(capturedElements).toEqual([first]);
    fire('playing');
    expect(usePlayerStore.getState().status).toBe('playing');
  });

  it('keeps the element when the graph has not captured it yet', () => {
    const { audio, fire } = mount();
    act(() => usePlayerStore.getState().play(NO_CORS_STATION));
    const first = audio();

    fire('error');

    expect(audio()).toBe(first);
    expect(first.crossOrigin).toBeNull();
    fire('play');
    expect(capturedElements).toEqual([]);
  });

  it('goes straight to a plain element when the station is played again', () => {
    const { audio, fire, playItem } = mount();
    playItem(NO_CORS_STATION);
    fire('error');
    playItem(CORS_TRACK);
    const trackElement = audio();
    expect(trackElement.crossOrigin).toBe('anonymous');
    expect(capturedElements).toContain(trackElement);

    act(() => usePlayerStore.getState().play(NO_CORS_STATION));

    expect(audio()).not.toBe(trackElement);
    expect(audio().crossOrigin).toBeNull();
    expect(audio().getAttribute('src')).toBe(NO_CORS_STATION.streamUrl);
  });

  it('reports an error when the plain load fails too', () => {
    const { fire, playItem } = mount();
    playItem(NO_CORS_STATION);
    fire('error');

    fire('error');

    expect(usePlayerStore.getState().status).toBe('error');
  });
});
