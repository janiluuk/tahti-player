import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStudioShellScrollRestore } from './useStudioShellScrollRestore';

describe('useStudioShellScrollRestore', () => {
  let port: HTMLDivElement;

  beforeEach(() => {
    sessionStorage.clear();
    port = document.createElement('div');
    port.setAttribute('data-studio-shell', '');
    Object.defineProperty(port, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 0,
    });
    document.body.appendChild(port);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
  });

  afterEach(() => {
    port.remove();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('restores a saved scroll position for the pathname', () => {
    sessionStorage.setItem('tahti-shell-scroll:/library', '240');
    renderHook(() => useStudioShellScrollRestore('/library'));
    expect(port.scrollTop).toBe(240);
  });

  it('persists the previous path scroll when navigating away', () => {
    const { rerender } = renderHook(
      ({ path }) => useStudioShellScrollRestore(path),
      { initialProps: { path: '/listen' } },
    );
    port.scrollTop = 180;
    rerender({ path: '/radio' });
    expect(sessionStorage.getItem('tahti-shell-scroll:/listen')).toBe('180');
  });
});
