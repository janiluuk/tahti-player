import { useState, type ReactNode } from 'react';

import { Card, CardGrid } from '@tahti-player/ui';

import { cn } from '../lib/cn';
import {
  useTrackListViewStore,
  type TrackListView,
} from '../stores/trackListViewStore';
import {
  AmbientTrackRow,
  type AmbientTrackRowDensity,
  type AmbientTrackRowProps,
} from './AmbientTrackRow';
import { PageEmpty } from './PageStates';
import { trackViewOptions, TrackViewPicker } from './TrackViewPicker';

export const AMBIENT_TRACK_DENSITIES: AmbientTrackRowDensity[] = [
  'comfortable',
  'compact',
  'dense',
];

/** A row density, `list` (a plain data table) or `grid` (cover cards). */
export type AmbientTrackListView = TrackListView;

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
  /** Share the remembered view with other track lists (default true when
   * uncontrolled). */
  persistDensity?: boolean;
  emptyMessage?: string;
  /** What the header counts, e.g. `sound` reads "3 sounds". */
  itemNoun?: string;
  /** Leads the toolbar row, e.g. a filter box. With it the toolbar stays
   * up when `items` is empty, so the filter can be cleared. */
  toolbarStart?: ReactNode;
  /** Extra controls before the size picker, e.g. a sort dropdown. */
  toolbarEnd?: ReactNode;
  /** The page renders the size picker elsewhere (bound to the same store). */
  hideViewPicker?: boolean;
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
  toolbarStart,
  toolbarEnd,
  hideViewPicker = false,
  renderList,
  allowGrid = false,
  className,
}: AmbientTrackListProps) {
  const controlled = densityProp !== undefined;
  const shouldPersist = persistDensity ?? !controlled;
  const storedView = useTrackListViewStore((state) => state.view);
  const storeView = useTrackListViewStore((state) => state.setView);
  const [internal, setInternal] =
    useState<AmbientTrackListView>(defaultDensity);
  const view: AmbientTrackListView = controlled
    ? densityProp
    : shouldPersist
      ? (storedView ?? defaultDensity)
      : internal;
  const showList = view === 'list' && Boolean(renderList);
  const showGrid = view === 'grid' && allowGrid;
  const density: AmbientTrackRowDensity =
    view === 'list' || view === 'grid' ? defaultDensity : view;
  const activeView: AmbientTrackListView = showList
    ? 'list'
    : showGrid
      ? 'grid'
      : density;
  const options = trackViewOptions({
    allowGrid,
    allowList: Boolean(renderList),
  });

  const setView = (next: AmbientTrackListView) => {
    if (!controlled) {
      if (shouldPersist) {
        storeView(next);
      } else {
        setInternal(next);
      }
    }
    if (next !== 'list' && next !== 'grid') {
      onDensityChange?.(next);
    }
  };

  if (items.length === 0 && !toolbarStart) {
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
        className={cn(
          'flex items-center gap-2 px-1',
          toolbarStart ? 'flex-nowrap' : 'flex-wrap',
        )}
        data-testid="ambient-track-list-toolbar"
      >
        {toolbarStart ? (
          <div className="min-w-0 flex-1">{toolbarStart}</div>
        ) : null}
        <span
          className={cn(
            'text-foreground-secondary shrink-0 text-xs font-semibold tabular-nums',
            toolbarStart ? 'hidden sm:inline' : 'me-auto',
          )}
        >
          {items.length} {items.length === 1 ? itemNoun : `${itemNoun}s`}
        </span>
        {toolbarEnd}
        {hideViewPicker ? null : (
          <TrackViewPicker
            options={options}
            value={activeView}
            onChange={setView}
          />
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-foreground-secondary px-1 py-6 text-center text-sm">
          {emptyMessage}
        </p>
      ) : null}
      {items.length === 0 ? null : showList && renderList ? (
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
