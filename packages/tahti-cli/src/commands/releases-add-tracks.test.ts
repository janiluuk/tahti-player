import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { runReleasesAddTracks } from './releases-add-tracks.mjs';

const RELEASE = {
  id: 'rel_9',
  title: 'Night Drive EP',
  type: 'EP',
  state: 'DRAFT',
  releaseDate: '2026-11-01T00:00:00.000Z',
  tracks: [{ id: 't1', position: 1, title: 'Night Drive', durationSec: 245 }],
};

const UPDATED = {
  ...RELEASE,
  tracks: [
    ...RELEASE.tracks,
    { id: 't2', position: 2, title: 'Dawn', durationSec: 190 },
    { id: 't3', position: 3, title: 'Afterglow', durationSec: null },
  ],
};

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function stubFetch(...responses: ReturnType<typeof jsonResponse>[]) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('runReleasesAddTracks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds each sound as a track, in order, and prints the new tracklist', async () => {
    const fetchMock = stubFetch(
      jsonResponse(RELEASE),
      jsonResponse({ id: 's_2', title: 'Dawn', durationSec: 189.6 }),
      jsonResponse({ id: 's_3', title: 'Afterglow', durationSec: null }),
      jsonResponse(UPDATED.tracks[1], 201),
      jsonResponse(UPDATED.tracks[2], 201),
      jsonResponse(UPDATED),
    );

    const output = await runReleasesAddTracks(TEST_CONFIG, 'rel_9', {
      sound: ['s_2', 's_3'],
    });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://api.example.test/api/me/releases/rel_9',
      'https://api.example.test/api/me/sound/s_2',
      'https://api.example.test/api/me/sound/s_3',
      'https://api.example.test/api/me/releases/rel_9/tracks',
      'https://api.example.test/api/me/releases/rel_9/tracks',
      'https://api.example.test/api/me/releases/rel_9',
    ]);
    expect(fetchMock.mock.calls[3][1]).toMatchObject({ method: 'POST' });
    expect(JSON.parse(fetchMock.mock.calls[3][1].body)).toEqual({
      title: 'Dawn',
      soundId: 's_2',
      durationSec: 190,
    });
    expect(JSON.parse(fetchMock.mock.calls[4][1].body)).toEqual({
      title: 'Afterglow',
      soundId: 's_3',
    });
    expect(output).toContain('Added 2 tracks to "Night Drive EP".');
    expect(output).toContain('Afterglow');
    expect(output).toContain('3:10');
  });

  it('prints the added tracks with --json', async () => {
    stubFetch(
      jsonResponse(RELEASE),
      jsonResponse({ id: 's_2', title: 'Dawn', durationSec: 190 }),
      jsonResponse(UPDATED.tracks[1], 201),
    );
    const output = await runReleasesAddTracks(TEST_CONFIG, 'rel_9', {
      sound: ['s_2'],
      json: true,
    });
    expect(JSON.parse(output)).toEqual([UPDATED.tracks[1]]);
  });

  it('needs a release id and at least one --sound', async () => {
    const fetchMock = mockFetchJson({});
    await expect(
      runReleasesAddTracks(TEST_CONFIG, undefined, { sound: ['s_2'] }),
    ).rejects.toThrow('Missing release id');
    await expect(
      runReleasesAddTracks(TEST_CONFIG, 'rel_9', {}),
    ).rejects.toThrow('Give at least one --sound');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stops before looking up sounds when the release is not found', async () => {
    const fetchMock = mockFetchJson({ error: 'Release not found' }, 404);
    await expect(
      runReleasesAddTracks(TEST_CONFIG, 'nope', { sound: ['s_2'] }),
    ).rejects.toThrow('Release not found');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('adds nothing when a sound is not found', async () => {
    const fetchMock = stubFetch(
      jsonResponse(RELEASE),
      jsonResponse({ id: 's_2', title: 'Dawn' }),
      jsonResponse({ error: 'Sound item not found' }, 404),
    );
    await expect(
      runReleasesAddTracks(TEST_CONFIG, 'rel_9', { sound: ['s_2', 'nope'] }),
    ).rejects.toThrow('Sound item not found');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('says how many tracks were added before a failure', async () => {
    stubFetch(
      jsonResponse(RELEASE),
      jsonResponse({ id: 's_2', title: 'Dawn' }),
      jsonResponse({ id: 's_3', title: 'Afterglow' }),
      jsonResponse(UPDATED.tracks[1], 201),
      jsonResponse({ error: 'This API token does not have write access' }, 403),
    );
    await expect(
      runReleasesAddTracks(TEST_CONFIG, 'rel_9', { sound: ['s_2', 's_3'] }),
    ).rejects.toThrow('Added 1 of 2 tracks, then: Token invalid');
  });
});
