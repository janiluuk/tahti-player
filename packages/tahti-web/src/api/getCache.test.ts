import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cachedGet,
  clearGetCache,
  isCacheableGet,
  setGetCacheEnabledForTests,
} from './getCache';

describe('cachedGet', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setGetCacheEnabledForTests(true);
  });

  afterEach(() => {
    setGetCacheEnabledForTests(null);
    vi.useRealTimers();
  });

  it('serves a repeat GET from memory', async () => {
    const load = vi.fn().mockResolvedValue({ n: 1 });
    await expect(cachedGet('/api/a', load)).resolves.toEqual({ n: 1 });
    await expect(cachedGet('/api/a', load)).resolves.toEqual({ n: 1 });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('shares one request between callers asking at once', async () => {
    const load = vi.fn().mockResolvedValue('x');
    const [a, b] = await Promise.all([
      cachedGet('/api/b', load),
      cachedGet('/api/b', load),
    ]);
    expect([a, b]).toEqual(['x', 'x']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('loads again after 30 seconds', async () => {
    const load = vi.fn().mockResolvedValue('x');
    await cachedGet('/api/c', load);
    vi.advanceTimersByTime(30_001);
    await cachedGet('/api/c', load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not keep failures', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue('ok');
    await expect(cachedGet('/api/d', load)).rejects.toThrow('boom');
    await expect(cachedGet('/api/d', load)).resolves.toBe('ok');
  });

  it('loads again after a write clears the cache', async () => {
    const load = vi.fn().mockResolvedValue('x');
    await cachedGet('/api/e', load);
    clearGetCache();
    await cachedGet('/api/e', load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not keep a response that was in flight during a write', async () => {
    let resolve: (value: string) => void = () => undefined;
    const slow = vi.fn(
      () =>
        new Promise<string>((r) => {
          resolve = r;
        }),
    );
    const pending = cachedGet('/api/f', slow);
    clearGetCache();
    resolve('before write');
    await expect(pending).resolves.toBe('before write');
    const fresh = vi.fn().mockResolvedValue('after write');
    await expect(cachedGet('/api/f', fresh)).resolves.toBe('after write');
  });

  it('always loads live endpoints', async () => {
    const load = vi.fn().mockResolvedValue('live');
    await cachedGet('/tahti-api/api/channels/x/now-playing', load);
    await cachedGet('/tahti-api/api/channels/x/now-playing', load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('is off unless enabled', async () => {
    setGetCacheEnabledForTests(null);
    const load = vi.fn().mockResolvedValue('x');
    await cachedGet('/api/g', load);
    await cachedGet('/api/g', load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe('isCacheableGet', () => {
  it.each([
    ['/tahti-api/api/auth/me', false],
    ['/tahti-api/api/me/notifications?unread=1', false],
    ['/tahti-api/api/channels/a/chat', false],
    ['/tahti-api/api/status', false],
    ['/tahti-api/api/channels/a', true],
    ['/tahti-api/api/users/a/profile', true],
    ['/tahti-api/api/discover/releases?limit=12', true],
  ])('%s → %s', (path, expected) => {
    expect(isCacheableGet(path)).toBe(expected);
  });
});
