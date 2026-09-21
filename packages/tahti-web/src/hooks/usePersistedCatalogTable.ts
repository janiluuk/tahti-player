import { useCallback, useMemo, useState } from 'react';

import {
  normalizeCatalogView,
  type CatalogColumn,
  type CatalogSort,
  type CatalogTableView,
} from '@tahti-player/ui';

type Layout = { view?: Partial<CatalogTableView>; sort?: CatalogSort | null };
type Stored = Layout & { layouts?: Record<string, Layout> };

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
      layouts: stored?.layouts ?? {},
    };
  });

  const validSort = useCallback(
    (sort: CatalogSort | null | undefined) =>
      columns.some((c) => c.id === sort?.columnId && c.sortable)
        ? (sort ?? null)
        : null,
    [columns],
  );

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

  const saveLayout = useCallback(
    (name: string) => {
      setState((current) => {
        const layouts = {
          ...current.layouts,
          [name]: { view: current.view, sort: current.sort },
        };
        const next = { ...current, layouts };
        writeStored(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );
  const applyLayout = useCallback(
    (name: string) => {
      setState((current) => {
        const layout = current.layouts[name];
        if (!layout) {
          return current;
        }
        const next = {
          ...current,
          view: normalizeCatalogView(columns, layout.view),
          sort: validSort(layout.sort),
        };
        writeStored(storageKey, next);
        return next;
      });
    },
    [columns, storageKey, validSort],
  );
  const deleteLayout = useCallback(
    (name: string) => {
      setState((current) => {
        const rest = { ...current.layouts };
        delete rest[name];
        const next = { ...current, layouts: rest };
        writeStored(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  return useMemo(
    () => ({
      view: state.view,
      sort: state.sort,
      setView,
      setSort,
      layouts: {
        names: Object.keys(state.layouts).sort((a, b) => a.localeCompare(b)),
        onSave: saveLayout,
        onApply: applyLayout,
        onDelete: deleteLayout,
      },
    }),
    [state, setView, setSort, saveLayout, applyLayout, deleteLayout],
  );
}
