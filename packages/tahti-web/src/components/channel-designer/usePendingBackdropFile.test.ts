// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePendingBackdropFile } from './usePendingBackdropFile';

const { toast } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));
vi.mock('sonner', () => ({ toast, Toaster: () => null }));

const fileOf = (type: string, size = 10) =>
  new File([new Uint8Array(size)], 'backdrop', { type });

describe('usePendingBackdropFile', () => {
  let nextUrl = 0;
  const revoke = vi.fn();

  beforeEach(() => {
    nextUrl = 0;
    revoke.mockClear();
    toast.error.mockClear();
    URL.createObjectURL = vi.fn(() => `blob:${++nextUrl}`);
    URL.revokeObjectURL = revoke;
  });

  it('rejects unsupported types and oversized files without marking dirty', () => {
    const markDirty = vi.fn();
    const { result } = renderHook(() => usePendingBackdropFile(markDirty));

    act(() => result.current.selectVideoFile([fileOf('text/plain')]));
    act(() =>
      result.current.selectVideoFile([fileOf('video/mp4', 11 * 1024 * 1024)]),
    );

    expect(toast.error).toHaveBeenCalledTimes(2);
    expect(result.current.pendingVideoFile).toBeNull();
    expect(markDirty).not.toHaveBeenCalled();
  });

  it('revokes the previous blob URL on replace, discard and unmount', () => {
    const markDirty = vi.fn();
    const { result, unmount } = renderHook(() =>
      usePendingBackdropFile(markDirty),
    );

    act(() => result.current.selectVideoFile([fileOf('video/mp4')]));
    expect(result.current.pendingVideoPreviewUrl).toBe('blob:1');
    expect(markDirty).toHaveBeenCalledTimes(1);

    act(() => result.current.selectVideoFile([fileOf('image/png')]));
    expect(revoke).toHaveBeenLastCalledWith('blob:1');
    expect(result.current.pendingVideoPreviewUrl).toBe('blob:2');

    act(() => result.current.discardPendingVideo());
    expect(revoke).toHaveBeenLastCalledWith('blob:2');
    expect(result.current.pendingVideoFile).toBeNull();

    act(() => result.current.selectVideoFile([fileOf('video/webm')]));
    unmount();
    expect(revoke).toHaveBeenLastCalledWith('blob:3');
  });
});
