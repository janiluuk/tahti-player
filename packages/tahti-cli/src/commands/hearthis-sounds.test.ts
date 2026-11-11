import { afterEach, describe, expect, it, vi } from 'vitest';

import { CONFIG, stubApis } from './hearthis-api-stub';
import { fetchLibrary, findLibraryMatch } from './hearthis-sounds.mjs';

const TRACK = { id: '42', title: 'Night  Drive', durationSec: 300 };

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

  it('needs the length within 2 seconds and a known length', () => {
    const sound = (id: string, durationSec: number | null) => ({
      id,
      title: 'Night Drive',
      durationSec,
    });
    expect(findLibraryMatch(TRACK, [sound('a', 303)])).toBeNull();
    expect(findLibraryMatch(TRACK, [sound('a', null)])).toBeNull();
    expect(findLibraryMatch(TRACK, [sound('a', 298)])?.sound.id).toBe('a');
  });

  it('never reuses an embed or a sound that failed processing', () => {
    expect(
      findLibraryMatch(TRACK, [
        {
          id: 'embed',
          title: 'Night Drive',
          durationSec: 300,
          embedProvider: 'HEARTHIS',
        },
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
