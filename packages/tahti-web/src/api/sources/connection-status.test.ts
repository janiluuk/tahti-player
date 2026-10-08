import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchConnectionStatus } from './catalog';
import { fetchSoundcloudTracks } from './soundcloud';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchConnectionStatus', () => {
  it('passes through what the API says about an OAuth source', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ connected: false, configured: false })),
    );

    const { data } = await fetchConnectionStatus('soundcloud');

    expect(data).toEqual({ connected: false, configured: false });
  });

  it('marks a failed status request as unavailable, not as needing setup', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ error: 'Unauthorized' }, 401)),
    );

    const { data } = await fetchConnectionStatus('soundcloud');

    expect(data.unavailable).toBe(true);
    expect(data.connected).toBe(false);
  });
});

describe('fetchSoundcloudTracks', () => {
  it('returns the tracks the API lists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ tracks: [{ id: '1', title: 'One' }] })),
    );

    const result = await fetchSoundcloudTracks();

    expect(result.data).toEqual([{ id: '1', title: 'One' }]);
    expect(result.needsReconnect).toBeUndefined();
  });

  it.each([
    ['an expired token', 401, 'PROVIDER_TOKEN_EXPIRED'],
    ['an account that was never connected', 403, 'PROVIDER_NOT_CONNECTED'],
  ])('asks for a reconnect on %s', async (_label, status, code) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ error: 'nope', code }, status)),
    );

    const result = await fetchSoundcloudTracks();

    expect(result).toMatchObject({ data: [], needsReconnect: true });
  });

  it('does not blame SoundCloud when the Tahti session is what expired', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ error: 'Unauthorized' }, 401)),
    );

    const result = await fetchSoundcloudTracks();

    expect(result.data).toEqual([]);
    expect(result.needsReconnect).toBeUndefined();
  });
});
