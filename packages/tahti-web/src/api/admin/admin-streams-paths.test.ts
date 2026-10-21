import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  forceStreamOffline,
  pauseStream,
  restartStream,
  resumeStream,
  skipStreamTrack,
} from './admin-streams';

describe('admin stream controls', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['restart', restartStream],
    ['skip', skipStreamTrack],
    ['pause', pauseStream],
    ['resume', resumeStream],
    ['force-offline', forceStreamOffline],
  ] as const)('posts %s to /api/admin/channels/:slug', async (action, call) => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(call('dj-aurora')).resolves.toEqual({ ok: true });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(
      new RegExp(`/api/admin/channels/dj-aurora/${action}$`),
    );
    expect(init?.method).toBe('POST');
  });
});
