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

/** The public page order a sort maps to; modes the API can't keep
 * (newest first, Z–A) are saved as the artist's own order. */
export function apiTrackSortMode(
  mode: SoundSortMode,
): 'MANUAL' | 'TIME' | 'NAME' {
  return mode === 'OLDEST' ? 'TIME' : mode === 'TITLE_ASC' ? 'NAME' : 'MANUAL';
}

export function soundSortModeFromApi(
  mode: 'MANUAL' | 'TIME' | 'NAME' | undefined,
): SoundSortMode {
  return mode === 'TIME' ? 'OLDEST' : mode === 'NAME' ? 'TITLE_ASC' : 'OWN';
}
