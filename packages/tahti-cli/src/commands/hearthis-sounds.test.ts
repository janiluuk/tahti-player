import { afterEach, describe, expect, it, vi } from 'vitest';

import { CONFIG, stubApis } from './hearthis-api-stub';
import { fetchLibrary, findLibraryMatch } from './hearthis-sounds.mjs';

const TRACK = {
  id: '42',
  title: 'Night  Drive',
  durationSec: 300,
  url: 'https://hearthis.at/yaniho/night-drive/',
};

describe('findLibraryMatch', () => {
  it('prefers the hearthis export id over a title match', () => {
    const match = findLibraryMatch(TRACK, [
      { id: 'a', title: 'night drive', durationSec: 300 },
      { id: 'b', title: 'Other', durationSec: 1, hearthisExportId: '42' },
    ]);
    expect(match).toEqual({
      sound: expect.objectContaining({ id: 'b' }),
      matchedBy: 'hearthis export id',
    });
  });

  it('reuses a same-titled sound within 2 seconds, or one still processing', () => {
    const sound = (id: string, durationSec: number | null) => ({
      id,
      title: 'Night  drive',
      durationSec,
    });
    expect(findLibraryMatch(TRACK, [sound('a', 298)])).toMatchObject({
      sound: { id: 'a' },
      matchedBy: 'title + duration',
    });
    expect(findLibraryMatch(TRACK, [sound('a', null)])).toMatchObject({
      sound: { id: 'a' },
      matchedBy: 'title (still processing)',
    });
  });

  it('prefers a ready copy when the library already holds two', () => {
    expect(
      findLibraryMatch(TRACK, [
        {
          id: 'pending',
          title: 'Night Drive',
          durationSec: null,
          status: 'PENDING',
        },
        {
          id: 'ready',
          title: 'Night Drive',
          durationSec: 300,
          status: 'READY',
        },
      ])?.sound?.id,
    ).toBe('ready');
  });

  it('reports a conflict instead of a free upload for a same title with another length', () => {
    const match = findLibraryMatch(TRACK, [
      { id: 'other', title: 'Night Drive', durationSec: 420 },
    ]);
    expect(match).toMatchObject({ sound: { id: 'other' } });
    expect(match?.conflict).toMatch(/different length/);
  });

  it('reports an embed of the track as a conflict and ignores failed sounds', () => {
    const embed = findLibraryMatch(TRACK, [
      {
        id: 'embed',
        title: 'Renamed embed',
        durationSec: 300,
        embedProvider: 'HEARTHIS',
        embedSourceUrl: `${TRACK.url}?ref=x`,
      },
    ]);
    expect(embed?.conflict).toMatch(/import-embeds/);
    expect(
      findLibraryMatch(TRACK, [
        {
          id: 'broken',
          title: 'Night Drive',
          durationSec: 300,
          status: 'ERROR',
        },
      ]),
    ).toBeNull();
  });
});

describe('fetchLibrary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pages through the whole library', async () => {
    const library = Array.from({ length: 5 }, (_, index) => ({
      id: `s${index}`,
      title: `t${index}`,
      durationSec: 1,
    }));
    const { calls } = stubApis({ library });

    const result = await fetchLibrary(CONFIG, { pageSize: 2 });

    expect(result.complete).toBe(true);
    expect(result.sounds.map((sound) => sound.id)).toEqual([
      's0',
      's1',
      's2',
      's3',
      's4',
    ]);
    expect(calls.map((call) => new URL(call.url).search)).toEqual([
      '?limit=2&offset=0',
      '?limit=2&offset=2',
      '?limit=2&offset=4',
    ]);
  });
});
