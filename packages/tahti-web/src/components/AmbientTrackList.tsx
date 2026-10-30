import {
  AlignJustifyIcon,
  LayoutGridIcon,
  ListIcon,
  Rows2Icon,
  Rows3Icon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { Card, CardGrid, SegmentedControl } from '@tahti-player/ui';

import { cn } from '../lib/cn';
import {
  AmbientTrackRow,
  type AmbientTrackRowDensity,
  type AmbientTrackRowProps,
} from './AmbientTrackRow';
import { PageEmpty } from './PageStates';

export const AMBIENT_TRACK_DENSITIES: AmbientTrackRowDensity[] = [
  'comfortable',
  'compact',
  'dense',
];

const SIZE_OPTIONS = [
  {
    id: 'comfortable' as const,
    label: 'Large',
    icon: <Rows3Icon size={14} aria-hidden />,
  },
  {
    id: 'compact' as const,
    label: 'Medium',
    icon: <Rows2Icon size={14} aria-hidden />,
  },
  {
    id: 'dense' as const,
    label: 'Small',
    icon: <AlignJustifyIcon size={14} aria-hidden />,
  },
];

const LIST_OPTION = {
  id: 'list' as const,
  label: 'List',
  icon: <ListIcon size={14} aria-hidden />,
};

const GRID_OPTION = {
  id: 'grid' as const,
  label: 'Grid',
  icon: <LayoutGridIcon size={14} aria-hidden />,
};

/** A row density, `list` (a plain data table) or `grid` (cover cards). */
export type AmbientTrackListView = AmbientTrackRowDensity | 'list' | 'grid';

const STORAGE_KEY = 'tahti.ambientTrackList.density';

function readStoredView(
  fallback: AmbientTrackListView,
  allowList: boolean,
  allowGrid: boolean,
): AmbientTrackListView {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'list' && allowList) {
      return 'list';
    }
    if (raw === 'grid' && allowGrid) {
      return 'grid';
    }
    if (
      raw &&
      AMBIENT_TRACK_DENSITIES.includes(raw as AmbientTrackRowDensity)
    ) {
      return raw as AmbientTrackRowDensity;
    }
  } catch {
    /* private mode */
  }
  return fallback;
}

export type AmbientTrackListItem = Omit<
  AmbientTrackRowProps,
  'density' | 'className'
> & {
  id: string;
};

export type AmbientTrackListProps = {
  items: AmbientTrackListItem[];
  /** Controlled density — omit to self-manage (+ persist). */
  density?: AmbientTrackRowDensity;
  defaultDensity?: AmbientTrackRowDensity;
  onDensityChange?: (density: AmbientTrackRowDensity) => void;
  /** Persist density to localStorage (default true when uncontrolled). */
  persistDensity?: boolean;
  emptyMessage?: string;
  /** What the header counts, e.g. `sound` reads "3 sounds". */
  itemNoun?: string;
  /** Extra controls beside the size switcher. */
  toolbarEnd?: ReactNode;
  /** Offers a List option in the switcher; renders this in place of the rows. */
  renderList?: () => ReactNode;
  /** Offers a Grid option: cover cards with play, no waveform. */
  allowGrid?: boolean;
  className?: string;
};

export function AmbientTrackList({
  items,
  density: densityProp,
  defaultDensity = 'comfortable',
  onDensityChange,
  persistDensity,
  emptyMessage = 'No tracks yet.',
  itemNoun = 'track',
  toolbarEnd,
  renderList,
  allowGrid = false,
  className,
}: AmbientTrackListProps) {
  const controlled = densityProp !== undefined;
  const shouldPersist = persistDensity ?? !controlled;
  const [internal, setInternal] = useState<AmbientTrackListView>(() =>
    shouldPersist
      ? readStoredView(defaultDensity, Boolean(renderList), allowGrid)
      : defaultDensity,
  );
  const view: AmbientTrackListView = controlled ? densityProp : internal;
  const showList = view === 'list' && Boolean(renderList);
  const showGrid = view === 'grid' && allowGrid;
  const density: AmbientTrackRowDensity =
    view === 'list' || view === 'grid' ? defaultDensity : view;
  const activeView: AmbientTrackListView = showList
    ? 'list'
    : showGrid
      ? 'grid'
      : density;
  const options = [
    ...SIZE_OPTIONS,
    ...(allowGrid ? [GRID_OPTION] : []),
    ...(renderList ? [LIST_OPTION] : []),
  ];

  useEffect(() => {
    if (!shouldPersist) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view, shouldPersist]);

  const setView = (next: AmbientTrackListView) => {
    if (!controlled) {
      setInternal(next);
    }
    if (next !== 'list' && next !== 'grid') {
      onDensityChange?.(next);
    }
  };

  if (items.length === 0) {
    return (
      <PageEmpty
        title={emptyMessage}
        className={className}
        data-testid="ambient-track-list"
      />
    );
  }

  return (
    <section
      className={cn(
        'border-border/40 bg-background-secondary/40 flex w-full min-w-0 flex-col gap-2 rounded-[var(--radius-card)] border p-2 sm:p-3',
        className,
      )}
      data-testid="ambient-track-list"
      data-density={activeView}
    >
      <div
        className="flex flex-wrap items-center gap-2 px-1"
        data-testid="ambient-track-list-toolbar"
      >
        <span className="text-foreground-secondary me-auto text-xs font-semibold tabular-nums">
          {items.length} {items.length === 1 ? itemNoun : `${itemNoun}s`}
        </span>
        {toolbarEnd}
        <SegmentedControl
          aria-label="Track size"
          iconOnly
          className="bg-background-input"
          options={options}
          value={activeView}
          onChange={setView}
        />
      </div>
      {showList && renderList ? (
        renderList()
      ) : showGrid ? (
        <CardGrid data-testid="ambient-track-grid">
          {items.map((item) => (
            <Card
              key={item.id}
              src={item.coverUrl ?? undefined}
              title={item.titleNode ?? item.title}
              subtitle={item.artist}
              surface="neutral"
              onPlay={item.onPlay}
              isPlaying={item.isPlaying}
              playLabel={`Play ${item.title}`}
              pauseLabel={`Pause ${item.title}`}
            />
          ))}
        </CardGrid>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const { id, ...row } = item;
            return (
              <li key={id} className="min-w-0 list-none">
                <AmbientTrackRow {...row} density={density} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
