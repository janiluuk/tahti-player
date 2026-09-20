import { act, renderHook } from '@testing-library/react';

import { useAutoHideNavWhilePlaying } from './useAutoHideNavWhilePlaying';

function dispatchTouchStart(clientY: number) {
  const event = new Event('touchstart') as unknown as {
    touches: Array<{ clientX: number; clientY: number }>;
  } & Event;
  event.touches = [{ clientX: 0, clientY }];
  window.dispatchEvent(event);
}

function dispatchTouchMove(clientY: number) {
  const event = new Event('touchmove') as unknown as {
    touches: Array<{ clientX: number; clientY: number }>;
  } & Event;
  event.touches = [{ clientX: 0, clientY }];
  window.dispatchEvent(event);
}

describe('useAutoHideNavWhilePlaying', () => {
  it('does not hide the nav on desktop, even while playing', () => {
    const { result } = renderHook(() =>
      useAutoHideNavWhilePlaying(false, true),
    );
    expect(result.current).toBe(false);
  });

  it('does not hide the nav on mobile while not playing', () => {
    const { result } = renderHook(() =>
      useAutoHideNavWhilePlaying(true, false),
    );
    expect(result.current).toBe(false);
  });

  it('hides the nav on mobile once playback starts', () => {
    const { result, rerender } = renderHook(
      ({ isPlaying }) => useAutoHideNavWhilePlaying(true, isPlaying),
      { initialProps: { isPlaying: false } },
    );
    expect(result.current).toBe(false);

    rerender({ isPlaying: true });
    expect(result.current).toBe(true);
  });

  it('reveals the nav on a swipe-up starting near the bottom edge', () => {
    const { result } = renderHook(() => useAutoHideNavWhilePlaying(true, true));
    expect(result.current).toBe(true);

    act(() => {
      dispatchTouchStart(window.innerHeight - 10);
      dispatchTouchMove(window.innerHeight - 40);
    });

    expect(result.current).toBe(false);
  });

  it('ignores a swipe-up that does not start near the bottom edge', () => {
    const { result } = renderHook(() => useAutoHideNavWhilePlaying(true, true));
    expect(result.current).toBe(true);

    act(() => {
      dispatchTouchStart(200);
      dispatchTouchMove(150);
    });

    expect(result.current).toBe(true);
  });

  it('re-hides the nav by default the next time playback starts, after a reveal', () => {
    const { result, rerender } = renderHook(
      ({ isPlaying }) => useAutoHideNavWhilePlaying(true, isPlaying),
      { initialProps: { isPlaying: true } },
    );

    act(() => {
      dispatchTouchStart(window.innerHeight - 5);
      dispatchTouchMove(window.innerHeight - 35);
    });
    expect(result.current).toBe(false);

    rerender({ isPlaying: false });
    expect(result.current).toBe(false);

    rerender({ isPlaying: true });
    expect(result.current).toBe(true);
  });

  it('removes its touch listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() =>
      useAutoHideNavWhilePlaying(true, true),
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
    removeSpy.mockRestore();
  });
});
