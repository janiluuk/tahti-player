import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  formatHearthisSetTracksTable,
  parseHearthisSetPermalink,
  runHearthisSet,
} from './hearthis-set.mjs';

describe('parseHearthisSetPermalink', () => {
  it('accepts a set URL or bare permalink', () => {
    expect(
      parseHearthisSetPermalink('https://hearthis.at/set/378936-9675121/'),
    ).toBe('378936-9675121');
    expect(parseHearthisSetPermalink('378936-9675121')).toBe('378936-9675121');
  });

  it('rejects track URLs and empty input', () => {
    expect(
      parseHearthisSetPermalink('https://hearthis.at/yaniho/credo/'),
    ).toBeNull();
    expect(parseHearthisSetPermalink('')).toBeNull();
  });
});

describe('formatHearthisSetTracksTable', () => {
  it('shows position, downloadable flag, and duration', () => {
    const table = formatHearthisSetTracksTable([
      {
        position: 1,
        title: 'Credo',
        username: 'Carlos Andana',
        durationSec: 4015,
        downloadable: true,
        downloadFilename: 'Credo.flac',
      },
      {
        position: 2,
        title: 'Stream only',
        username: 'Carlos Andana',
        durationSec: 120,
        downloadable: false,
        downloadFilename: null,
      },
    ]);
    expect(table).toContain('01');
    expect(table).toContain('Credo');
    expect(table).toContain('yes');
    expect(table).toContain('Credo.flac');
    expect(table).toContain('no');
  });
});

describe('runHearthisSet', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects a missing or invalid permalink', async () => {
    await expect(
      runHearthisSet(
        { apiUrl: 'https://api.example.test', token: 'tahti_test' },
        undefined,
      ),
    ).rejects.toThrow(/Missing set permalink/);

    await expect(
      runHearthisSet(
        { apiUrl: 'https://api.example.test', token: 'tahti_test' },
        'https://soundcloud.com/x',
      ),
    ).rejects.toThrow(/Invalid set permalink/);
  });

  it('lists tracks for a set permalink', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        permalink: '378936-9675121',
        url: 'https://hearthis.at/set/378936-9675121/',
        tracks: [
          {
            position: 1,
            id: '1',
            title: 'Credo',
            username: 'Carlos Andana',
            durationSec: 65,
            downloadable: true,
            downloadFilename: 'Credo.mp3',
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const output = await runHearthisSet(
      { apiUrl: 'https://api.example.test', token: 'tahti_test' },
      'https://hearthis.at/set/378936-9675121/',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/imports/hearthis/sets/378936-9675121/tracks',
      expect.anything(),
    );
    expect(output).toContain('Credo');
    expect(output).toContain('1 downloadable');
  });
});
