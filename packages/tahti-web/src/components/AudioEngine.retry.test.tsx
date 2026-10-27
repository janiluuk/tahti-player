// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { AudioEngine } from './AudioEngine';

const FIRST: TahtiPlayable = {
  id: 'sound:first',
  kind: 'sound',
  title: 'First',
  artist: 'Artist',
  streamUrl: 'https://cdn.example/first.mp3',
  protocol: 'https',
  durationSec: 60,
};

const SECOND: TahtiPlayable = {
  ...FIRST,
  id: 'sound:second',
  title: 'Second',
  streamUrl: 'https://cdn.example/second.mp3',
};

function mount() {
  usePlayerStore.getState().play(FIRST, { enqueueRest: [SECOND] });
  const { container } = render(<AudioEngine />);
  const audio = container.querySelector('audio') as HTMLAudioElement;
  const fail = () => {
    audio.crossOrigin = null;
    act(() => void audio.dispatchEvent(new Event('error')));
  };
  return { fail };
}

let play: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  play = vi
    .spyOn(HTMLMediaElement.prototype, 'play')
    .mockImplementation(() => Promise.resolve());
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

describe('AudioEngine after a stream error', () => {
  it('loads the same source again on retry', () => {
    const { fail } = mount();
    fail();
    expect(usePlayerStore.getState().status).toBe('error');
    const callsBefore = play.mock.calls.length;

    act(() => usePlayerStore.getState().retry());

    expect(usePlayerStore.getState().status).toBe('loading');
    expect(usePlayerStore.getState().error).toBeNull();
    expect(play.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('keeps the queue and the current track', () => {
    const { fail } = mount();
    fail();

    act(() => usePlayerStore.getState().retry());

    const { queue, currentId } = usePlayerStore.getState();
    expect(queue.map((item) => item.id)).toEqual([FIRST.id, SECOND.id]);
    expect(currentId).toBe(FIRST.id);
  });

  it('reloads when play is pressed after the error', () => {
    const { fail } = mount();
    fail();
    const callsBefore = play.mock.calls.length;

    act(() => usePlayerStore.getState().setStatus('playing'));

    expect(usePlayerStore.getState().status).toBe('loading');
    expect(play.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
