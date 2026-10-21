import { afterEach, describe, expect, it, vi } from 'vitest';

import { prepareLastFmWithOwnKey } from './integrations';

describe('prepareLastFmWithOwnKey', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the key pair and returns the Last.fm auth URL', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ authUrl: 'https://www.last.fm/api/auth/?token=t' }),
          { status: 200 },
        ),
      );
    await expect(
      prepareLastFmWithOwnKey({
        apiKey: ' key ',
        apiSecret: ' secret ',
        returnTo: 'https://beta.tahti.live/settings/integrations',
      }),
    ).resolves.toEqual({
      ok: true,
      authUrl: 'https://www.last.fm/api/auth/?token=t',
    });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/me/integrations/lastfm/prepare');
    expect(JSON.parse(init!.body as string)).toEqual({
      apiKey: 'key',
      apiSecret: 'secret',
      returnTo: 'https://beta.tahti.live/settings/integrations',
    });
  });

  it('passes on the API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'API key and shared secret are required' }),
        { status: 400 },
      ),
    );
    await expect(
      prepareLastFmWithOwnKey({ apiKey: 'k', apiSecret: '', returnTo: 'x' }),
    ).resolves.toEqual({
      ok: false,
      error: 'API key and shared secret are required',
    });
  });
});
