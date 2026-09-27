import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NativeArtworkBackfill } from '../../lib/nativeLibrary';
import { useArtworkBackfill } from './useArtworkBackfill';

const { toast } = vi.hoisted(() => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast }));

function fakeBackfill(
  start: NativeArtworkBackfill['start'],
): NativeArtworkBackfill & { unsubscribe: () => void } {
  const unsubscribe = vi.fn();
  return {
    start: vi.fn(start),
    cancel: vi.fn(async () => undefined),
    onProgress: vi.fn((listener) => {
      listener({ done: 100, total: 250 });
      return unsubscribe;
    }),
    unsubscribe,
  };
}

describe('useArtworkBackfill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is unavailable in desktop builds without the command', () => {
    const { result } = renderHook(() => useArtworkBackfill(undefined, vi.fn()));
    expect(result.current.available).toBe(false);
  });

  it('reports progress and the result, then refreshes', async () => {
    const backfill = fakeBackfill(async () => ({
      checked: 250,
      found: 200,
      cacheFull: 10,
      cancelled: false,
    }));
    const onChanged = vi.fn();
    const { result } = renderHook(() =>
      useArtworkBackfill(backfill, onChanged),
    );
    await act(() => result.current.start());
    expect(toast.loading).toHaveBeenLastCalledWith(
      'Looking for missing artwork… 100 of 250',
      expect.objectContaining({ id: 'library-artwork-backfill' }),
    );
    expect(toast.success).toHaveBeenCalledWith(
      'Found artwork for 200 tracks.',
      expect.objectContaining({
        description:
          '40 tracks have no embedded picture. 10 tracks skipped because the artwork cache is full.',
      }),
    );
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(backfill.unsubscribe).toHaveBeenCalledTimes(1);
    expect(result.current.running).toBe(false);
  });

  it('says so when nothing is missing artwork', async () => {
    const backfill = fakeBackfill(async () => ({
      checked: 0,
      found: 0,
      cacheFull: 0,
      cancelled: false,
    }));
    const { result } = renderHook(() => useArtworkBackfill(backfill, vi.fn()));
    await act(() => result.current.start());
    expect(toast.success).toHaveBeenCalledWith(
      'No tracks are missing artwork.',
      { id: 'library-artwork-backfill' },
    );
  });

  it('cancels from the toast action and reports a stop', async () => {
    const backfill = fakeBackfill(async () => ({
      checked: 5,
      found: 1,
      cacheFull: 0,
      cancelled: true,
    }));
    const { result } = renderHook(() => useArtworkBackfill(backfill, vi.fn()));
    await act(() => result.current.start());
    const [, options] = toast.loading.mock.calls[0];
    options.action.onClick({ preventDefault: vi.fn() });
    expect(backfill.cancel).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith(
      'Stopped. Found artwork for 1 track.',
      expect.objectContaining({ id: 'library-artwork-backfill' }),
    );
  });

  it('shows the error and does not refresh when the job fails', async () => {
    const backfill = fakeBackfill(async () => {
      throw new Error('Already looking for missing artwork');
    });
    const onChanged = vi.fn();
    const { result } = renderHook(() =>
      useArtworkBackfill(backfill, onChanged),
    );
    await act(() => result.current.start());
    expect(toast.error).toHaveBeenCalledWith(
      'Already looking for missing artwork',
      { id: 'library-artwork-backfill' },
    );
    expect(onChanged).not.toHaveBeenCalled();
    expect(backfill.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
