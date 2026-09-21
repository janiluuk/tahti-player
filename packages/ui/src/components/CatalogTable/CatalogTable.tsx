import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  LoaderCircleIcon,
  Settings2Icon,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import {
  CatalogTableSettingsDialog,
  type CatalogLayoutsApi,
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
  /**
   * Offered once every loaded row is selected but more match: selects all
   * `total` matching rows (the owner fetches their ids). Omit to hide it.
   */
  onSelectAllMatching?: () => void;
  selectingAll?: boolean;
  /** Enter or double-click on a row (e.g. play it). */
  onActivateRow?: (row: T) => void;
  /** Keys the table does not handle itself, for the row that has focus. */
  onRowKeyDown?: (event: ReactKeyboardEvent, row: T) => void;
  /** Restores the scroll position when the table mounts with its rows loaded. */
  initialScrollOffset?: number;
  onScrollOffsetChange?: (offset: number) => void;
  /** Named column layouts, managed from the settings dialog. */
  layouts?: CatalogLayoutsApi;
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
  onSelectAllMatching,
  selectingAll = false,
  onActivateRow,
  onRowKeyDown,
  initialScrollOffset,
  onScrollOffsetChange,
  layouts,
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
    initialOffset: initialScrollOffset,
    onChange: (instance) => onScrollOffsetChange?.(instance.scrollOffset ?? 0),
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
  const gridId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const selectRange = (from: number, to: number) => {
    if (!onSelectedIdsChange) {
      return;
    }
    const next = new Set(selected);
    for (
      let index = Math.min(from, to);
      index <= Math.max(from, to);
      index += 1
    ) {
      const row = rows[index];
      if (row !== undefined) {
        next.add(getRowId(row));
      }
    }
    onSelectedIdsChange(next);
  };
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!rows.length || event.target !== event.currentTarget) {
      return;
    }
    const last = rows.length - 1;
    const current = Math.min(activeIndex ?? 0, last);
    const moveTo = (target: number) => {
      const next = Math.max(0, Math.min(last, target));
      event.preventDefault();
      if (event.shiftKey && selectable) {
        const anchor = anchorRef.current ?? current;
        anchorRef.current = anchor;
        selectRange(anchor, next);
      } else {
        anchorRef.current = next;
      }
      setActiveIndex(next);
      virtualizer.scrollToIndex(next);
    };
    const row = rows[current];
    switch (event.key) {
      case 'ArrowDown':
        return moveTo(activeIndex === null ? 0 : current + 1);
      case 'ArrowUp':
        return moveTo(current - 1);
      case 'PageDown':
        return moveTo(current + 10);
      case 'PageUp':
        return moveTo(current - 10);
      case 'Home':
        return moveTo(0);
      case 'End':
        return moveTo(last);
      case ' ':
        if (selectable && row !== undefined) {
          event.preventDefault();
          setActiveIndex(current);
          toggleRow(current, !selected.has(getRowId(row)), false);
        }
        return;
      case 'Enter':
        if (row !== undefined && onActivateRow) {
          event.preventDefault();
          onActivateRow(row);
        }
        return;
      case 'Escape':
        if (selectable && selected.size > 0) {
          event.preventDefault();
          onSelectedIdsChange?.(new Set());
        }
        return;
      default:
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'a' &&
          selectable
        ) {
          event.preventDefault();
          if (onSelectAllMatching && total > rows.length) {
            onSelectAllMatching();
          } else {
            selectRange(0, last);
          }
        } else if (row !== undefined) {
          onRowKeyDown?.(event, row);
        }
    }
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
              {selected.size >= total
                ? `All ${total.toLocaleString('en-US')} selected`
                : `${selected.size.toLocaleString('en-US')} selected`}
              {onSelectAllMatching &&
              allLoadedSelected &&
              selected.size < total ? (
                <Button
                  size="sm"
                  variant="text"
                  disabled={selectingAll}
                  onClick={onSelectAllMatching}
                >
                  {selectingAll ? (
                    <LoaderCircleIcon
                      size={12}
                      className="animate-spin"
                      aria-hidden
                    />
                  ) : null}
                  Select all {total.toLocaleString('en-US')}
                </Button>
              ) : null}
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
          role="grid"
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
            tabIndex={0}
            aria-label="Rows"
            aria-activedescendant={
              activeIndex !== null ? `${gridId}-r${activeIndex}` : undefined
            }
            onKeyDown={handleKeyDown}
            className="focus-visible:ring-primary/50 tahti-hide-scrollbar min-h-0 flex-1 overflow-y-auto focus-visible:ring-2 focus-visible:outline-none"
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
                    id={`${gridId}-r${item.index}`}
                    role="row"
                    aria-rowindex={item.index + 1}
                    onClick={(event) => {
                      if (
                        !(event.target as HTMLElement).closest('button,input')
                      ) {
                        setActiveIndex(item.index);
                        anchorRef.current = item.index;
                        scrollRef.current?.focus({ preventScroll: true });
                      }
                    }}
                    onDoubleClick={(event) => {
                      if (
                        onActivateRow &&
                        !(event.target as HTMLElement).closest('button,input')
                      ) {
                        onActivateRow(row);
                      }
                    }}
                    aria-selected={selectable ? selected.has(id) : undefined}
                    className={cn(
                      'border-border/50 absolute inset-x-0 grid items-center border-b',
                      isRowMuted?.(row) && 'opacity-60',
                      activeIndex === item.index && 'bg-primary/10',
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
        layouts={layouts}
        labels={settingsLabels}
      />
    </div>
  );
}
