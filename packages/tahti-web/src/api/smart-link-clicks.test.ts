import { afterEach, describe, expect, it, vi } from 'vitest';

import { recordSmartLinkClick } from './smart-link-clicks';

describe('recordSmartLinkClick', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the click without waiting for it', () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    recordSmartLinkClick('night-drive', 'Spotify');
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/smartlink/click');
    expect(init!.method).toBe('POST');
    expect(init!.keepalive).toBe(true);
    expect(JSON.parse(init!.body as string)).toMatchObject({
      smartLinkSlug: 'night-drive',
      platform: 'spotify',
    });
  });

  it('swallows a failed request', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    expect(() => recordSmartLinkClick('night-drive', 'bandcamp')).not.toThrow();
    await Promise.resolve();
  });
});
