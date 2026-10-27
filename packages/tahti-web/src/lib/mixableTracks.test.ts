import { describe, expect, it, vi } from 'vitest';

import {
  addToPrepare,
  findMixableTracks,
  mixableQueries,
  rankMatches,
} from './mixableTracks';
import type { NativeLibraryTrack, TahtiNativeLibrary } from './nativeLibrary';

function track(
  id: string,
  bpm: number | null,
  musicalKey: string | null,
  available = true,
): NativeLibraryTrack {
  return { id, title: id, artist: 'A', bpm, musicalKey, available } as never;
}

describe('mixableQueries', () => {
  it('asks for each neighbouring key within each tempo range', () => {
    const queries = mixableQueries(track('x', 128, 'Am'), {
      tolerancePercent: 6,
      halfDouble: false,
    });
    expect(queries).toHaveLength(4);
    expect(queries[0]!.relation).toBe('same');
    expect(queries[0]!.definition.rules).toEqual([
      { field: 'key', op: 'is', value: 'Am' },
      { field: 'bpm', op: 'between', value: '120.3', value2: '135.7' },
    ]);
    expect(queries.map((query) => query.definition.rules[0]!.value)).toEqual([
      'Am',
      'Em',
      'Dm',
      'C',
    ]);
  });

  it('falls back to tempo only, or key only, and gives up with neither', () => {
    expect(
      mixableQueries(track('x', 128, null), {
        tolerancePercent: 6,
        halfDouble: true,
      }).map((query) => query.relation),
    ).toEqual([null, null, null]);
    expect(
      mixableQueries(track('x', null, '8A'), {
        tolerancePercent: 6,
        halfDouble: true,
      }),
    ).toHaveLength(4);
    expect(
      mixableQueries(track('x', null, null), {
        tolerancePercent: 6,
        halfDouble: true,
      }),
    ).toEqual([]);
  });
});

describe('rankMatches', () => {
  it('drops the track itself and missing files, keeps the best relation, sorts by closeness', () => {
    const ranked = rankMatches(
      track('src', 128, 'Am'),
      [
        { relation: 'relative', tracks: [track('b', 128, 'C')] },
        {
          relation: 'same',
          tracks: [
            track('src', 128, 'Am'),
            track('a', 132, 'Am'),
            track('c', 128, 'Am'),
            track('gone', 128, 'Am', false),
          ],
        },
        { relation: 'up', tracks: [track('b', 128, 'C')] },
      ],
      10,
    );
    expect(ranked.map((match) => [match.track.id, match.relation])).toEqual([
      ['c', 'same'],
      ['a', 'same'],
      ['b', 'up'],
    ]);
    expect(ranked[1]!.bpmShift).toBe(3.1);
  });
});

describe('findMixableTracks', () => {
  it('evaluates unsaved smart drafts and ranks what comes back', async () => {
    const evaluate = vi.fn((_id, definition) =>
      Promise.resolve({
        tracks:
          definition.rules[0].value === 'Em' ? [track('e', 126, 'Em')] : [],
        total: 0,
      }),
    );
    const library = {
      analysis: { smart: { evaluate } },
    } as unknown as TahtiNativeLibrary;
    const found = await findMixableTracks(library, track('x', 128, 'Am'), {
      tolerancePercent: 6,
      halfDouble: false,
    });
    expect(evaluate).toHaveBeenCalledTimes(4);
    expect(evaluate.mock.calls[0]![0]).toBeNull();
    expect(found.map((match) => match.track.id)).toEqual(['e']);
  });
});

describe('addToPrepare', () => {
  it('creates the playlist once and skips tracks already on it', async () => {
    const playlists = {
      list: vi.fn().mockResolvedValue([{ id: 'p1', name: 'prepare' }]),
      create: vi.fn(),
      trackIds: vi.fn().mockResolvedValue(['a']),
      addTracks: vi.fn().mockResolvedValue(1),
    };
    const library = { playlists } as unknown as TahtiNativeLibrary;
    await expect(addToPrepare(library, ['a', 'b'], 'Prepare')).resolves.toEqual(
      {
        playlistName: 'prepare',
        created: false,
      },
    );
    expect(playlists.create).not.toHaveBeenCalled();
    expect(playlists.addTracks).toHaveBeenCalledWith('p1', ['b']);
  });

  it('makes the playlist when it does not exist', async () => {
    const playlists = {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'p2', name: 'Prepare' }),
      trackIds: vi.fn().mockResolvedValue([]),
      addTracks: vi.fn().mockResolvedValue(1),
    };
    const library = { playlists } as unknown as TahtiNativeLibrary;
    await expect(addToPrepare(library, ['a'], 'Prepare')).resolves.toEqual({
      playlistName: 'Prepare',
      created: true,
    });
    expect(playlists.addTracks).toHaveBeenCalledWith('p2', ['a']);
  });
});
