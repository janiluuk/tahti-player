import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  hearthisSourceAdapter,
  importSourcePlugin,
  importSourcePlugins,
  oauthAdapterFor,
  oauthSourceAdapters,
  searchSourceAdapters,
  spotifySourceAdapter,
  toolSourceAdapters,
} from './index';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SIBLING_IMPORT_PLUGIN_IDS = [
  'bandcamp',
  'google-drive',
  'hearthis',
  'mixcloud',
  'radio',
  'soundcloud',
  'spotify',
  'stash',
  'upload',
  'url',
] as const;

describe('importSourcePlugins', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('has a unique id for every source', () => {
    const ids = importSourcePlugins.map((plugin) => plugin.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers the sibling GET /api/me/import-plugins catalog', () => {
    expect(importSourcePlugins.map((plugin) => plugin.id).sort()).toEqual(
      [...SIBLING_IMPORT_PLUGIN_IDS].sort(),
    );
  });

  it('exposes an explicit capability contract for every source', () => {
    for (const plugin of importSourcePlugins) {
      expect(plugin.capabilities).toEqual({
        connect: plugin.kind === 'oauth',
        search: expect.any(Boolean),
        import: expect.any(Boolean),
        playback: expect.any(Boolean),
      });
    }
  });

  it('builds a full oauth URL only for oauth-kind sources', () => {
    for (const plugin of importSourcePlugins) {
      if (plugin.kind === 'oauth') {
        expect(plugin.oauthUrl).toBeTruthy();
        expect(plugin.oauthUrl).toContain(plugin.oauthStartPath);
      } else {
        expect(plugin.oauthUrl).toBeNull();
      }
    }
  });

  it('importSourcePlugin looks up a source by id', () => {
    expect(importSourcePlugin('soundcloud')?.name).toBe('SoundCloud');
    expect(importSourcePlugin('bogus-id' as never)).toBeUndefined();
  });

  it('partitions every source into exactly one runtime adapter group', () => {
    const groupedIds = [
      ...oauthSourceAdapters,
      ...searchSourceAdapters,
      ...toolSourceAdapters,
    ].map((plugin) => plugin.id);

    expect(new Set(groupedIds).size).toBe(importSourcePlugins.length);
    expect(groupedIds).toEqual(
      expect.arrayContaining(importSourcePlugins.map((plugin) => plugin.id)),
    );
  });

  it('oauth adapters disconnect through the provider status route', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await oauthSourceAdapters[0]!.disconnect();
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/me/'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('search adapters keep provider-specific search and import methods', () => {
    expect(spotifySourceAdapter.search).toEqual(expect.any(Function));
    expect(spotifySourceAdapter.addToCollection).toEqual(expect.any(Function));
    expect(hearthisSourceAdapter.search).toEqual(expect.any(Function));
    expect(hearthisSourceAdapter.importTracks).toEqual(expect.any(Function));
    expect(hearthisSourceAdapter.library).toEqual(expect.any(Function));
  });

  it('oauthAdapterFor falls back to MusicBrainz without inventing a catalog adapter', () => {
    const adapter = oauthAdapterFor(
      'musicbrainz',
      '/api/me/musicbrainz/oauth/start',
    );
    expect(adapter.id).toBe('musicbrainz');
    expect(adapter.oauthUrl).toContain('/api/me/musicbrainz/oauth/start');
    expect(adapter).not.toHaveProperty('listAlbums');
  });

  it('checkStatus() delegates to this source’s own connection-status endpoint', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ connected: true, configured: true, username: 'me' }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const soundcloud = importSourcePlugin('soundcloud')!;
    const result = await soundcloud.checkStatus();

    expect(result.data).toEqual({
      connected: true,
      configured: true,
      username: 'me',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/tahti-api/api/me/soundcloud',
      expect.anything(),
    );
  });
});
