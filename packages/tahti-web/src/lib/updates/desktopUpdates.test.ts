import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  initDesktopUpdates,
  useDesktopUpdateStore,
  type TahtiNativeUpdater,
} from './desktopUpdates';

function nativeUpdater(
  overrides: Partial<TahtiNativeUpdater> = {},
): TahtiNativeUpdater {
  return {
    check: vi.fn(async () => ({ version: '1.48.0', notes: 'Fixes' })),
    install: vi.fn(async (onProgress: (percent: number) => void) => {
      onProgress(40);
      onProgress(100);
    }),
    relaunch: vi.fn(async () => undefined),
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  useDesktopUpdateStore.setState({
    status: 'idle',
    update: null,
    progress: 0,
    error: null,
    checkOnStart: true,
  });
});

afterEach(() => {
  globalThis.__TAHTI_NATIVE_UPDATER__ = undefined;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useDesktopUpdateStore', () => {
  it('does nothing outside the desktop app', async () => {
    expect(await useDesktopUpdateStore.getState().check()).toBeNull();
    expect(useDesktopUpdateStore.getState().status).toBe('idle');
  });

  it('finds, installs and relaunches into a new release', async () => {
    const native = nativeUpdater();
    globalThis.__TAHTI_NATIVE_UPDATER__ = native;
    const store = useDesktopUpdateStore.getState();

    expect(await store.check()).toEqual({ version: '1.48.0', notes: 'Fixes' });
    expect(useDesktopUpdateStore.getState().status).toBe('available');

    await store.install();
    expect(useDesktopUpdateStore.getState()).toMatchObject({
      status: 'ready',
      progress: 100,
    });

    await store.relaunch();
    expect(native.relaunch).toHaveBeenCalled();
  });

  it('says when the app is up to date', async () => {
    globalThis.__TAHTI_NATIVE_UPDATER__ = nativeUpdater({
      check: async () => null,
    });
    await useDesktopUpdateStore.getState().check();
    expect(useDesktopUpdateStore.getState().status).toBe('up-to-date');
  });

  it('keeps the error when the feed cannot be read', async () => {
    globalThis.__TAHTI_NATIVE_UPDATER__ = nativeUpdater({
      check: async () => {
        throw new Error('offline');
      },
    });
    await useDesktopUpdateStore.getState().check();
    expect(useDesktopUpdateStore.getState()).toMatchObject({
      status: 'error',
      error: 'offline',
    });
  });

  it('remembers that checking is turned off', () => {
    useDesktopUpdateStore.getState().setCheckOnStart(false);
    expect(localStorage.getItem('tahti-desktop-update-check-off')).toBe('1');
    useDesktopUpdateStore.getState().setCheckOnStart(true);
    expect(localStorage.getItem('tahti-desktop-update-check-off')).toBeNull();
  });
});

describe('initDesktopUpdates', () => {
  it('offers a found release in a toast shortly after start', async () => {
    vi.useFakeTimers();
    const info = vi.spyOn(toast, 'info');
    globalThis.__TAHTI_NATIVE_UPDATER__ = nativeUpdater();
    initDesktopUpdates();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(info).toHaveBeenCalledWith(
      'Tahti Player 1.48.0 is available',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Install' }),
      }),
    );
  });

  it('stays quiet when checking is turned off', async () => {
    vi.useFakeTimers();
    const native = nativeUpdater();
    globalThis.__TAHTI_NATIVE_UPDATER__ = native;
    useDesktopUpdateStore.getState().setCheckOnStart(false);
    initDesktopUpdates();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(native.check).not.toHaveBeenCalled();
  });
});
