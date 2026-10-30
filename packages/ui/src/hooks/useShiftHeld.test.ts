import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useShiftHeld } from './useShiftHeld';

function fireKey(type: 'keydown' | 'keyup', shiftKey: boolean) {
  window.dispatchEvent(
    new KeyboardEvent(type, {
      key: 'Shift',
      shiftKey,
      bubbles: true,
    }),
  );
}

describe('useShiftHeld', () => {
  afterEach(() => {
    act(() => {
      fireKey('keyup', false);
      window.dispatchEvent(new Event('blur'));
    });
  });

  it('tracks Shift press and release', () => {
    const { result, unmount } = renderHook(() => useShiftHeld());
    expect(result.current).toBe(false);

    act(() => {
      fireKey('keydown', true);
    });
    expect(result.current).toBe(true);

    act(() => {
      fireKey('keyup', false);
    });
    expect(result.current).toBe(false);
    unmount();
  });

  it('picks up Shift from pointer moves', () => {
    const { result, unmount } = renderHook(() => useShiftHeld());
    act(() => {
      window.dispatchEvent(new MouseEvent('pointermove', { shiftKey: true }));
    });
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new MouseEvent('pointermove', { shiftKey: false }));
    });
    expect(result.current).toBe(false);
    unmount();
  });

  it('clears on window blur', () => {
    const { result, unmount } = renderHook(() => useShiftHeld());
    act(() => {
      fireKey('keydown', true);
    });
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(result.current).toBe(false);
    unmount();
  });
});
