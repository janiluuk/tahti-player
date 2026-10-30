import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useScreenWakeLock } from './useScreenWakeLock';

function stubWakeLock() {
  const release = vi.fn(() => Promise.resolve());
  const request = vi.fn(() => Promise.resolve({ release }));
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request },
  });
  return { request, release };
}

describe('useScreenWakeLock', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock');
  });

  it('requests a screen lock while active and releases it after', async () => {
    const { request, release } = stubWakeLock();
    const { rerender } = renderHook(({ active }) => useScreenWakeLock(active), {
      initialProps: { active: true },
    });
    expect(request).toHaveBeenCalledWith('screen');
    await Promise.resolve();
    await Promise.resolve();

    rerender({ active: false });
    expect(release).toHaveBeenCalled();
  });

  it('does nothing while inactive', () => {
    const { request } = stubWakeLock();
    renderHook(() => useScreenWakeLock(false));
    expect(request).not.toHaveBeenCalled();
  });
});
