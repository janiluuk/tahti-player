import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { AudioEngine } from './AudioEngine';

const playable = (id: string): TahtiPlayable => ({
  id: `sound:${id}`,
  kind: 'sound',
  title: id,
  artist: 'Artist',
  streamUrl: `https://cdn.example/${id}.mp3`,
  protocol: 'https',
  durationSec: 120,
});

function fakeMedia(audio: HTMLAudioElement) {
  const media = { readyState: 0, time: 0 };
  Object.defineProperty(audio, 'readyState', {
    configurable: true,
    get: () => media.readyState,
  });
  Object.defineProperty(audio, 'currentTime', {
    configurable: true,
    get: () => media.time,
    set: (value: number) => {
      media.time = value;
    },
  });
  Object.defineProperty(audio, 'duration', {
    configurable: true,
    get: () => (media.readyState > 0 ? 120 : NaN),
  });
  return {
    media,
    loadMetadata: () => {
      media.time = 0;
      media.readyState = 1;
      audio.dispatchEvent(new Event('loadedmetadata'));
    },
  };
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

describe('AudioEngine seeking before the audio has loaded', () => {
  it('keeps a seek made on a restored track until its audio loads', () => {
    usePlayerStore.getState().hydrateQueue([playable('a')], 'sound:a');
    const { container } = render(<AudioEngine />);
    const audio = container.querySelector('audio') as HTMLAudioElement;
    const { media, loadMetadata } = fakeMedia(audio);

    act(() => usePlayerStore.getState().seekTo(45));
    act(() => usePlayerStore.getState().setStatus('playing'));
    expect(audio.getAttribute('src')).toBe('https://cdn.example/a.mp3');

    act(() => loadMetadata());

    expect(media.time).toBe(45);
    expect(usePlayerStore.getState().currentTime).toBe(45);
  });

  it('applies a seek made right after play once metadata arrives', () => {
    const { container } = render(<AudioEngine />);
    const audio = container.querySelector('audio') as HTMLAudioElement;
    const { media, loadMetadata } = fakeMedia(audio);

    act(() => {
      usePlayerStore.getState().play(playable('b'));
      usePlayerStore.getState().seekTo(30);
    });
    act(() => loadMetadata());

    expect(media.time).toBe(30);
  });

  it('drops a pending seek when another track starts instead', () => {
    usePlayerStore
      .getState()
      .hydrateQueue([playable('a'), playable('c')], 'sound:a');
    const { container } = render(<AudioEngine />);
    const audio = container.querySelector('audio') as HTMLAudioElement;
    const { media, loadMetadata } = fakeMedia(audio);

    act(() => usePlayerStore.getState().seekTo(45));
    act(() => usePlayerStore.getState().playQueueIndex('sound:c'));
    act(() => loadMetadata());

    expect(media.time).toBe(0);
  });

  it('seeks at once when the audio is already loaded', () => {
    const { container } = render(<AudioEngine />);
    const audio = container.querySelector('audio') as HTMLAudioElement;
    const { media, loadMetadata } = fakeMedia(audio);
    act(() => usePlayerStore.getState().play(playable('d')));
    act(() => loadMetadata());

    act(() => usePlayerStore.getState().seekTo(50));

    expect(media.time).toBe(50);
  });
});
