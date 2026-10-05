import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import {
  loadLibraryItems,
  loadRadioItems,
  loadSearchItems,
  resolveLibraryPlayUrl,
  toLibraryPlayItem,
  toSearchPlayItem,
} from './api.mjs';

describe('shell api helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps library and search rows', () => {
    expect(
      toLibraryPlayItem({ id: '1', title: 'T', durationSec: 12 }),
    ).toMatchObject({
      id: '1',
      title: 'T',
      kind: 'track',
      source: 'library',
    });
    expect(
      toSearchPlayItem({
        id: '2',
        title: 'S',
        artistName: 'A',
        channelSlug: 'a',
      }),
    ).toMatchObject({
      source: 'search',
      url: null,
      artist: 'A',
    });
  });

  it('loads library items via GET /api/me/sound', async () => {
    const fetchMock = mockFetchJson([
      { id: '1', title: 'One', durationSec: 10 },
    ]);
    const items = await loadLibraryItems(TEST_CONFIG);
    expect(items).toHaveLength(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/me/sound');
  });

  it('loads search items without requiring a stream URL', async () => {
    mockFetchJson({
      tracks: [
        {
          id: 't1',
          title: 'Night',
          artistName: 'X',
          channelSlug: 'x',
          durationSec: 1,
        },
      ],
      hasMore: false,
    });
    const items = await loadSearchItems(TEST_CONFIG, 'night');
    expect(items[0].url).toBeNull();
  });

  it('resolves library play URL from editor/source', async () => {
    mockFetchJson({ url: 'https://cdn.example/a.flac', durationSec: 9 });
    await expect(resolveLibraryPlayUrl(TEST_CONFIG, 'abc')).resolves.toBe(
      'https://cdn.example/a.flac',
    );
  });

  it('builds radio list from channel HLS + enabled presets', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes('/api/channels/tahti-radio')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            hlsUrl: 'https://hls.example/tahti-radio/index.m3u8',
          }),
        };
      }
      if (String(url).includes('/api/v1/radio')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            live: true,
            channel: { artistName: 'Guest DJ' },
          }),
        };
      }
      if (String(url).includes('/presets/enabled')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            presets: [
              {
                id: 'p1',
                name: 'Station',
                genre: 'Electronic',
                streamUrl: 'https://stream.example/a.m3u',
              },
            ],
          }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);

    const items = await loadRadioItems(TEST_CONFIG);
    expect(items[0]).toMatchObject({
      id: 'tahti-radio',
      title: 'Tahti Radio',
      artist: 'Guest DJ',
      url: 'https://hls.example/tahti-radio/index.m3u8',
      kind: 'live',
    });
    expect(items[1]).toMatchObject({
      id: 'p1',
      title: 'Station',
      url: 'https://stream.example/a.m3u',
    });
  });
});
