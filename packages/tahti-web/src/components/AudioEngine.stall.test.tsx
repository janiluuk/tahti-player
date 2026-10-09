// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { AudioEngine } from './AudioEngine';

const TRACK: TahtiPlayable = {
  id: 'sound:stall',
  kind: 'sound',
  title: 'Stall',
  artist: 'Artist',
  streamUrl: 'https://cdn.example/stall.mp3',
  protocol: 'https',
  durationSec: 60,
};

function mount() {
  usePlayerStore.getState().play(TRACK);
  const { container } = render(<AudioEngine />);
  const audio = container.querySelector('audio') as HTMLAudioElement;
  const fire = (name: string) =>
    act(() => void audio.dispatchEvent(new Event(name)));
  return { fire };
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
  usePlayerStore.getState().clearQueue();
});

describe('AudioEngine when the stream stalls', () => {
  it('goes back to loading while the element waits for data, then to playing', () => {
    const { fire } = mount();
    expect(usePlayerStore.getState().status).toBe('loading');
    fire('playing');
    expect(usePlayerStore.getState().status).toBe('playing');

    fire('waiting');
    expect(usePlayerStore.getState().status).toBe('loading');
    fire('playing');
    expect(usePlayerStore.getState().status).toBe('playing');
  });

  it('leaves a paused or failed player alone', () => {
    const { fire } = mount();
    fire('playing');
    act(() => usePlayerStore.getState().setStatus('paused'));
    fire('waiting');
    expect(usePlayerStore.getState().status).toBe('paused');

    act(() => usePlayerStore.getState().setStatus('error', 'Playback error'));
    fire('waiting');
    expect(usePlayerStore.getState().status).toBe('error');
    expect(usePlayerStore.getState().error).toBe('Playback error');
  });
});
