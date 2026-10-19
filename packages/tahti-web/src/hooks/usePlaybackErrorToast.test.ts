import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlayerStore } from '../stores/playerStore';
import { usePlaybackErrorToast } from './usePlaybackErrorToast';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

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
      /Can’t reach “Tahti Radio” right now/,
    );
  });

  it('speaks up again after it played in between', () => {
    renderHook(() => usePlaybackErrorToast('Tahti Radio'));

    act(() => usePlayerStore.getState().setStatus('error'));
    act(() => usePlayerStore.getState().setStatus('playing'));
    act(() => usePlayerStore.getState().setStatus('error'));

    expect(toast.error).toHaveBeenCalledTimes(2);
  });
});
