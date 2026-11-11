import { describe, expect, it } from 'vitest';

import {
  apiTrackSortMode,
  moveSound,
  sortSounds,
  soundSortModeFromApi,
  type SortableSound,
} from './sortSounds';

const sound = (id: string, title: string, date: string | null) => ({
  id,
  title,
  date,
  artworkUrl: null,
});
const own: SortableSound[] = [
  sound('a', 'beta', '2024-06-01'),
  sound('b', 'Alpha', '2026-01-01'),
  sound('c', 'gamma', null),
];
const ids = (list: SortableSound[]) => list.map((item) => item.id);

describe('sortSounds', () => {
  it('keeps own order', () => {
    expect(ids(sortSounds(own, 'OWN'))).toEqual(['a', 'b', 'c']);
  });

  it('sorts by date both ways, undated last when newest first', () => {
    expect(ids(sortSounds(own, 'NEWEST'))).toEqual(['b', 'a', 'c']);
    expect(ids(sortSounds(own, 'OLDEST'))).toEqual(['c', 'a', 'b']);
  });

  it('sorts titles without caring about case', () => {
    expect(ids(sortSounds(own, 'TITLE_ASC'))).toEqual(['b', 'a', 'c']);
    expect(ids(sortSounds(own, 'TITLE_DESC'))).toEqual(['c', 'a', 'b']);
  });
});

describe('moveSound', () => {
  it('moves an entry and clamps the target', () => {
    expect(moveSound(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveSound(['a', 'b', 'c'], 0, 9)).toEqual(['b', 'c', 'a']);
    expect(moveSound(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });
});

describe('api sort modes', () => {
  it('maps the modes the API keeps and falls back to own order', () => {
    expect(apiTrackSortMode('OLDEST')).toBe('TIME');
    expect(apiTrackSortMode('NEWEST')).toBe('TIME_DESC');
    expect(apiTrackSortMode('TITLE_ASC')).toBe('NAME');
    expect(apiTrackSortMode('TITLE_DESC')).toBe('NAME_DESC');
    expect(apiTrackSortMode('OWN')).toBe('MANUAL');
    expect(soundSortModeFromApi('NAME')).toBe('TITLE_ASC');
    expect(soundSortModeFromApi('NAME_DESC')).toBe('TITLE_DESC');
    expect(soundSortModeFromApi('TIME_DESC')).toBe('NEWEST');
    expect(soundSortModeFromApi(undefined)).toBe('OWN');
  });
});
