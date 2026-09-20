import { useCallback, useMemo, useState } from 'react';

import {
  normalizeCatalogView,
  type CatalogColumn,
  type CatalogSort,
  type CatalogTableView,
} from '@tahti-player/ui';

type Stored = { view?: Partial<CatalogTableView>; sort?: CatalogSort | null };

function readStored(key: string): Stored | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: Stored) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / blocked storage: the view still works, just not saved.
  }
}

/**
 * Column choice, order, widths and sort for a CatalogTable, remembered on
 * this device. A stored view is re-normalized against the current columns, so
 * columns added or removed in a later version never break it.
 */
export function usePersistedCatalogTable<T>(
  storageKey: string,
  columns: ReadonlyArray<CatalogColumn<T>>,
) {
  const [state, setState] = useState(() => {
    const stored = readStored(storageKey);
    const knownSort = columns.some(
      (column) => column.id === stored?.sort?.columnId && column.sortable,
    );
    return {
      view: normalizeCatalogView(columns, stored?.view),
      sort: knownSort ? (stored?.sort ?? null) : null,
    };
  });

  const setView = useCallback(
    (view: CatalogTableView) => {
      setState((current) => {
        const next = { ...current, view };
        writeStored(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );
  const setSort = useCallback(
    (sort: CatalogSort | null) => {
      setState((current) => {
        const next = { ...current, sort };
        writeStored(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  return useMemo(
    () => ({ view: state.view, sort: state.sort, setView, setSort }),
    [state, setView, setSort],
  );
}
