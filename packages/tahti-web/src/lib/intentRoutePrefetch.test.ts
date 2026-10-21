import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Loader = typeof import('./intentRoutePrefetch');

async function freshLoader(): Promise<Loader> {
  vi.resetModules();
  return import('./intentRoutePrefetch');
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
  vi.restoreAllMocks();
});

describe('prefetchListenCardIntent', () => {
  it('returns without importing when saveData is enabled', async () => {
    setSaveData(true);
    const { prefetchListenCardIntent } = await freshLoader();
    expect(() => prefetchListenCardIntent('channel')).not.toThrow();
    expect(() => prefetchListenCardIntent('radio')).not.toThrow();
  });
});
