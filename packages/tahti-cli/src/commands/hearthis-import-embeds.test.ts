import { afterEach, describe, expect, it, vi } from 'vitest';

import { runHearthisImportEmbeds } from './hearthis-import-embeds.mjs';

const config = { apiUrl: 'https://api.example.test', token: 'tahti_test' };

function response(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

const listing = {
  total: 3,
  items: [
    { id: 's1', title: 'Night Drive', source: 'HEARTHIS_EMBED' },
    { id: 's2', title: 'Locked Set', source: 'HEARTHIS_EMBED' },
    { id: 's3', title: 'Already Real', source: 'UPLOAD' },
  ],
};

describe('runHearthisImportEmbeds', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the embeds without importing on a dry run', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(200, listing));
    vi.stubGlobal('fetch', fetchMock);
    const out = await runHearthisImportEmbeds(config, { dryRun: true });
    expect(out).toContain('Night Drive');
    expect(out).toContain('Locked Set');
    expect(out).not.toContain('Already Real');
    expect(out).toContain('2 would import');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]![0])).toContain(
      '/api/me/sound?source=HEARTHIS&limit=100&offset=0',
    );
  });

  it('imports each embed and reports the ones hearthis.at will not hand over', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/me/sound?')) {
        return response(200, listing);
      }
      if (url.includes('/s1/import-embed')) {
        return response(202, { status: 'importing' });
      }
      return response(409, {
        error:
          'The artist has not enabled downloads for this track on hearthis.at',
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const out = await runHearthisImportEmbeds(config, { json: true });
    expect(JSON.parse(out)).toEqual([
      { id: 's1', title: 'Night Drive', status: 'importing', detail: '' },
      {
        id: 's2',
        title: 'Locked Set',
        status: 'not downloadable',
        detail: 'downloads are off on hearthis.at',
      },
    ]);
    const posts = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('import-embed'),
    );
    expect(posts).toHaveLength(2);
  });

  it('says so when no embeds are left', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response(200, { total: 0, items: [] })),
    );
    expect(await runHearthisImportEmbeds(config)).toBe(
      'No hearthis.at embeds left in your library.',
    );
  });
});
