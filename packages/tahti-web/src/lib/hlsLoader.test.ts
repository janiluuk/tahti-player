import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loads = { count: 0 };

type Loader = typeof import('./hlsLoader');

async function freshLoader(): Promise<Loader> {
  vi.resetModules();
  vi.doMock('hls.js', () => {
    loads.count += 1;
    return { default: class FakeHls {} };
  });
  return import('./hlsLoader');
}

async function flush() {
  await vi.dynamicImportSettled();
}

function setSaveData(saveData: boolean | undefined) {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: saveData === undefined ? undefined : { saveData },
  });
}

function stubAirPlay(nativeHls: boolean) {
  Object.defineProperty(window, 'WebKitPlaybackTargetAvailabilityEvent', {
    configurable: true,
    value: class {},
  });
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue(
    nativeHls ? 'maybe' : '',
  );
}

beforeEach(() => {
  loads.count = 0;
  setSaveData(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'WebKitPlaybackTargetAvailabilityEvent');
});

describe('loadHls', () => {
  it('shares one import across callers', async () => {
    const { loadHls } = await freshLoader();
    const first = loadHls();
    expect(loadHls()).toBe(first);
    await first;
    expect(loadHls()).toBe(first);
    expect(loads.count).toBe(1);
  });

  it('reuses a prefetched import for playback', async () => {
    const { loadHls, prefetchHls } = await freshLoader();
    prefetchHls();
    prefetchHls();
    await flush();
    await loadHls();
    expect(loads.count).toBe(1);
  });
});

describe('scheduleIdleHlsPrefetch', () => {
  it('prefetches once when the browser goes idle', async () => {
    const callbacks: IdleRequestCallback[] = [];
    const requestIdleCallback = vi.fn((cb: IdleRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    vi.stubGlobal('requestIdleCallback', requestIdleCallback);
    vi.stubGlobal('cancelIdleCallback', vi.fn());
    const { scheduleIdleHlsPrefetch } = await freshLoader();

    scheduleIdleHlsPrefetch();
    scheduleIdleHlsPrefetch();
    expect(requestIdleCallback).toHaveBeenCalledTimes(1);
    expect(loads.count).toBe(0);

    callbacks[0]?.({ didTimeout: false, timeRemaining: () => 50 });
    await flush();
    expect(loads.count).toBe(1);
  });

  it('falls back to a timeout without requestIdleCallback', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const { scheduleIdleHlsPrefetch } = await freshLoader();

    scheduleIdleHlsPrefetch();
    expect(loads.count).toBe(0);
    await vi.runAllTimersAsync();
    vi.useRealTimers();
    await flush();
    expect(loads.count).toBe(1);
  });

  it('does nothing once cancelled', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const { scheduleIdleHlsPrefetch } = await freshLoader();

    const cancel = scheduleIdleHlsPrefetch();
    cancel();
    await vi.runAllTimersAsync();
    vi.useRealTimers();
    await flush();
    expect(loads.count).toBe(0);
  });
});

describe('prefetchHls', () => {
  it('skips when the user asked to save data', async () => {
    setSaveData(true);
    const { prefetchHls } = await freshLoader();
    prefetchHls();
    await flush();
    expect(loads.count).toBe(0);
  });

  it('skips in AirPlay-capable browsers that play HLS natively', async () => {
    stubAirPlay(true);
    const { prefetchHls } = await freshLoader();
    prefetchHls();
    await flush();
    expect(loads.count).toBe(0);
  });

  it('still prefetches on AirPlay browsers without native HLS', async () => {
    stubAirPlay(false);
    const { prefetchHls } = await freshLoader();
    prefetchHls();
    await flush();
    expect(loads.count).toBe(1);
  });
});
