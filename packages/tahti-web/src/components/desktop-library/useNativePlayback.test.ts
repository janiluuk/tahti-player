import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import { usePlayerStore } from '../../stores/playerStore';
import { useNativePlayback } from './useNativePlayback';

const { toast } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock('sonner', () => ({ toast }));

const track = (id: string) =>
  ({
    id,
    title: id,
    artist: 'x',
    album: 'y',
    duration: 1,
  }) as NativeLibraryTrack;

describe('useNativePlayback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queues resolvable tracks in order and raises one error toast for the rest', async () => {
    const enqueue = vi.fn();
    usePlayerStore.setState({ enqueue } as never);
    const library = {
      resolve: vi.fn((id: string) =>
        id === 'bad1' || id === 'bad2'
          ? Promise.reject(new Error('gone'))
          : Promise.resolve(`file:///${id}`),
      ),
    } as unknown as TahtiNativeLibrary;
    const { result } = renderHook(() => useNativePlayback(library));
    await act(() =>
      result.current.queueNative([
        track('a'),
        track('bad1'),
        track('bad2'),
        track('b'),
      ]),
    );
    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue.mock.calls.map(([item]) => item.title)).toEqual(['a', 'b']);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Added 2 tracks to the queue.');
  });

  it('reports a track that cannot be revealed', async () => {
    const library = {
      reveal: vi.fn().mockRejectedValue(new Error('no file')),
    } as unknown as TahtiNativeLibrary;
    const { result } = renderHook(() => useNativePlayback(library));
    await act(() => result.current.revealNative(track('a')));
    expect(toast.error).toHaveBeenCalledWith('no file');
  });
});
