import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearClientLogs,
  CLIENT_LOG_LIMIT,
  clientLogScopes,
  formatLogArgs,
  getClientLogs,
  installClientLogCapture,
  logClientEvent,
  serializeClientLogs,
  subscribeClientLogs,
} from './clientLogs';

afterEach(() => {
  clearClientLogs();
});

describe('clientLogs', () => {
  it('appends entries with level, scope and message', () => {
    logClientEvent('warn', 'playback', 'Stream stalled');
    const [entry] = getClientLogs();
    expect(entry).toMatchObject({
      level: 'warn',
      source: { type: 'core', scope: 'playback' },
      message: 'Stream stalled',
    });
  });

  it(`keeps only the newest ${CLIENT_LOG_LIMIT} entries`, () => {
    for (let i = 0; i < CLIENT_LOG_LIMIT + 5; i += 1) {
      logClientEvent('info', 'app', `entry ${i}`);
    }
    const logs = getClientLogs();
    expect(logs).toHaveLength(CLIENT_LOG_LIMIT);
    expect(logs[0]?.message).toBe('entry 5');
    expect(logs.at(-1)?.message).toBe(`entry ${CLIENT_LOG_LIMIT + 4}`);
  });

  it('notifies subscribers once per microtask batch', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeClientLogs(listener);
    logClientEvent('info', 'app', 'a');
    logClientEvent('info', 'app', 'b');
    expect(listener).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('lists sorted unique scopes', () => {
    logClientEvent('info', 'queue', 'x');
    logClientEvent('info', 'auth', 'y');
    logClientEvent('info', 'queue', 'z');
    expect(clientLogScopes(getClientLogs())).toEqual(['auth', 'queue']);
  });

  it('serializes one line per entry', () => {
    logClientEvent('error', 'window', 'Boom');
    expect(serializeClientLogs(getClientLogs())).toMatch(
      /^\d{4}-\d{2}-\d{2}T.+Z ERROR \[window\] Boom$/,
    );
  });

  it('formats mixed console arguments', () => {
    expect(formatLogArgs(['count', 2, { a: 1 }])).toBe('count 2 {"a":1}');
    expect(formatLogArgs([new Error('bad')])).toContain('bad');
  });

  it('mirrors console.warn and console.error until uninstalled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const uninstall = installClientLogCapture();
    console.warn('careful');
    console.error('broken', 42);
    uninstall();
    console.warn('not captured');

    expect(getClientLogs().map((l) => [l.level, l.message])).toEqual([
      ['warn', 'careful'],
      ['error', 'broken 42'],
    ]);
    expect(warn).toHaveBeenCalledWith('careful');
    warn.mockRestore();
    error.mockRestore();
  });
});
