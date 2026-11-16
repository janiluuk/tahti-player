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

let rejectPlays: Array<(err: unknown) => void> = [];
let pause: ReturnType<typeof vi.fn>;

beforeEach(() => {
  rejectPlays = [];
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(
    () =>
      new Promise<void>((_resolve, reject) => {
        rejectPlays.push(reject);
      }),
  );
  pause = vi.fn();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause);
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

describe('AudioEngine skipping before a track starts', () => {
  it('keeps the next track loading when the skipped play request aborts', async () => {
    render(<AudioEngine />);
    act(() =>
      usePlayerStore.getState().playFromList([playable('a'), playable('b')], 0),
    );
    act(() => usePlayerStore.getState().next());
    expect(usePlayerStore.getState().currentId).toBe('sound:b');

    await act(async () => {
      rejectPlays[0]?.(
        new DOMException('interrupted by a new load request', 'AbortError'),
      );
    });

    expect(usePlayerStore.getState().status).toBe('loading');
    expect(pause).not.toHaveBeenCalled();
  });

  it('shows paused when the browser refuses to start the current track', async () => {
    render(<AudioEngine />);
    act(() => usePlayerStore.getState().play(playable('c')));

    await act(async () => {
      rejectPlays.at(-1)?.(new DOMException('no gesture', 'NotAllowedError'));
    });

    expect(usePlayerStore.getState().status).toBe('paused');
  });
});
