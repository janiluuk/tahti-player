import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';

import {
  CatalogTable,
  defaultCatalogView,
  type CatalogColumn,
  type CatalogSort,
} from '@tahti-player/ui';

type Row = {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  minutes: number;
};

const ARTISTS = [
  'Vladislav Delay',
  'Actress',
  'Burial',
  'Pole',
  'Basic Channel',
];
const ROWS: Row[] = Array.from({ length: 5000 }, (_, index) => ({
  id: `row-${index}`,
  title: `Track ${String(index + 1).padStart(4, '0')}`,
  artist: ARTISTS[index % ARTISTS.length] as string,
  album: `Album ${(index % 40) + 1}`,
  year: 1996 + (index % 28),
  minutes: 3 + (index % 9),
}));

const COLUMNS: CatalogColumn<Row>[] = [
  {
    id: 'title',
    header: 'Title',
    width: 220,
    sortable: true,
    required: true,
    render: (r) => r.title,
  },
  {
    id: 'artist',
    header: 'Artist',
    width: 170,
    sortable: true,
    render: (r) => r.artist,
  },
  {
    id: 'album',
    header: 'Album',
    width: 150,
    sortable: true,
    render: (r) => r.album,
  },
  {
    id: 'year',
    header: 'Year',
    width: 80,
    sortable: true,
    align: 'right',
    render: (r) => r.year,
  },
  {
    id: 'minutes',
    header: 'Minutes',
    width: 90,
    sortable: true,
    align: 'right',
    hiddenByDefault: true,
    render: (r) => r.minutes,
  },
];

function Demo() {
  const [view, setView] = useState(() => defaultCatalogView(COLUMNS));
  const [sort, setSort] = useState<CatalogSort | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(100);
  const [layouts, setLayouts] = useState<
    Record<string, { view: typeof view; sort: CatalogSort | null }>
  >({});
  const sorted = useMemo(() => {
    if (!sort) {
      return ROWS;
    }
    const key = sort.columnId as keyof Row;
    return [...ROWS].sort((a, b) => {
      const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
      return (sort.descending ? -order : order) || a.id.localeCompare(b.id);
    });
  }, [sort]);
  return (
    <div className="border-border flex h-[28rem] w-[44rem] flex-col border p-2">
      <CatalogTable
        columns={COLUMNS}
        view={view}
        onViewChange={setView}
        rows={sorted.slice(0, loaded)}
        total={sorted.length}
        itemNoun="tracks"
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.title}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setLoaded(100);
        }}
        onLoadMore={() => setLoaded((count) => count + 100)}
        selectedIds={selected}
        onSelectedIdsChange={setSelected}
        onSelectAllMatching={() =>
          setSelected(new Set(sorted.map((row) => row.id)))
        }
        onActivateRow={(row) => console.info(`Activated ${row.title}`)}
        layouts={{
          names: Object.keys(layouts),
          onSave: (name) =>
            setLayouts((current) => ({ ...current, [name]: { view, sort } })),
          onApply: (name) => {
            const layout = layouts[name];
            if (layout) {
              setView(layout.view);
              setSort(layout.sort);
            }
          },
          onDelete: (name) =>
            setLayouts((current) => {
              const rest = { ...current };
              delete rest[name];
              return rest;
            }),
        }}
      />
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Components/CatalogTable',
  component: Demo,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** 5,000 rows, paged 100 at a time on scroll; only visible rows are mounted.
 * Click a header to sort, drag a header edge to resize, and open the gear to
 * choose fields, their order and saved layouts. Click into the rows and use
 * arrows, Space, Shift+arrows, Ctrl+A, Escape and Enter. */
export const Default: Story = {};
