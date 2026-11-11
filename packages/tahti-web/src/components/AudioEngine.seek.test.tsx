import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { AudioEngine } from './AudioEngine';

const track: TahtiPlayable = {
  id: 'sound:a',
  kind: 'sound',
  title: 'a',
  artist: 'Artist',
  streamUrl: 'https://cdn.example/a.mp3',
  protocol: 'https',
  durationSec: 120,
};

function setReadyState(audio: HTMLAudioElement, value: number) {
  Object.defineProperty(audio, 'readyState', {
    configurable: true,
    get: () => value,
  });
}

beforeEach(() => {
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
  usePlayerStore.setState({ restoredPending: null, status: 'idle' });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AudioEngine seeking', () => {
  it('keeps a seek made before the audio loads and applies it once metadata arrives', () => {
    const { container } = render(<AudioEngine />);
    const audio = container.querySelector('audio') as HTMLAudioElement;
    act(() => usePlayerStore.getState().play(track));
    setReadyState(audio, HTMLMediaElement.HAVE_NOTHING);

    act(() => usePlayerStore.setState({ duration: 120 }));
    act(() => usePlayerStore.getState().seekTo(42));

    expect(usePlayerStore.getState().seekTarget).toBe(42);
    expect(audio.currentTime).toBe(0);

    setReadyState(audio, HTMLMediaElement.HAVE_METADATA);
    act(() => {
      audio.dispatchEvent(new Event('loadedmetadata'));
    });

    expect(audio.currentTime).toBe(42);
    expect(usePlayerStore.getState().seekTarget).toBeNull();
  });

  it('seeks at once when the audio already has metadata', () => {
    const { container } = render(<AudioEngine />);
    const audio = container.querySelector('audio') as HTMLAudioElement;
    act(() => usePlayerStore.getState().play(track));
    setReadyState(audio, HTMLMediaElement.HAVE_METADATA);

    act(() => usePlayerStore.setState({ duration: 120 }));
    act(() => usePlayerStore.getState().seekTo(10));

    expect(audio.currentTime).toBe(10);
    expect(usePlayerStore.getState().seekTarget).toBeNull();
  });
});
