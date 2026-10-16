import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { buildReleaseCreate, runReleasesCreate } from './releases-create.mjs';

const CREATED = {
  id: 'rel_9',
  title: 'Night Drive EP',
  type: 'EP',
  state: 'DRAFT',
  releaseDate: '2026-11-01T00:00:00.000Z',
  genre: 'Techno',
  smartLinkSlug: 'artist-night-drive-ep',
  tracks: [
    {
      id: 't1',
      position: 1,
      title: 'Night Drive',
      status: 'PENDING',
      durationSec: 245,
      isrc: null,
    },
  ],
};

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('buildReleaseCreate', () => {
  it('maps flags to the API body', () => {
    expect(
      buildReleaseCreate(' Night Drive EP ', {
        type: 'ep',
        date: '2026-11-01',
        description: 'Four late tracks',
        genre: ' Techno ',
      }),
    ).toEqual({
      title: 'Night Drive EP',
      type: 'EP',
      releaseDate: '2026-11-01',
      description: 'Four late tracks',
      genre: 'Techno',
    });
  });

  it('defaults to a single released today', () => {
    expect(
      buildReleaseCreate('Solo', {}, new Date(2026, 9, 16, 23, 30)),
    ).toEqual({ title: 'Solo', type: 'SINGLE', releaseDate: '2026-10-16' });
  });

  it('rejects bad values before calling the API', () => {
    expect(() => buildReleaseCreate('  ', {})).toThrow('Missing release title');
    expect(() => buildReleaseCreate('x', { type: 'mixtape' })).toThrow(
      'Invalid --type "mixtape"',
    );
    expect(() => buildReleaseCreate('x', { date: '1.11.2026' })).toThrow(
      'Invalid --date',
    );
    expect(() => buildReleaseCreate('x', { date: '2026-13-01' })).toThrow(
      'Invalid --date',
    );
  });
});

describe('runReleasesCreate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the release and prints it with its tracklist', async () => {
    const fetchMock = mockFetchJson(CREATED, 201);
    const output = await runReleasesCreate(TEST_CONFIG, 'Night Drive EP', {
      type: 'ep',
      date: '2026-11-01',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/releases',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Night Drive EP',
          type: 'EP',
          releaseDate: '2026-11-01',
        }),
      }),
    );
    expect(output).toContain('Created "Night Drive EP" (rel_9) as a draft.');
    expect(output).toContain('artist-night-drive-ep');
    expect(output).toContain('4:05');
  });

  it('turns each --sound into a track, in order', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ id: 's_1', title: 'Night Drive', durationSec: 244.6 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: 's_2', title: 'Dawn', durationSec: null }),
      )
      .mockResolvedValueOnce(jsonResponse(CREATED, 201));
    vi.stubGlobal('fetch', fetchMock);

    await runReleasesCreate(TEST_CONFIG, 'Night Drive EP', {
      date: '2026-11-01',
      sound: ['s_1', 's_2'],
    });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://api.example.test/api/me/sound/s_1',
      'https://api.example.test/api/me/sound/s_2',
      'https://api.example.test/api/me/releases',
    ]);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).tracks).toEqual([
      { title: 'Night Drive', soundId: 's_1', durationSec: 245 },
      { title: 'Dawn', soundId: 's_2' },
    ]);
  });

  it('stops before creating anything when a sound is not found', async () => {
    const fetchMock = mockFetchJson({ error: 'Sound item not found' }, 404);
    await expect(
      runReleasesCreate(TEST_CONFIG, 'EP', { sound: ['nope'] }),
    ).rejects.toThrow('Sound item not found');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refuses more tracks than a release holds', async () => {
    const fetchMock = mockFetchJson({});
    await expect(
      runReleasesCreate(TEST_CONFIG, 'Box set', {
        sound: Array.from({ length: 51 }, (_, i) => `s_${i}`),
      }),
    ).rejects.toThrow('at most 50 tracks');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('prints the API response with --json', async () => {
    mockFetchJson(CREATED, 201);
    const output = await runReleasesCreate(TEST_CONFIG, 'Night Drive EP', {
      json: true,
    });
    expect(JSON.parse(output)).toEqual(CREATED);
  });

  it('shows the API error for a read-only token', async () => {
    mockFetchJson({ error: 'This API token does not have write access' }, 403);
    await expect(runReleasesCreate(TEST_CONFIG, 'EP', {})).rejects.toThrow(
      'Token invalid or missing scope',
    );
  });
});
