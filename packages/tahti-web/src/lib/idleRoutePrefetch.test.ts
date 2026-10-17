import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Loader = typeof import('./idleRoutePrefetch');

async function freshLoader(): Promise<Loader> {
  vi.resetModules();
  return import('./idleRoutePrefetch');
}

function setSaveData(saveData: boolean | undefined) {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: saveData === undefined ? undefined : { saveData },
  });
}

beforeEach(() => {
  setSaveData(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('scheduleIdleRoutePrefetch', () => {
  it('schedules once when the browser goes idle', async () => {
    const callbacks: IdleRequestCallback[] = [];
    const requestIdleCallback = vi.fn((cb: IdleRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    vi.stubGlobal('requestIdleCallback', requestIdleCallback);
    vi.stubGlobal('cancelIdleCallback', vi.fn());
    const { scheduleIdleRoutePrefetch } = await freshLoader();

    scheduleIdleRoutePrefetch();
    scheduleIdleRoutePrefetch();
    expect(requestIdleCallback).toHaveBeenCalledTimes(1);
    expect(callbacks).toHaveLength(1);
  });

  it('falls back to a timeout without requestIdleCallback', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    const { scheduleIdleRoutePrefetch } = await freshLoader();

    const cancel = scheduleIdleRoutePrefetch();
    expect(setTimeoutSpy).toHaveBeenCalled();
    cancel();
  });

  it('cancels a pending idle callback', async () => {
    const cancelIdleCallback = vi.fn();
    vi.stubGlobal(
      'requestIdleCallback',
      vi.fn(() => 7),
    );
    vi.stubGlobal('cancelIdleCallback', cancelIdleCallback);
    const { scheduleIdleRoutePrefetch } = await freshLoader();

    const cancel = scheduleIdleRoutePrefetch();
    cancel();
    expect(cancelIdleCallback).toHaveBeenCalledWith(7);
  });
});

describe('prefetchCommonRoutes', () => {
  it('returns without importing when saveData is enabled', async () => {
    setSaveData(true);
    const { prefetchCommonRoutes } = await freshLoader();
    expect(() => prefetchCommonRoutes()).not.toThrow();
  });
});
