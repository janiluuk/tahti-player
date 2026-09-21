import {
  createEvent,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CatalogTable } from './CatalogTable';
import type { CatalogLayoutsApi } from './CatalogTableSettingsDialog';
import {
  defaultCatalogView,
  type CatalogColumn,
  type CatalogSort,
} from './viewState';

type Row = { id: string; title: string; artist: string; year: number };
const rows: Row[] = [
  { id: 'a', title: 'Alpha', artist: 'Zed', year: 2001 },
  { id: 'b', title: 'Beta', artist: 'Amy', year: 1999 },
  { id: 'c', title: 'Gamma', artist: 'Bob', year: 2010 },
];
const columns: CatalogColumn<Row>[] = [
  {
    id: 'title',
    header: 'Title',
    width: 200,
    sortable: true,
    required: true,
    render: (r) => r.title,
  },
  {
    id: 'artist',
    header: 'Artist',
    width: 150,
    sortable: true,
    render: (r) => r.artist,
  },
  {
    id: 'year',
    header: 'Year',
    width: 80,
    sortable: true,
    hiddenByDefault: true,
    render: (r) => r.year,
  },
];

function Harness({
  onSort = vi.fn(),
  onLoadMore,
  total = rows.length,
  onSelectAllMatching,
  onActivateRow,
  onRowKeyDown,
  layouts,
  onMoveRows,
}: {
  onSort?: (sort: CatalogSort | null) => void;
  onLoadMore?: () => void;
  total?: number;
  onSelectAllMatching?: () => void;
  onActivateRow?: (row: Row) => void;
  onRowKeyDown?: (event: React.KeyboardEvent, row: Row) => void;
  layouts?: CatalogLayoutsApi;
  onMoveRows?: (ids: string[], toIndex: number) => void;
}) {
  const [view, setView] = useState(defaultCatalogView(columns));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<CatalogSort | null>(null);
  return (
    <CatalogTable
      columns={columns}
      view={view}
      onViewChange={setView}
      rows={rows}
      total={total}
      getRowId={(r) => r.id}
      getRowLabel={(r) => r.title}
      sort={sort}
      onSortChange={(next) => {
        setSort(next);
        onSort(next);
      }}
      onLoadMore={onLoadMore}
      onSelectAllMatching={onSelectAllMatching}
      onActivateRow={onActivateRow}
      onRowKeyDown={onRowKeyDown}
      layouts={layouts}
      onMoveRows={onMoveRows}
      selectedIds={selected}
      onSelectedIdsChange={setSelected}
      itemNoun="tracks"
    />
  );
}

beforeAll(() => {
  // jsdom has no layout; give the virtualizer's scroll element a real size.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: 600,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 800,
  });
});

describe('CatalogTable', () => {
  it('renders visible columns only and rows from the data', () => {
    render(<Harness />);
    expect(screen.getByRole('columnheader', { name: /Title/ })).toBeTruthy();
    expect(screen.queryByRole('columnheader', { name: /Year/ })).toBeNull();
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('3 tracks')).toBeTruthy();
  });

  it('asks the owner to sort and reflects aria-sort through the cycle', () => {
    const onSort = vi.fn();
    render(<Harness onSort={onSort} />);
    const header = () => screen.getByRole('columnheader', { name: /Artist/ });
    fireEvent.click(within(header()).getByRole('button'));
    expect(onSort).toHaveBeenLastCalledWith({
      columnId: 'artist',
      descending: false,
    });
    expect(header().getAttribute('aria-sort')).toBe('ascending');
    fireEvent.click(within(header()).getByRole('button'));
    expect(header().getAttribute('aria-sort')).toBe('descending');
    fireEvent.click(within(header()).getByRole('button'));
    expect(onSort).toHaveBeenLastCalledWith(null);
    expect(header().getAttribute('aria-sort')).toBeNull();
  });

  it('supports row, shift-range and select-all selection', () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    expect(screen.getByText(/1 selected/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Select Gamma'), { shiftKey: true });
    expect(screen.getByText(/3 selected/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByText(/selected/)).toBeNull();
    fireEvent.click(screen.getByLabelText('Select all loaded tracks'));
    expect(screen.getByText(/3 selected/)).toBeTruthy();
  });

  it('lets the user choose fields and their order in a settings dialog', async () => {
    const { container } = render(<Harness />);
    // The open dialog makes the page inert, so read headers from the DOM.
    const headerText = () =>
      [...container.querySelectorAll('[role="columnheader"]')]
        .map((header) => header.textContent)
        .join('|');
    fireEvent.click(screen.getByRole('button', { name: 'Table settings' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog)
        .getByRole('switch', { name: 'Show Title' })
        .hasAttribute('disabled'),
    ).toBe(true);

    fireEvent.click(within(dialog).getByRole('switch', { name: 'Show Year' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Move Year up' }),
    );
    expect(headerText()).toMatch(/Title.*Year.*Artist/);

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Reset to defaults' }),
    );
    expect(headerText()).not.toMatch(/Year/);
  });

  it('requests more rows when scrolled near the end of a partial load', () => {
    const onLoadMore = vi.fn();
    render(<Harness total={500} onLoadMore={onLoadMore} />);
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('does not request more once everything is loaded', () => {
    const onLoadMore = vi.fn();
    render(<Harness onLoadMore={onLoadMore} />);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('offers to select every matching row once all loaded rows are selected', () => {
    const onSelectAllMatching = vi.fn();
    render(<Harness total={1234} onSelectAllMatching={onSelectAllMatching} />);
    expect(
      screen.queryByRole('button', { name: /Select all 1,234/ }),
    ).toBeNull();
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    expect(
      screen.queryByRole('button', { name: /Select all 1,234/ }),
    ).toBeNull();
    fireEvent.click(screen.getByLabelText('Select all loaded tracks'));
    fireEvent.click(screen.getByRole('button', { name: /Select all 1,234/ }));
    expect(onSelectAllMatching).toHaveBeenCalledOnce();
  });

  it('says all are selected when the selection covers the whole result', () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText('Select all loaded tracks'));
    expect(screen.getByText(/All 3 selected/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Select all 3/ })).toBeNull();
  });

  describe('keyboard', () => {
    const rowsEl = () => screen.getByLabelText('Rows');
    const press = (key: string, init: KeyboardEventInit = {}) =>
      fireEvent.keyDown(rowsEl(), { key, ...init });

    it('moves the active row with arrows and toggles it with space', () => {
      render(<Harness />);
      press('ArrowDown');
      press('ArrowDown');
      expect(rowsEl().getAttribute('aria-activedescendant')).toMatch(/-r1$/);
      press(' ');
      expect(
        (screen.getByLabelText('Select Beta') as HTMLInputElement).checked,
      ).toBe(true);
      expect(
        (screen.getByLabelText('Select Alpha') as HTMLInputElement).checked,
      ).toBe(false);
      press(' ');
      expect(
        (screen.getByLabelText('Select Beta') as HTMLInputElement).checked,
      ).toBe(false);
    });

    it('extends the selection with shift+arrows and clamps at the ends', () => {
      render(<Harness />);
      press('ArrowDown');
      press('ArrowDown', { shiftKey: true });
      press('ArrowDown', { shiftKey: true });
      press('ArrowDown', { shiftKey: true });
      expect(screen.getByText(/3 selected/)).toBeTruthy();
      expect(rowsEl().getAttribute('aria-activedescendant')).toMatch(/-r2$/);
      press('Home');
      expect(rowsEl().getAttribute('aria-activedescendant')).toMatch(/-r0$/);
      press('ArrowUp');
      expect(rowsEl().getAttribute('aria-activedescendant')).toMatch(/-r0$/);
    });

    it('activates with Enter and double-click, selects all with ctrl+A, clears with Escape', () => {
      const onActivateRow = vi.fn();
      render(<Harness onActivateRow={onActivateRow} />);
      press('ArrowDown');
      press('Enter');
      expect(onActivateRow).toHaveBeenLastCalledWith(rows[0]);
      fireEvent.doubleClick(screen.getByText('Gamma'));
      expect(onActivateRow).toHaveBeenLastCalledWith(rows[2]);
      press('a', { ctrlKey: true });
      expect(screen.getByText(/All 3 selected/)).toBeTruthy();
      press('Escape');
      expect(screen.queryByText(/selected/)).toBeNull();
    });

    it('ctrl+A selects every matching row when more than the loaded ones match', () => {
      const onSelectAllMatching = vi.fn();
      render(<Harness total={900} onSelectAllMatching={onSelectAllMatching} />);
      press('a', { metaKey: true });
      expect(onSelectAllMatching).toHaveBeenCalledOnce();
    });

    it('hands unhandled keys to the owner with the focused row', () => {
      const onRowKeyDown = vi.fn();
      render(<Harness onRowKeyDown={onRowKeyDown} />);
      press('ArrowDown');
      press('ArrowDown');
      press('i');
      expect(onRowKeyDown.mock.calls[0]?.[1]).toEqual(rows[1]);
    });
  });

  describe('saved layouts', () => {
    const layouts = (
      extra: Partial<CatalogLayoutsApi> = {},
    ): CatalogLayoutsApi => ({
      names: ['Compact'],
      onSave: vi.fn(),
      onApply: vi.fn(),
      onDelete: vi.fn(),
      ...extra,
    });

    it('saves the current layout under a trimmed name and applies a saved one', async () => {
      const api = layouts();
      render(<Harness layouts={api} />);
      fireEvent.click(screen.getByRole('button', { name: 'Table settings' }));
      const dialog = await screen.findByRole('dialog');
      const save = within(dialog).getByRole('button', {
        name: 'Save current layout',
      });
      expect(save.hasAttribute('disabled')).toBe(true);
      fireEvent.change(within(dialog).getByLabelText('Layout name'), {
        target: { value: '  Wide  ' },
      });
      fireEvent.click(save);
      expect(api.onSave).toHaveBeenCalledWith('Wide');
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Apply layout Compact' }),
      );
      expect(api.onApply).toHaveBeenCalledWith('Compact');
    });

    it('asks before deleting a saved layout', async () => {
      const api = layouts();
      render(<Harness layouts={api} />);
      fireEvent.click(screen.getByRole('button', { name: 'Table settings' }));
      const dialog = await screen.findByRole('dialog');
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Delete layout Compact' }),
      );
      expect(api.onDelete).not.toHaveBeenCalled();
      const dialogs = await screen.findAllByRole('dialog');
      const confirm = dialogs[dialogs.length - 1] as HTMLElement;
      expect(within(confirm).getByText('Delete this layout?')).toBeTruthy();
      fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
      expect(api.onDelete).toHaveBeenCalledWith('Compact');
    });

    it('shows an empty state when nothing is saved', async () => {
      render(<Harness layouts={layouts({ names: [] })} />);
      fireEvent.click(screen.getByRole('button', { name: 'Table settings' }));
      expect(await screen.findByText('No saved layouts yet.')).toBeTruthy();
    });
  });

  describe('reordering', () => {
    const rowsEl = () => screen.getByLabelText('Rows');
    const press = (key: string, init: KeyboardEventInit = {}) =>
      fireEvent.keyDown(rowsEl(), { key, ...init });
    const row = (title: string) =>
      screen.getByText(title).closest('[role="row"]') as HTMLElement;
    /** jsdom has no layout or pointer coordinates: report the pointer as above or below a row's middle. */
    const dragOver = (title: string, half: 'upper' | 'lower') => {
      const element = row(title);
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        height: 40,
      } as DOMRect);
      const event = createEvent.dragOver(element);
      Object.defineProperty(event, 'clientY', {
        value: half === 'upper' ? 110 : 130,
      });
      fireEvent(element, event);
    };

    it('moves the active row with Alt+arrows, counting among the rows that stay', () => {
      const onMoveRows = vi.fn();
      render(<Harness onMoveRows={onMoveRows} />);
      press('ArrowDown');
      press('ArrowDown', { altKey: true });
      expect(onMoveRows).toHaveBeenLastCalledWith(['a'], 1);
      // The active row follows the moved row, so Alt+Up now moves the next one.
      press('ArrowUp', { altKey: true });
      expect(onMoveRows).toHaveBeenLastCalledWith(['b'], 0);
      press('End');
      press('ArrowUp', { altKey: true });
      expect(onMoveRows).toHaveBeenLastCalledWith(['c'], 1);
    });

    it('moves the whole selection as a block when the active row is selected', () => {
      const onMoveRows = vi.fn();
      render(<Harness onMoveRows={onMoveRows} />);
      fireEvent.click(screen.getByLabelText('Select Alpha'));
      fireEvent.click(screen.getByLabelText('Select Beta'));
      press('ArrowDown');
      press('ArrowDown', { altKey: true });
      expect(onMoveRows).toHaveBeenLastCalledWith(['a', 'b'], 1);
    });

    it('does nothing when reordering is not enabled', () => {
      render(<Harness />);
      press('ArrowDown');
      press('ArrowDown', { altKey: true });
      expect(row('Alpha').getAttribute('draggable')).toBeNull();
    });

    it('reorders by dragging a row onto another and shows where it will land', () => {
      const onMoveRows = vi.fn();
      render(<Harness onMoveRows={onMoveRows} />);
      expect(row('Alpha').getAttribute('draggable')).toBe('true');
      const data = { setData: vi.fn(), effectAllowed: '' };
      fireEvent.dragStart(row('Alpha'), { dataTransfer: data });
      dragOver('Gamma', 'lower');
      expect(screen.getAllByTestId('drop-indicator')).toHaveLength(1);
      fireEvent.drop(row('Gamma'));
      expect(onMoveRows).toHaveBeenCalledWith(['a'], 2);
      expect(screen.queryByTestId('drop-indicator')).toBeNull();
    });

    it('drags the whole selection when a selected row is dragged', () => {
      const onMoveRows = vi.fn();
      render(<Harness onMoveRows={onMoveRows} />);
      fireEvent.click(screen.getByLabelText('Select Alpha'));
      fireEvent.click(screen.getByLabelText('Select Gamma'));
      const data = { setData: vi.fn(), effectAllowed: '' };
      fireEvent.dragStart(row('Gamma'), { dataTransfer: data });
      dragOver('Beta', 'upper');
      fireEvent.drop(row('Beta'));
      expect(onMoveRows).toHaveBeenCalledWith(['a', 'c'], 0);
    });

    it('ignores drops that were not started from a row', () => {
      const onMoveRows = vi.fn();
      render(<Harness onMoveRows={onMoveRows} />);
      fireEvent.dragOver(row('Beta'));
      fireEvent.drop(row('Beta'));
      expect(onMoveRows).not.toHaveBeenCalled();
    });
  });
});
