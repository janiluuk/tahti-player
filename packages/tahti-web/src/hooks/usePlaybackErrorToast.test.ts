import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { usePlaybackErrorToast } from './usePlaybackErrorToast';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const TRACK: TahtiPlayable = {
  id: 'sound:one',
  kind: 'sound',
  title: 'One',
  artist: 'Artist',
  streamUrl: 'https://cdn.example/one.mp3',
  protocol: 'https',
};
const NEXT: TahtiPlayable = {
  ...TRACK,
  id: 'sound:two',
  title: 'Two',
  streamUrl: 'https://cdn.example/two.mp3',
};

function tryAgain() {
  const options = vi.mocked(toast.error).mock.calls.at(-1)![1] as {
    action: { onClick: () => void };
  };
  act(() => options.action.onClick());
}

describe('usePlaybackErrorToast', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
    usePlayerStore.setState({
      status: 'loading',
      isLive: true,
      currentId: 'radio:tahti',
    });
  });

  it('says once when a stream cannot be reached', () => {
    const { rerender } = renderHook(() => usePlaybackErrorToast('Tahti Radio'));

    act(() => usePlayerStore.getState().setStatus('error', 'Playback error'));
    rerender();
    act(() => usePlayerStore.getState().setStatus('error', 'Playback error'));
    rerender();

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.error).mock.calls[0]![0]).toMatch(
      /Tahti Radio is unavailable\. The stream may be off air/,
    );
  });

  it('names why the station failed', () => {
    renderHook(() => usePlaybackErrorToast('Tahti Radio'));

    act(() =>
      usePlayerStore
        .getState()
        .setStatus('error', 'Playback error', { reason: 'http', status: 404 }),
    );

    expect(vi.mocked(toast.error).mock.calls[0]![0]).toBe(
      'Tahti Radio is unavailable. The station’s server answered with HTTP 404.',
    );
  });

  it('speaks up again after it played in between', () => {
    renderHook(() => usePlaybackErrorToast('Tahti Radio'));

    act(() => usePlayerStore.getState().setStatus('error'));
    act(() => usePlayerStore.getState().setStatus('playing'));
    act(() => usePlayerStore.getState().setStatus('error'));

    expect(toast.error).toHaveBeenCalledTimes(2);
  });

  it('Try again reloads the track and keeps the rest of the queue', () => {
    usePlayerStore.getState().play(TRACK, { enqueueRest: [NEXT] });
    renderHook(() => usePlaybackErrorToast('One'));
    act(() => usePlayerStore.getState().setStatus('error'));
    const nonce = usePlayerStore.getState().reloadNonce;

    tryAgain();

    const state = usePlayerStore.getState();
    expect(state.queue.map((item) => item.id)).toEqual([TRACK.id, NEXT.id]);
    expect(state.status).toBe('loading');
    expect(state.reloadNonce).toBe(nonce + 1);
  });

  it('speaks up again when the retry fails too', () => {
    renderHook(() => usePlaybackErrorToast('Tahti Radio'));
    act(() => usePlayerStore.getState().setStatus('error'));

    tryAgain();
    act(() => usePlayerStore.getState().setStatus('error'));

    expect(toast.error).toHaveBeenCalledTimes(2);
  });
});
