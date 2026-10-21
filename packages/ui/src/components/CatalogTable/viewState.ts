import type { ReactNode } from 'react';

export type CatalogColumn<T> = {
  id: string;
  header: string;
  /** Default width in px. */
  width: number;
  sortable?: boolean;
  align?: 'left' | 'right';
  /** Can never be hidden (the column that identifies a row). */
  required?: boolean;
  hiddenByDefault?: boolean;
  render: (row: T) => ReactNode;
};

export type CatalogSort = { columnId: string; descending: boolean };

/** What the user chose to see: column order, hidden columns, custom widths. */
export type CatalogTableView = {
  order: string[];
  hidden: string[];
  widths: Record<string, number>;
};

export const MIN_COLUMN_WIDTH = 60;
export const MAX_COLUMN_WIDTH = 800;

export function defaultCatalogView<T>(
  columns: ReadonlyArray<CatalogColumn<T>>,
): CatalogTableView {
  return {
    order: columns.map((column) => column.id),
    hidden: columns
      .filter((column) => column.hiddenByDefault && !column.required)
      .map((column) => column.id),
    widths: {},
  };
}

function clampWidth(width: number) {
  return Math.min(
    MAX_COLUMN_WIDTH,
    Math.max(MIN_COLUMN_WIDTH, Math.round(width)),
  );
}

/**
 * Makes any stored view safe for the current column set: unknown columns are
 * dropped, columns added since it was saved are appended (hidden if they
 * default to hidden), required columns are forced visible, widths clamped.
 */
export function normalizeCatalogView<T>(
  columns: ReadonlyArray<CatalogColumn<T>>,
  stored: Partial<CatalogTableView> | null | undefined,
): CatalogTableView {
  const defaults = defaultCatalogView(columns);
  if (!stored) {
    return defaults;
  }
  const known = new Set(columns.map((column) => column.id));
  const storedOrder = (stored.order ?? []).filter(
    (id, index, all) => known.has(id) && all.indexOf(id) === index,
  );
  const added = defaults.order.filter((id) => !storedOrder.includes(id));
  const required = new Set(
    columns.filter((column) => column.required).map((column) => column.id),
  );
  const hidden = new Set(
    (stored.hidden ?? []).filter((id) => known.has(id) && !required.has(id)),
  );
  for (const id of added) {
    if (defaults.hidden.includes(id)) {
      hidden.add(id);
    }
  }
  const widths: Record<string, number> = {};
  for (const [id, width] of Object.entries(stored.widths ?? {})) {
    if (known.has(id) && Number.isFinite(width)) {
      widths[id] = clampWidth(width);
    }
  }
  return { order: [...storedOrder, ...added], hidden: [...hidden], widths };
}

export type ResolvedCatalogColumn<T> = CatalogColumn<T> & { pxWidth: number };

export function resolveCatalogColumns<T>(
  columns: ReadonlyArray<CatalogColumn<T>>,
  view: CatalogTableView,
): ResolvedCatalogColumn<T>[] {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const hidden = new Set(view.hidden);
  return view.order.flatMap((id) => {
    const column = byId.get(id);
    if (!column || (hidden.has(id) && !column.required)) {
      return [];
    }
    return [{ ...column, pxWidth: view.widths[id] ?? column.width }];
  });
}

export function moveColumn(
  view: CatalogTableView,
  id: string,
  delta: -1 | 1,
): CatalogTableView {
  const from = view.order.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= view.order.length) {
    return view;
  }
  const order = [...view.order];
  [order[from], order[to]] = [order[to] as string, order[from] as string];
  return { ...view, order };
}

export function setColumnVisible(
  view: CatalogTableView,
  id: string,
  visible: boolean,
): CatalogTableView {
  const hidden = view.hidden.filter((item) => item !== id);
  return { ...view, hidden: visible ? hidden : [...hidden, id] };
}

export function setColumnWidth(
  view: CatalogTableView,
  id: string,
  width: number,
): CatalogTableView {
  return { ...view, widths: { ...view.widths, [id]: clampWidth(width) } };
}

/** asc -> desc -> unsorted, the usual header-click cycle. */
export function nextSort(
  current: CatalogSort | null,
  columnId: string,
): CatalogSort | null {
  if (current?.columnId !== columnId) {
    return { columnId, descending: false };
  }
  return current.descending ? null : { columnId, descending: true };
}
