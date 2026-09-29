import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchChatSettings, setChatSubscribersOnly } from './moderation';

describe('chat settings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads and patches subscribers-only chat', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(JSON.stringify({ subscribersOnly: true }), {
          status: 200,
        }),
    );
    await expect(fetchChatSettings()).resolves.toMatchObject({
      data: { subscribersOnly: true },
    });
    await expect(setChatSubscribersOnly(true)).resolves.toEqual({
      ok: true,
      subscribersOnly: true,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe('/tahti-api/api/me/chat/settings');
    expect(fetchSpy.mock.calls[1]![1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ subscribersOnly: true }),
    });
  });
});
