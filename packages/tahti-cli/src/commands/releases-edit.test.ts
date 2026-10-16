import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import {
  buildReleasePatch,
  mergeLinks,
  runReleasesEdit,
} from './releases-edit.mjs';

const RELEASE = {
  id: 'rel_1',
  title: 'First EP',
  type: 'EP',
  state: 'PUBLISHED',
  releaseDate: '2026-11-01T00:00:00.000Z',
  smartLinkSlug: 'artist-first-ep',
  smartLinkTargets: { spotify: 'https://open.spotify.com/album/1' },
  tracks: [
    {
      id: 't1',
      position: 1,
      title: 'Opener',
      status: 'READY',
      durationSec: 201,
      isrc: null,
    },
  ],
};

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

describe('buildReleasePatch', () => {
  it('maps flags to the API field names', () => {
    expect(
      buildReleasePatch({
        state: 'Published',
        description: 'Out now',
        date: '2026-11-01',
        pin: true,
        footer: 'off',
      }),
    ).toEqual({
      patch: {
        state: 'PUBLISHED',
        description: 'Out now',
        releaseDate: '2026-11-01',
        pinned: true,
        showPoweredByFooter: false,
      },
      links: null,
    });
    expect(buildReleasePatch({ unpin: true, description: '' })).toEqual({
      patch: { pinned: false, description: '' },
      links: null,
    });
  });

  it('parses --link values', () => {
    expect(
      buildReleasePatch({
        link: ['Bandcamp=https://artist.bandcamp.com/album/x', 'spotify='],
      }),
    ).toEqual({
      patch: {},
      links: { bandcamp: 'https://artist.bandcamp.com/album/x', spotify: '' },
    });
  });

  it('rejects bad values before calling the API', () => {
    expect(() => buildReleasePatch({})).toThrow('Nothing to change');
    expect(() => buildReleasePatch({ state: 'live' })).toThrow(
      'Invalid --state "live"',
    );
    expect(() => buildReleasePatch({ date: 'tomorrow' })).toThrow(
      'Invalid --date',
    );
    expect(() => buildReleasePatch({ footer: 'yes' })).toThrow(
      'Invalid --footer',
    );
    expect(() => buildReleasePatch({ pin: true, unpin: true })).toThrow(
      'not both',
    );
    expect(() => buildReleasePatch({ link: ['myspace=https://x'] })).toThrow(
      'Invalid --link',
    );
    expect(() => buildReleasePatch({ link: ['spotify'] })).toThrow(
      'Invalid --link',
    );
    expect(() => buildReleasePatch({ link: ['spotify=open.spotify'] })).toThrow(
      'must start with http',
    );
  });
});

describe('mergeLinks', () => {
  it('keeps the other services and drops the emptied ones', () => {
    expect(
      mergeLinks(
        { spotify: 'https://s', tidal: 'https://t' },
        { tidal: '', bandcamp: 'https://b' },
      ),
    ).toEqual({ spotify: 'https://s', bandcamp: 'https://b' });
    expect(mergeLinks(null, { apple: 'https://a' })).toEqual({
      apple: 'https://a',
    });
  });
});

describe('runReleasesEdit', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a PATCH and prints the release as saved', async () => {
    const fetchMock = mockFetchJson(RELEASE);
    const output = await runReleasesEdit(TEST_CONFIG, 'rel_1', {
      state: 'published',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/releases/rel_1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ state: 'PUBLISHED' }),
      }),
    );
    expect(output).toContain('PUBLISHED');
    expect(output).toContain('STORE LINKS   spotify');
    expect(output).toContain('Opener');
  });

  it('merges --link onto the links the release already has', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(RELEASE))
      .mockResolvedValueOnce(jsonResponse(RELEASE));
    vi.stubGlobal('fetch', fetchMock);

    await runReleasesEdit(TEST_CONFIG, 'rel_1', {
      link: ['bandcamp=https://artist.bandcamp.com/album/x'],
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/me/releases/rel_1',
    );
    expect(fetchMock.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          smartLinkTargets: {
            spotify: 'https://open.spotify.com/album/1',
            bandcamp: 'https://artist.bandcamp.com/album/x',
          },
        }),
      }),
    );
  });

  it('prints the API response with --json', async () => {
    mockFetchJson(RELEASE);
    const output = await runReleasesEdit(TEST_CONFIG, 'rel_1', {
      unpin: true,
      json: true,
    });
    expect(JSON.parse(output)).toEqual(RELEASE);
  });

  it('needs an id', async () => {
    await expect(
      runReleasesEdit(TEST_CONFIG, undefined, { pin: true }),
    ).rejects.toThrow('Missing release id');
  });

  it('shows why the API refused to publish', async () => {
    mockFetchJson({ error: 'Add at least one track before publishing' }, 400);
    await expect(
      runReleasesEdit(TEST_CONFIG, 'rel_1', { state: 'published' }),
    ).rejects.toThrow('Add at least one track before publishing');
    mockFetchJson({ error: 'Release not found' }, 404);
    await expect(
      runReleasesEdit(TEST_CONFIG, 'nope', { pin: true }),
    ).rejects.toThrow('Release not found');
  });
});
