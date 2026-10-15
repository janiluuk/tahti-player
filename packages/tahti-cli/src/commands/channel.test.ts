import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';
import { formatChannel, runChannel } from './channel.mjs';

const LIVE = {
  slug: 'night-drive',
  state: 'LIVE',
  signalConnected: true,
  hlsUrl: 'https://hls.example.test/night-drive/index.m3u8',
  nextBroadcastAt: null,
  nextBroadcastNote: null,
  user: {
    username: 'nightdrive',
    displayName: 'Night Drive',
    chatEnabled: true,
  },
  nowPlaying: { title: 'Harbour', artistName: 'DJ Kaski' },
  nowPlayingNext: { title: 'Tunnel', artistName: 'Night Drive' },
};
const OFFLINE = {
  ...LIVE,
  state: 'OFFLINE',
  signalConnected: false,
  hlsUrl: null,
  nextBroadcastAt: '2026-10-20T18:00:00.000Z',
  nextBroadcastNote: 'Album release set',
  user: {
    username: 'nightdrive',
    displayName: 'me@example.com',
    chatEnabled: false,
  },
  nowPlaying: null,
  nowPlayingNext: null,
};

function mockRoutes(routes: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string) => {
    const path = new URL(url).pathname;
    const body = routes[path];
    return {
      ok: body !== undefined,
      status: body !== undefined ? 200 : 404,
      json: async () => body ?? { error: 'Channel not found' },
    };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('formatChannel', () => {
  it('shows a live channel with what plays now and next', () => {
    const output = formatChannel(LIVE);
    expect(output).toContain('State           LIVE');
    expect(output).toContain('Now playing     DJ Kaski — Harbour');
    expect(output).toContain('Up next         Night Drive — Tunnel');
    expect(output).toContain('Stream          https://hls.example.test/');
  });

  it('shows an offline channel with its next broadcast and no email as the name', () => {
    const output = formatChannel(OFFLINE);
    expect(output).toContain('State           OFFLINE');
    expect(output).toContain(
      'Next broadcast  2026-10-20 18:00 UTC (Album release set)',
    );
    expect(output).toContain('Artist          nightdrive');
    expect(output).toContain('Chat            off');
    expect(output).not.toContain('@');
  });

  it('says when a live channel has no audio coming in', () => {
    expect(formatChannel({ ...LIVE, signalConnected: false })).toContain(
      'LIVE (no audio signal)',
    );
  });
});

describe('runChannel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads a named channel without sending the token', async () => {
    const fetchMock = mockRoutes({ '/api/channels/night-drive': LIVE });
    await runChannel(TEST_CONFIG, 'night-drive');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as {
      headers: Record<string, string>;
    };
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('finds the token’s own channel when no slug is given', async () => {
    const fetchMock = mockRoutes({
      '/api/auth/me': {
        username: 'nightdrive',
        channel: { slug: 'night-drive' },
      },
      '/api/channels/night-drive': LIVE,
    });
    expect(await runChannel(TEST_CONFIG, undefined)).toContain('night-drive');
    expect(
      fetchMock.mock.calls.map((call) => new URL(call[0]).pathname),
    ).toEqual(['/api/auth/me', '/api/channels/night-drive']);
  });

  it('asks for a slug when the account has no channel', async () => {
    mockRoutes({ '/api/auth/me': { username: 'listener', channel: null } });
    await expect(runChannel(TEST_CONFIG, undefined)).rejects.toThrow(
      'This account has no channel',
    );
  });

  it('shows the API message for an unknown channel', async () => {
    mockRoutes({});
    await expect(runChannel(TEST_CONFIG, 'nope')).rejects.toThrow(
      'Channel not found',
    );
  });

  it('prints the API response unchanged with --json', async () => {
    mockRoutes({ '/api/channels/night-drive': LIVE });
    expect(
      JSON.parse(await runChannel(TEST_CONFIG, 'night-drive', { json: true })),
    ).toEqual(LIVE);
  });
});
