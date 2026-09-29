import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchChatDailyListeners } from './chat-daily-listeners';

describe('fetchChatDailyListeners', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the channel's listeners so far today", async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ count: 12, enabled: true }), {
        status: 200,
      }),
    );
    await expect(fetchChatDailyListeners('night-drive')).resolves.toMatchObject(
      { data: { count: 12, enabled: true } },
    );
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/channels/night-drive/daily-listeners',
    );
  });

  it('returns nothing when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 404 }),
    );
    await expect(fetchChatDailyListeners('x')).resolves.toMatchObject({
      data: null,
    });
  });
});
