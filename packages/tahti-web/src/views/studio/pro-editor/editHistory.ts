export type EditHistory<T> = { past: T[]; future: T[] };

export const HISTORY_LIMIT = 100;

/** Edits with the same key this close together become one undo step (a
 * slider drag, a burst of nudges). */
export const COALESCE_MS = 600;

export const emptyHistory = <T>(): EditHistory<T> => ({
  past: [],
  future: [],
});

/** History after replacing `current` with a new value. `coalesce` merges
 * this edit into the previous undo step instead of adding one. */
export function recordEdit<T>(
  history: EditHistory<T>,
  current: T,
  coalesce: boolean,
): EditHistory<T> {
  return {
    past: coalesce
      ? history.past
      : [...history.past, current].slice(-HISTORY_LIMIT),
    future: [],
  };
}

export function undoEdit<T>(
  history: EditHistory<T>,
  current: T,
): { history: EditHistory<T>; value: T } | null {
  const value = history.past[history.past.length - 1];
  if (value === undefined) {
    return null;
  }
  return {
    history: {
      past: history.past.slice(0, -1),
      future: [current, ...history.future],
    },
    value,
  };
}

export function redoEdit<T>(
  history: EditHistory<T>,
  current: T,
): { history: EditHistory<T>; value: T } | null {
  const [value, ...rest] = history.future;
  if (value === undefined) {
    return null;
  }
  return {
    history: {
      past: [...history.past, current].slice(-HISTORY_LIMIT),
      future: rest,
    },
    value,
  };
}
