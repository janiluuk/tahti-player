import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  listenSourceForPath,
  referrerHostOf,
  sendListenHeartbeat,
} from './listen-heartbeat';

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

  it('adds the referrer host and track position when given', () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    sendListenHeartbeat(
      { soundId: 's1' },
      'CHANNEL_PAGE',
      { positionSec: 30, durationSec: 200 },
      'instagram.com',
    );
    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toEqual({
      soundId: 's1',
      source: 'CHANNEL_PAGE',
      referrerHost: 'instagram.com',
      positionSec: 30,
      durationSec: 200,
    });
  });

  it('keeps only an outside referrer host', () => {
    expect(
      referrerHostOf(
        'https://www.instagram.com/p/abc?igsh=1',
        'beta.tahti.live',
      ),
    ).toBe('instagram.com');
    expect(
      referrerHostOf('https://beta.tahti.live/u/x', 'beta.tahti.live'),
    ).toBeNull();
    expect(referrerHostOf('', 'beta.tahti.live')).toBeNull();
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
