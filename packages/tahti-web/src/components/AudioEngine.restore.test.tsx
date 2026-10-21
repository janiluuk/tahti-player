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
  durationSec: 60,
});

const play = vi.fn(() => Promise.resolve());

beforeEach(() => {
  play.mockClear();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
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

describe('AudioEngine with a restored queue', () => {
  it('does not load or play a restored track on launch', () => {
    usePlayerStore
      .getState()
      .hydrateQueue([playable('a'), playable('b')], 'sound:a');
    const { container } = render(<AudioEngine />);
    const audio = container.querySelector('audio') as HTMLAudioElement;

    expect(play).not.toHaveBeenCalled();
    expect(audio.getAttribute('src')).toBeNull();
    expect(usePlayerStore.getState().status).toBe('paused');
  });

  it('loads and plays it once the user presses play', () => {
    usePlayerStore.getState().hydrateQueue([playable('a')], 'sound:a');
    const { container } = render(<AudioEngine />);
    const audio = container.querySelector('audio') as HTMLAudioElement;

    act(() => usePlayerStore.getState().setStatus('playing'));

    expect(audio.getAttribute('src')).toBe('https://cdn.example/a.mp3');
    expect(play).toHaveBeenCalled();
  });

  it('loads normally when the user picks another track instead', () => {
    usePlayerStore
      .getState()
      .hydrateQueue([playable('a'), playable('b')], 'sound:a');
    const { container } = render(<AudioEngine />);
    const audio = container.querySelector('audio') as HTMLAudioElement;

    act(() => usePlayerStore.getState().playQueueIndex('sound:b'));

    expect(audio.getAttribute('src')).toBe('https://cdn.example/b.mp3');
    expect(play).toHaveBeenCalled();
  });

  it('still autoplays an ordinary (non-restored) track', () => {
    const { container } = render(<AudioEngine />);
    const audio = container.querySelector('audio') as HTMLAudioElement;
    act(() => usePlayerStore.getState().play(playable('c')));
    expect(audio.getAttribute('src')).toBe('https://cdn.example/c.mp3');
    expect(play).toHaveBeenCalled();
  });
});
