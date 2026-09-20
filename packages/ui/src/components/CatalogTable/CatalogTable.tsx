import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  LoaderCircleIcon,
  Settings2Icon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import {
  CatalogTableSettingsDialog,
  type CatalogTableSettingsLabels,
} from './CatalogTableSettingsDialog';
import {
  defaultCatalogView,
  nextSort,
  resolveCatalogColumns,
  setColumnWidth,
  type CatalogColumn,
  type CatalogSort,
  type CatalogTableView,
} from './viewState';

const SELECT_WIDTH = 36;
const ACTIONS_WIDTH = 132;
const LOAD_MORE_THRESHOLD = 30;

export type CatalogTableProps<T> = {
  columns: ReadonlyArray<CatalogColumn<T>>;
  view: CatalogTableView;
  onViewChange: (view: CatalogTableView) => void;
  rows: ReadonlyArray<T>;
  /** Rows available in total; more are requested via `onLoadMore` while scrolling. */
  total: number;
  getRowId: (row: T) => string;
  getRowLabel: (row: T) => string;
  sort: CatalogSort | null;
  onSortChange: (sort: CatalogSort | null) => void;
  onLoadMore?: () => void;
  loading?: boolean;
  selectedIds?: ReadonlySet<string>;
  onSelectedIdsChange?: (ids: Set<string>) => void;
  /** Trailing per-row action buttons. */
  renderActions?: (row: T) => ReactNode;
  /** Dims the row (e.g. its file is missing). */
  isRowMuted?: (row: T) => boolean;
  rowHeight?: number;
  /** Plural noun for the count line ("tracks"). */
  itemNoun?: string;
  /** Extra toolbar content, shown next to the settings button. */
  toolbar?: ReactNode;
  settingsLabels?: Partial<CatalogTableSettingsLabels>;
  className?: string;
};

/**
 * Server-driven, virtualized table: sorting and paging happen where the data
 * lives (the caller re-queries on `onSortChange` / `onLoadMore`), only the
 * visible rows are mounted, and the user controls which columns show, their
 * order and widths (persisted by the caller through `view`).
 */
export function CatalogTable<T>({
  columns,
  view,
  onViewChange,
  rows,
  total,
  getRowId,
  getRowLabel,
  sort,
  onSortChange,
  onLoadMore,
  loading = false,
  selectedIds,
  onSelectedIdsChange,
  renderActions,
  isRowMuted,
  rowHeight = 48,
  itemNoun = 'items',
  toolbar,
  settingsLabels,
  className,
}: CatalogTableProps<T>) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const visibleColumns = useMemo(
    () => resolveCatalogColumns(columns, view),
    [columns, view],
  );
  const selectable = Boolean(onSelectedIdsChange);
  const selected = selectedIds ?? new Set<string>();
  const gridTemplate = [
    selectable ? `${SELECT_WIDTH}px` : null,
    ...visibleColumns.map((column) => `${column.pxWidth}px`),
    renderActions ? `${ACTIONS_WIDTH}px` : null,
  ]
    .filter(Boolean)
    .join(' ');
  const contentWidth =
    (selectable ? SELECT_WIDTH : 0) +
    visibleColumns.reduce((sum, column) => sum + column.pxWidth, 0) +
    (renderActions ? ACTIONS_WIDTH : 0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
    initialRect: { width: 0, height: rowHeight * 14 },
  });
  const items = virtualizer.getVirtualItems();
  const lastIndex = items.length ? (items[items.length - 1]?.index ?? 0) : 0;
  useEffect(() => {
    if (
      onLoadMore &&
      !loading &&
      rows.length < total &&
      lastIndex >= rows.length - LOAD_MORE_THRESHOLD
    ) {
      onLoadMore();
    }
  }, [lastIndex, rows.length, total, loading, onLoadMore]);

  const anchorRef = useRef<number | null>(null);
  const toggleRow = (index: number, checked: boolean, range: boolean) => {
    if (!onSelectedIdsChange) {
      return;
    }
    const next = new Set(selected);
    const anchor = anchorRef.current;
    const indexes =
      range && anchor !== null
        ? Array.from(
            { length: Math.abs(index - anchor) + 1 },
            (_, offset) => Math.min(index, anchor) + offset,
          )
        : [index];
    for (const item of indexes) {
      const row = rows[item];
      if (row === undefined) {
        continue;
      }
      if (checked) {
        next.add(getRowId(row));
      } else {
        next.delete(getRowId(row));
      }
    }
    anchorRef.current = index;
    onSelectedIdsChange(next);
  };
  const allLoadedSelected =
    rows.length > 0 && rows.every((row) => selected.has(getRowId(row)));

  const startResize = (
    event: React.PointerEvent<HTMLSpanElement>,
    column: { id: string; pxWidth: number },
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = column.pxWidth;
    let latest = view;
    const move = (moveEvent: PointerEvent) => {
      latest = setColumnWidth(
        view,
        column.id,
        startWidth + moveEvent.clientX - startX,
      );
      onViewChange(latest);
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  return (
    <div
      className={cn('flex min-h-0 flex-1 flex-col gap-2', className)}
      data-testid="catalog-table"
    >
      <div className="flex items-center gap-2">
        <div className="text-foreground-secondary min-w-0 flex-1 truncate text-xs">
          {selectable && selected.size > 0 ? (
            <span>
              {selected.size} selected
              <Button
                size="sm"
                variant="text"
                onClick={() => onSelectedIdsChange?.(new Set())}
              >
                Clear
              </Button>
            </span>
          ) : (
            <span>
              {rows.length < total
                ? `${rows.length.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} loaded`
                : `${total.toLocaleString('en-US')} ${itemNoun}`}
            </span>
          )}
        </div>
        {loading ? (
          <LoaderCircleIcon
            size={14}
            className="animate-spin opacity-60"
            aria-label="Loading"
          />
        ) : null}
        {toolbar}
        <Tooltip content="Table settings" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label="Table settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2Icon size={15} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      <div className="tahti-hide-scrollbar min-h-0 flex-1 overflow-x-auto">
        <div
          role="table"
          aria-rowcount={total}
          className="flex h-full min-h-0 flex-col"
          style={{ minWidth: contentWidth }}
        >
          <div
            role="row"
            className="border-border grid items-center border-b text-xs font-semibold"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {selectable ? (
              <div role="columnheader" className="flex justify-center">
                <input
                  type="checkbox"
                  className="accent-primary h-4 w-4 cursor-pointer"
                  aria-label="Select all loaded tracks"
                  checked={allLoadedSelected}
                  onChange={(event) =>
                    onSelectedIdsChange?.(
                      event.target.checked
                        ? new Set(rows.map(getRowId))
                        : new Set(),
                    )
                  }
                />
              </div>
            ) : null}
            {visibleColumns.map((column) => {
              const active = sort?.columnId === column.id;
              return (
                <div
                  key={column.id}
                  role="columnheader"
                  aria-sort={
                    active
                      ? sort.descending
                        ? 'descending'
                        : 'ascending'
                      : undefined
                  }
                  className="relative flex min-w-0 items-center"
                >
                  {column.sortable ? (
                    <Button
                      variant="text"
                      size="sm"
                      className={cn(
                        'min-w-0 flex-1 gap-1',
                        column.align === 'right' && 'justify-end',
                      )}
                      onClick={() => onSortChange(nextSort(sort, column.id))}
                    >
                      <span className="truncate">{column.header}</span>
                      {active ? (
                        sort.descending ? (
                          <ArrowDownIcon size={12} aria-hidden />
                        ) : (
                          <ArrowUpIcon size={12} aria-hidden />
                        )
                      ) : null}
                    </Button>
                  ) : (
                    <span
                      className={cn(
                        'flex-1 truncate px-2',
                        column.align === 'right' && 'text-right',
                      )}
                    >
                      {column.header}
                    </span>
                  )}
                  <span
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Resize ${column.header}`}
                    className="hover:bg-primary/40 absolute top-1 right-0 bottom-1 w-1.5 cursor-col-resize rounded"
                    onPointerDown={(event) => startResize(event, column)}
                  />
                </div>
              );
            })}
            {renderActions ? <div role="columnheader" /> : null}
          </div>
          <div
            ref={scrollRef}
            className="tahti-hide-scrollbar min-h-0 flex-1 overflow-y-auto"
          >
            <div
              className="relative w-full"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {items.map((item) => {
                const row = rows[item.index];
                if (row === undefined) {
                  return null;
                }
                const id = getRowId(row);
                return (
                  <div
                    key={id}
                    role="row"
                    aria-rowindex={item.index + 1}
                    aria-selected={selectable ? selected.has(id) : undefined}
                    className={cn(
                      'border-border/50 absolute inset-x-0 grid items-center border-b',
                      isRowMuted?.(row) && 'opacity-60',
                    )}
                    style={{
                      height: rowHeight,
                      transform: `translateY(${item.start}px)`,
                      gridTemplateColumns: gridTemplate,
                    }}
                  >
                    {selectable ? (
                      <div role="cell" className="flex justify-center">
                        <input
                          type="checkbox"
                          className="accent-primary h-4 w-4 cursor-pointer"
                          aria-label={`Select ${getRowLabel(row)}`}
                          checked={selected.has(id)}
                          onChange={() => undefined}
                          onClick={(event) =>
                            toggleRow(
                              item.index,
                              (event.target as HTMLInputElement).checked,
                              event.shiftKey,
                            )
                          }
                        />
                      </div>
                    ) : null}
                    {visibleColumns.map((column) => (
                      <div
                        key={column.id}
                        role="cell"
                        className={cn(
                          'min-w-0 truncate px-2 text-sm',
                          column.align === 'right' && 'text-right',
                        )}
                      >
                        {column.render(row)}
                      </div>
                    ))}
                    {renderActions ? (
                      <div
                        role="cell"
                        className="flex items-center justify-end gap-0.5 pr-1"
                      >
                        {renderActions(row)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <CatalogTableSettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        columns={columns}
        view={view}
        onViewChange={onViewChange}
        onReset={() => onViewChange(defaultCatalogView(columns))}
        labels={settingsLabels}
      />
    </div>
  );
}
