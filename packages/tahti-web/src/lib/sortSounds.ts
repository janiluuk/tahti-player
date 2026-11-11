import type { CollectionTrackSortMode } from '../api/studio-types';

export type SoundSortMode =
  'OWN' | 'NEWEST' | 'OLDEST' | 'TITLE_ASC' | 'TITLE_DESC';

export type SortableSound = {
  id: string;
  title: string;
  date: string | null;
  artworkUrl: string | null;
};

const time = (sound: SortableSound) =>
  sound.date ? new Date(sound.date).getTime() || 0 : 0;

/** `own` reordered by `mode`; OWN returns it unchanged. Ties keep own order. */
export function sortSounds(
  own: SortableSound[],
  mode: SoundSortMode,
): SortableSound[] {
  const compare: Record<
    Exclude<SoundSortMode, 'OWN'>,
    (a: SortableSound, b: SortableSound) => number
  > = {
    NEWEST: (a, b) => time(b) - time(a),
    OLDEST: (a, b) => time(a) - time(b),
    TITLE_ASC: (a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
    TITLE_DESC: (a, b) =>
      b.title.localeCompare(a.title, undefined, { sensitivity: 'base' }),
  };
  return mode === 'OWN' ? own : [...own].sort(compare[mode]);
}

/** A copy of `list` with the entry at `from` moved to `to` (clamped). */
export function moveSound<T>(list: T[], from: number, to: number): T[] {
  const target = Math.max(0, Math.min(list.length - 1, to));
  if (from === target || from < 0 || from >= list.length) {
    return list;
  }
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved as T);
  return next;
}

export function apiTrackSortMode(mode: SoundSortMode): CollectionTrackSortMode {
  if (mode === 'OLDEST') {
    return 'TIME';
  }
  if (mode === 'NEWEST') {
    return 'TIME_DESC';
  }
  if (mode === 'TITLE_ASC') {
    return 'NAME';
  }
  if (mode === 'TITLE_DESC') {
    return 'NAME_DESC';
  }
  return 'MANUAL';
}

export function soundSortModeFromApi(
  mode: CollectionTrackSortMode | undefined,
): SoundSortMode {
  if (mode === 'TIME') {
    return 'OLDEST';
  }
  if (mode === 'TIME_DESC') {
    return 'NEWEST';
  }
  if (mode === 'NAME') {
    return 'TITLE_ASC';
  }
  if (mode === 'NAME_DESC') {
    return 'TITLE_DESC';
  }
  return 'OWN';
}
