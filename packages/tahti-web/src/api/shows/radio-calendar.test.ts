import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchRadioCalendar } from './radio-calendar';

const FROM = '2026-11-01T00:00:00.000Z';
const TO = '2026-11-08T00:00:00.000Z';

const PUBLIC_SLOT = {
  id: 'slot-1',
  startAt: '2026-11-02T18:00:00.000Z',
  endAt: '2026-11-02T20:00:00.000Z',
  note: 'Late night ambient',
  showType: 'LIVE_SET',
  coverUrl: null,
  colorScheme: null,
  nextShowAt: null,
  lastShowAt: null,
  artist: {
    displayName: 'Northern Lights',
    username: 'northern-lights',
    avatarUrl: null,
    channelSlug: 'northern-lights',
  },
};

describe('fetchRadioCalendar', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('reads the public slot calendar when signed out, so anonymous visitors get no 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([PUBLIC_SLOT])));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchRadioCalendar(FROM, TO, { signedIn: false });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `/tahti-api/api/v1/radio/slots?from=${encodeURIComponent(FROM)}&to=${encodeURIComponent(TO)}`,
    );
    expect(result).toEqual({
      data: [
        {
          id: 'slot-1',
          startAt: PUBLIC_SLOT.startAt,
          endAt: PUBLIC_SLOT.endAt,
          note: 'Late night ambient',
          showType: 'LIVE_SET',
          channelSlug: 'northern-lights',
          username: 'northern-lights',
          displayName: 'Northern Lights',
          coverUrl: null,
          isMine: false,
        },
      ],
      meta: { source: 'api' },
    });
  });

  it('falls back to the username for the channel slug when the artist has no channel slug', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              ...PUBLIC_SLOT,
              artist: { ...PUBLIC_SLOT.artist, channelSlug: null },
            },
          ]),
        ),
      ),
    );

    const result = await fetchRadioCalendar(FROM, TO, { signedIn: false });

    expect(result.data[0]?.channelSlug).toBe('northern-lights');
  });

  it('keeps the member calendar when signed in, so own slots stay cancellable', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]'));
    vi.stubGlobal('fetch', fetchMock);

    await fetchRadioCalendar(FROM, TO, { signedIn: true });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `/tahti-api/api/me/radio-slot-bookings?from=${encodeURIComponent(FROM)}&to=${encodeURIComponent(TO)}`,
    );
  });
});
