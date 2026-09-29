import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchChannelSlugRedirect } from './channel-redirect';

describe('fetchChannelSlugRedirect', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves a renamed channel's new slug", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ slug: 'new-name' }), { status: 200 }),
      );
    await expect(fetchChannelSlugRedirect('old-name')).resolves.toBe(
      'new-name',
    );
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/channels/old-name/redirect',
    );
  });

  it('is null without an active redirect', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'No active redirect' }), {
        status: 404,
      }),
    );
    await expect(fetchChannelSlugRedirect('gone')).resolves.toBeNull();
  });
});
