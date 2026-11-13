import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlayChannelInPlayer } from './usePlayChannelInPlayer';

const fetchChannel = vi.fn();
const play = vi.fn();
const setStatus = vi.fn();

vi.mock('../api/client', () => ({
  fetchChannel: (...args: unknown[]) => fetchChannel(...args),
}));

vi.mock('../stores/playerStore', () => ({
  usePlayerStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      currentId: currentIdValue,
      status: statusValue,
      play,
      setStatus,
    }),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

let currentIdValue: string | null = null;
let statusValue: string = 'idle';

describe('usePlayChannelInPlayer', () => {
  beforeEach(() => {
    currentIdValue = null;
    statusValue = 'idle';
    fetchChannel.mockReset();
    play.mockReset();
    setStatus.mockReset();
  });

  it('fetches and plays when the channel is not current', async () => {
    fetchChannel.mockResolvedValue({
      playable: { id: 'live:northern-lights' },
    });
    const { result } = renderHook(() =>
      usePlayChannelInPlayer('northern-lights'),
    );
    expect(result.current.isPlaying).toBe(false);
    await act(async () => {
      result.current.toggle();
    });
    expect(fetchChannel).toHaveBeenCalledWith('northern-lights');
    expect(play).toHaveBeenCalledWith({ id: 'live:northern-lights' });
  });

  it('pauses when the channel is already playing', () => {
    currentIdValue = 'live:northern-lights';
    statusValue = 'playing';
    const { result } = renderHook(() =>
      usePlayChannelInPlayer('northern-lights'),
    );
    expect(result.current.isPlaying).toBe(true);
    act(() => {
      result.current.toggle();
    });
    expect(setStatus).toHaveBeenCalledWith('paused');
    expect(fetchChannel).not.toHaveBeenCalled();
  });
});
