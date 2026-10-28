import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cancelListeningParty,
  createListeningParty,
  fetchChannelListeningParties,
  fetchListeningParty,
  fetchMyListeningParties,
  listeningPartyTrackStreamUrl,
  updateListeningParty,
} from './listening-parties';
import { MOCK_LISTENING_PARTY_IDS } from './listening-parties-mock';
import { resetMockOverrides } from './mock-overrides';
import { setMockSessionUser } from './mock-session';

const ARTIST = {
  id: 'mock-artist-1',
  email: 'artist@tahti.live',
  username: 'northern-lights',
  displayName: 'Northern Lights',
  role: 'ARTIST' as const,
  isMember: true,
  channel: { slug: 'northern-lights', state: 'LIVE' as const },
};

function inMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

describe('listening parties against the API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads one party and reports a 404 as not found', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'lp1' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }),
      );
    await expect(fetchListeningParty('lp1')).resolves.toMatchObject({
      data: { id: 'lp1' },
      notFound: false,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/v1/listening-parties/lp1',
    );
    await expect(fetchListeningParty('gone')).resolves.toMatchObject({
      data: null,
      notFound: true,
    });
  });

  it('unwraps the channel and artist lists', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () =>
        Response.json({ items: [{ id: 'lp1' }] }),
      );
    await expect(fetchChannelListeningParties('night drive')).resolves.toEqual({
      data: [{ id: 'lp1' }],
      meta: { source: 'api' },
    });
    await expect(fetchMyListeningParties()).resolves.toMatchObject({
      data: [{ id: 'lp1' }],
    });
    expect(fetchSpy.mock.calls.map((call) => call[0])).toEqual([
      '/tahti-api/api/channels/night%20drive/listening-parties',
      '/tahti-api/api/me/listening-parties',
    ]);
  });

  it('sends create, reschedule and cancel to the artist routes', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json({ id: 'lp1' }));
    await createListeningParty({
      releaseId: 'rel1',
      startAt: '2026-11-06T20:00:00.000Z',
      hostNote: 'Hi',
    });
    await updateListeningParty('lp1', { startAt: '2026-11-07T20:00:00.000Z' });
    await cancelListeningParty('lp1');
    const calls = fetchSpy.mock.calls.map(([url, init]) => [
      url,
      init?.method,
      init?.body,
    ]);
    expect(calls).toEqual([
      [
        '/tahti-api/api/me/listening-parties',
        'POST',
        JSON.stringify({
          releaseId: 'rel1',
          startAt: '2026-11-06T20:00:00.000Z',
          hostNote: 'Hi',
        }),
      ],
      [
        '/tahti-api/api/me/listening-parties/lp1',
        'PATCH',
        JSON.stringify({ startAt: '2026-11-07T20:00:00.000Z' }),
      ],
      ['/tahti-api/api/me/listening-parties/lp1/cancel', 'POST', undefined],
    ]);
  });

  it('keeps the HTTP status of a refused change', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Party already live' }), {
        status: 409,
      }),
    );
    await expect(
      updateListeningParty('lp1', { hostNote: null }),
    ).resolves.toEqual({
      ok: false,
      error: 'Party already live',
      status: 409,
    });
  });

  it('streams a track through the party-scoped route', () => {
    expect(listeningPartyTrackStreamUrl('lp1', 't 2')).toBe(
      '/tahti-api/api/v1/listening-parties/lp1/tracks/t%202/stream',
    );
  });
});

describe('listening parties in the offline mock app', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    resetMockOverrides();
    setMockSessionUser(ARTIST);
  });

  afterEach(() => {
    setMockSessionUser(null);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('seeds one party per state', async () => {
    const states = await Promise.all(
      Object.values(MOCK_LISTENING_PARTY_IDS).map(
        async (id) => (await fetchListeningParty(id)).data?.state,
      ),
    );
    expect(states).toEqual(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELED']);
    const live = (await fetchListeningParty(MOCK_LISTENING_PARTY_IDS.live))
      .data;
    expect(live?.nowPlaying?.position).toBe(2);
    expect(live?.purchaseTiers.length).toBeGreaterThan(0);
    expect(live?.host.displayName).not.toContain('@');
  });

  it('lists only upcoming and live parties on the channel, soonest first', async () => {
    const { data } = await fetchChannelListeningParties('northern-lights');
    expect(data.map((row) => row.state)).toEqual(['LIVE', 'SCHEDULED']);
    expect(
      (await fetchChannelListeningParties('someone-else')).data,
    ).toHaveLength(0);
  });

  it('schedules, reschedules and cancels a party', async () => {
    const created = await createListeningParty({
      releaseId: 'rel-mock-1',
      startAt: inMinutes(60 * 24 * 30),
      hostNote: '  First listen  ',
    });
    if (!created.ok) {
      throw new Error(created.error);
    }
    expect(created.data).toMatchObject({
      state: 'SCHEDULED',
      hostNote: 'First listen',
      release: { title: 'After Hours' },
    });
    expect(created.data.tracks).toHaveLength(2);

    const moved = await updateListeningParty(created.data.id, {
      startAt: inMinutes(60 * 24 * 31),
      hostNote: '',
    });
    expect(moved).toMatchObject({ ok: true, data: { hostNote: null } });

    const mine = await fetchMyListeningParties();
    expect(mine.data[0]?.id).toBe(created.data.id);

    await expect(cancelListeningParty(created.data.id)).resolves.toMatchObject({
      ok: true,
      data: { state: 'CANCELED' },
    });
  });

  it('refuses a start too soon, an overlap and changes once live', async () => {
    await expect(
      createListeningParty({ releaseId: 'rel-mock-1', startAt: inMinutes(1) }),
    ).resolves.toMatchObject({ ok: false, status: 400 });
    const scheduled = (
      await fetchListeningParty(MOCK_LISTENING_PARTY_IDS.scheduled)
    ).data!;
    await expect(
      createListeningParty({
        releaseId: 'rel-mock-1',
        startAt: scheduled.startAt,
      }),
    ).resolves.toMatchObject({ ok: false, status: 409 });
    await expect(
      updateListeningParty(MOCK_LISTENING_PARTY_IDS.live, {
        startAt: inMinutes(600),
      }),
    ).resolves.toMatchObject({ ok: false, status: 409 });
    await expect(
      cancelListeningParty(MOCK_LISTENING_PARTY_IDS.ended),
    ).resolves.toMatchObject({ ok: false, status: 409 });
  });

  it('gives each mock track real sample audio', () => {
    expect(listeningPartyTrackStreamUrl('lp1', 'lp-track-ps-2')).toMatch(
      /SoundHelix-Song-2\.mp3$/,
    );
  });
});
