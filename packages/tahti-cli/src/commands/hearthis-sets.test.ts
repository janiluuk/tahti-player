import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatHearthisSetsTable, runHearthisSets } from './hearthis-sets.mjs';

describe('formatHearthisSetsTable', () => {
  it('renders permalink, title, track count, year, artist', () => {
    const table = formatHearthisSetsTable([
      {
        permalink: '378936-9675121',
        title: 'Recorded sets from gigs',
        trackCount: 176,
        year: null,
        username: 'Yaniho',
      },
    ]);
    expect(table).toContain('PERMALINK');
    expect(table).toContain('378936-9675121');
    expect(table).toContain('Recorded sets from gigs');
    expect(table).toContain('176');
    expect(table).toContain('Yaniho');
  });
});

describe('runHearthisSets', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws when the profile has no hearthis username', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ username: null, sets: [] }),
      }),
    );

    await expect(
      runHearthisSets({
        apiUrl: 'https://api.example.test',
        token: 'tahti_test',
      }),
    ).rejects.toThrow(/hearthis\.at username/);
  });

  it('prints the sets table for a connected account', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        username: 'yaniho',
        sets: [
          {
            id: '378936',
            permalink: '378936-9675121',
            url: 'https://hearthis.at/set/378936-9675121/',
            title: 'Recorded sets from gigs',
            description: '',
            trackCount: 176,
            coverUrl: null,
            username: 'Yaniho',
            userPermalink: 'yaniho',
            year: null,
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const output = await runHearthisSets({
      apiUrl: 'https://api.example.test',
      token: 'tahti_test',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/imports/hearthis/me-sets',
      expect.anything(),
    );
    expect(output).toContain('378936-9675121');
    expect(output).toContain('tahti hearthis set');
  });

  it('returns raw JSON with --json', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ username: 'yaniho', sets: [] }),
      }),
    );

    const output = await runHearthisSets(
      { apiUrl: 'https://api.example.test', token: 'tahti_test' },
      { json: true },
    );
    expect(JSON.parse(output)).toEqual({ username: 'yaniho', sets: [] });
  });
});
