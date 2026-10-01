import { afterEach, describe, expect, it, vi } from 'vitest';

import { listenSourceForPath, sendListenHeartbeat } from './listen-heartbeat';

describe('listen heartbeat', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pings the API without waiting', () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    sendListenHeartbeat({ soundId: 's1' }, 'ARTIST_PROFILE');
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/v1/listen/heartbeat');
    expect(init!.keepalive).toBe(true);
    expect(JSON.parse(init!.body as string)).toEqual({
      soundId: 's1',
      source: 'ARTIST_PROFILE',
    });
  });

  it('maps the page to a listen source', () => {
    expect(listenSourceForPath('/radio')).toBe('TAHTI_RADIO');
    expect(listenSourceForPath('/channel/night-drive')).toBe('CHANNEL_PAGE');
    expect(listenSourceForPath('/u/tahti')).toBe('ARTIST_PROFILE');
    expect(listenSourceForPath('/discover')).toBe('DISCOVER');
    expect(listenSourceForPath('/library/tracks')).toBe('LIBRARY');
    expect(listenSourceForPath('/embed/c/night-drive')).toBe('EMBED');
    expect(listenSourceForPath('/')).toBe('OTHER');
  });
});
