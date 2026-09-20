import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CatalogTable } from './CatalogTable';
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
}: {
  onSort?: (sort: CatalogSort | null) => void;
  onLoadMore?: () => void;
  total?: number;
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
});
